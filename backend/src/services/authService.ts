import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { AUTH_LIMITS, OTP_TIMING } from '../constants/config.js';
import { AUTH_MESSAGES } from '../constants/messages.js';
import type { IUserMapper } from '../contracts/mappers.js';
import type { IUserRepository } from '../contracts/repositories.js';
import type { AuthResponse, IAuthService, IEmailService } from '../contracts/services.js';
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
  SignupDto,
  UpdateProfileDto,
  VerifyOtpDto
} from '../dtos/authDtos.js';
import type { AuthTokenPayload, PublicUser, UserRecord } from '../types/models.js';

export class AuthService implements IAuthService {
  constructor(
    private readonly _repository: IUserRepository,
    private readonly _emailSender: IEmailService,
    private readonly _mapper: IUserMapper
  ) {}

  async signup(input: SignupDto): Promise<AuthResponse> {
    const existingUser = await this._repository.findByEmail(input.email);

    if (existingUser?.isVerified) {
      throw new Error(AUTH_MESSAGES.EMAIL_EXISTS);
    }

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, AUTH_LIMITS.BCRYPT_OTP_ROUNDS);
    const passwordHash = await bcrypt.hash(input.password, AUTH_LIMITS.BCRYPT_PASSWORD_ROUNDS);
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + AUTH_LIMITS.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const user: UserRecord = {
      id: existingUser?.id || crypto.randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash,
      isVerified: false,
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
      otpLastSentAt: now.toISOString(),
      createdAt: existingUser?.createdAt || now.toISOString()
    };

    await this._repository.save(user);
    const emailResult = await this._emailSender.sendOtp(input.email, otp);

    return {
      message: emailResult.delivered
        ? AUTH_MESSAGES.SIGNUP_OTP_SENT
        : AUTH_MESSAGES.SIGNUP_DEV_OTP,
      user: this._mapper.toPublicUser(user),
      devOtp: emailResult.devMode && process.env.NODE_ENV !== 'production' ? otp : undefined,
      ...this.getOtpTimingResponse(user.otpLastSentAt)
    };
  }

  async verifyOtp(input: VerifyOtpDto): Promise<AuthResponse> {
    const user = await this._repository.findByEmail(input.email);

    if (!user) {
      throw new Error(AUTH_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    if (user.isVerified) {
      return {
        message: AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED,
        user: this._mapper.toPublicUser(user),
        token: this.signToken(user)
      };
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      throw new Error(AUTH_MESSAGES.NO_ACTIVE_OTP);
    }

    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      throw new Error(AUTH_MESSAGES.OTP_EXPIRED);
    }

    if (user.otpAttempts >= AUTH_LIMITS.MAX_OTP_ATTEMPTS) {
      throw new Error(AUTH_MESSAGES.TOO_MANY_OTP_ATTEMPTS);
    }

    const isOtpValid = await bcrypt.compare(input.otp, user.otpHash);

    if (!isOtpValid) {
      user.otpAttempts += 1;
      await this._repository.save(user);
      throw new Error(`${AUTH_MESSAGES.INVALID_OTP} ${AUTH_LIMITS.MAX_OTP_ATTEMPTS - user.otpAttempts} attempts left.`);
    }

    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    user.otpLastSentAt = null;
    await this._repository.save(user);

    return {
      message: AUTH_MESSAGES.ACCOUNT_VERIFIED,
      user: this._mapper.toPublicUser(user),
      token: this.signToken(user),
      refreshToken: await this.createRefreshToken(user)
    };
  }

  async resendOtp(input: ResendOtpDto): Promise<AuthResponse> {
    const user = await this._repository.findByEmail(input.email);

    if (!user) {
      throw new Error(AUTH_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    if (user.isVerified) {
      throw new Error(AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED);
    }

    if (user.otpLastSentAt) {
      const secondsSinceLastSend = (Date.now() - new Date(user.otpLastSentAt).getTime()) / 1000;

      if (secondsSinceLastSend < OTP_TIMING.RESEND_AVAILABLE_AFTER_SECONDS) {
        throw new Error(
          AUTH_MESSAGES.RESEND_COOLDOWN.replace(
            '{seconds}',
            String(Math.ceil(OTP_TIMING.RESEND_AVAILABLE_AFTER_SECONDS - secondsSinceLastSend))
          )
        );
      }
    }

    const otp = this.generateOtp();
    user.otpHash = await bcrypt.hash(otp, AUTH_LIMITS.BCRYPT_OTP_ROUNDS);
    user.otpExpiresAt = new Date(Date.now() + AUTH_LIMITS.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date().toISOString();
    await this._repository.save(user);

    const emailResult = await this._emailSender.sendOtp(input.email, otp);

    return {
      message: emailResult.delivered
        ? AUTH_MESSAGES.RESEND_OTP_SENT
        : AUTH_MESSAGES.RESEND_DEV_OTP,
      user: this._mapper.toPublicUser(user),
      devOtp: emailResult.devMode && process.env.NODE_ENV !== 'production' ? otp : undefined,
      ...this.getOtpTimingResponse(user.otpLastSentAt)
    };
  }

  async login(input: LoginDto): Promise<AuthResponse> {
    const user = await this._repository.findByEmail(input.email);

    if (!user) {
      throw new Error(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isVerified) {
      throw new Error(AUTH_MESSAGES.VERIFY_BEFORE_LOGIN);
    }

    return {
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      user: this._mapper.toPublicUser(user),
      token: this.signToken(user),
      refreshToken: await this.createRefreshToken(user)
    };
  }

  async refreshToken(input: RefreshTokenDto): Promise<AuthResponse> {
    const user = await this._repository.findByRefreshToken(input.refreshToken);

    if (!user) {
      throw new Error(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (!user.refreshTokenExpiresAt || new Date(user.refreshTokenExpiresAt).getTime() < Date.now()) {
      throw new Error(AUTH_MESSAGES.REFRESH_TOKEN_EXPIRED);
    }

    const refreshToken = await this.createRefreshToken(user);

    return {
      message: AUTH_MESSAGES.REFRESH_TOKEN_SUCCESS,
      user: this._mapper.toPublicUser(user),
      token: this.signToken(user),
      refreshToken
    };
  }

  async forgotPassword(input: ForgotPasswordDto): Promise<AuthResponse> {
    const user = await this._repository.findByEmail(input.email);

    if (!user) {
      throw new Error(AUTH_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    if (user.passwordResetOtpLastSentAt) {
      const secondsSinceLastSend = (Date.now() - new Date(user.passwordResetOtpLastSentAt).getTime()) / 1000;

      if (secondsSinceLastSend < OTP_TIMING.RESEND_AVAILABLE_AFTER_SECONDS) {
        throw new Error(
          AUTH_MESSAGES.RESEND_COOLDOWN.replace(
            '{seconds}',
            String(Math.ceil(OTP_TIMING.RESEND_AVAILABLE_AFTER_SECONDS - secondsSinceLastSend))
          )
        );
      }
    }

    const otp = this.generateOtp();
    user.passwordResetOtpHash = await bcrypt.hash(otp, AUTH_LIMITS.BCRYPT_OTP_ROUNDS);
    user.passwordResetOtpExpiresAt = new Date(Date.now() + AUTH_LIMITS.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = new Date().toISOString();
    await this._repository.save(user);

    const emailResult = await this._emailSender.sendPasswordResetOtp(input.email, otp);

    return {
      message: emailResult.delivered ? AUTH_MESSAGES.RESET_OTP_SENT : AUTH_MESSAGES.RESET_DEV_OTP,
      user: this._mapper.toPublicUser(user),
      devResetOtp: emailResult.devMode && process.env.NODE_ENV !== 'production' ? otp : undefined,
      ...this.getOtpTimingResponse(user.passwordResetOtpLastSentAt)
    };
  }

  async resetPassword(input: ResetPasswordDto): Promise<AuthResponse> {
    const user = await this._repository.findByEmail(input.email);

    if (!user) {
      throw new Error(AUTH_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      throw new Error(AUTH_MESSAGES.NO_ACTIVE_PASSWORD_RESET);
    }

    if (new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now()) {
      throw new Error(AUTH_MESSAGES.OTP_EXPIRED);
    }

    const attempts = user.passwordResetOtpAttempts || 0;

    if (attempts >= AUTH_LIMITS.MAX_OTP_ATTEMPTS) {
      throw new Error(AUTH_MESSAGES.TOO_MANY_OTP_ATTEMPTS);
    }

    const isOtpValid = await bcrypt.compare(input.otp, user.passwordResetOtpHash);

    if (!isOtpValid) {
      user.passwordResetOtpAttempts = attempts + 1;
      await this._repository.save(user);
      throw new Error(`${AUTH_MESSAGES.INVALID_OTP} ${AUTH_LIMITS.MAX_OTP_ATTEMPTS - user.passwordResetOtpAttempts} attempts left.`);
    }

    user.passwordHash = await bcrypt.hash(input.password, AUTH_LIMITS.BCRYPT_PASSWORD_ROUNDS);
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = null;
    await this._repository.save(user);

    return {
      message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      user: this._mapper.toPublicUser(user)
    };
  }

  async updateProfile(userId: string, input: UpdateProfileDto): Promise<PublicUser> {
    const user = await this._repository.findById(userId);

    if (!user) {
      throw new Error(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    if (input.name) {
      user.name = input.name;
    }

    if (input.email && input.email !== user.email) {
      const existingUser = await this._repository.findByEmail(input.email);
      if (existingUser && existingUser.id !== user.id) {
        throw new Error(AUTH_MESSAGES.EMAIL_EXISTS);
      }
      user.email = input.email;
    }

    if (typeof input.profilePhotoUrl === 'string') {
      user.profilePhotoUrl = input.profilePhotoUrl || null;
    }

    await this._repository.save(user);
    return this._mapper.toPublicUser(user);
  }

  async changePassword(userId: string, input: ChangePasswordDto): Promise<AuthResponse> {
    const user = await this._repository.findById(userId);

    if (!user) {
      throw new Error(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new Error(AUTH_MESSAGES.INVALID_CURRENT_PASSWORD);
    }

    user.passwordHash = await bcrypt.hash(input.newPassword, AUTH_LIMITS.BCRYPT_PASSWORD_ROUNDS);
    await this._repository.save(user);

    return {
      message: AUTH_MESSAGES.PASSWORD_CHANGE_SUCCESS,
      user: this._mapper.toPublicUser(user)
    };
  }

  async getUserById(userId: string): Promise<PublicUser | null> {
    const user = await this._repository.findById(userId);
    return user ? this._mapper.toPublicUser(user) : null;
  }

  verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, this.getJwtSecret()) as AuthTokenPayload;
  }

  private signToken(user: UserRecord): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email
    };

    const expiresIn = (process.env.JWT_EXPIRES_IN || AUTH_LIMITS.DEFAULT_JWT_EXPIRES_IN) as SignOptions['expiresIn'];
    return jwt.sign(payload, this.getJwtSecret(), { expiresIn });
  }

  private async createRefreshToken(user: UserRecord): Promise<string> {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    user.refreshTokenHash = await bcrypt.hash(refreshToken, AUTH_LIMITS.BCRYPT_PASSWORD_ROUNDS);
    user.refreshTokenExpiresAt = new Date(
      Date.now() + AUTH_LIMITS.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    await this._repository.save(user);
    return refreshToken;
  }

  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error(AUTH_MESSAGES.JWT_SECRET_REQUIRED);
    }

    return secret || AUTH_LIMITS.DEFAULT_JWT_SECRET;
  }

  private generateOtp(): string {
    return crypto.randomInt(AUTH_LIMITS.OTP_MIN, AUTH_LIMITS.OTP_MAX).toString();
  }

  private getOtpTimingResponse(sentAt: string | null | undefined): Pick<AuthResponse, 'otpExpiresInSeconds' | 'resendAvailableInSeconds'> {
    if (!sentAt) {
      return {
        otpExpiresInSeconds: OTP_TIMING.EXPIRY_SECONDS,
        resendAvailableInSeconds: OTP_TIMING.RESEND_AVAILABLE_AFTER_SECONDS
      };
    }

    const secondsSinceSend = Math.max(0, Math.floor((Date.now() - new Date(sentAt).getTime()) / 1000));

    return {
      otpExpiresInSeconds: Math.max(0, OTP_TIMING.EXPIRY_SECONDS - secondsSinceSend),
      resendAvailableInSeconds: Math.max(0, OTP_TIMING.RESEND_AVAILABLE_AFTER_SECONDS - secondsSinceSend)
    };
  }
}
