import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AUTH_MESSAGES } from '../constants/messages.js';
import { redis } from '../config/redis.js';
import type { EmailService } from './emailService.js';
import type { IUserMapper } from '../contracts/mappers.js';
import type { IUserRepository } from '../contracts/repositories.js';
import type { PublicUser, UserRecord, AuthTokenPayload } from '../types/models.js';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
  private readonly JWT_EXPIRES_IN = '1d';
  private readonly OTP_TTL = 300; // 5 minutes

  constructor(
    private readonly _repository: IUserRepository,
    private readonly _emailService: EmailService,
    private readonly _mapper: IUserMapper
  ) {}

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private getRedisKey(email: string): string {
    return `otp:${email.toLowerCase()}`;
  }

  private getLockoutKey(email: string): string {
    return `lockout:${email.toLowerCase()}`;
  }

  async requestOtp(email: string): Promise<{ message: string, devOtp?: string }> {
    const lockoutKey = this.getLockoutKey(email);
    const isLocked = await redis.get(lockoutKey);
    if (isLocked) {
      throw new Error(`You are temporarily locked out. Please try again later.`);
    }

    const redisKey = this.getRedisKey(email);
    const existingStr = await redis.get(redisKey);
    
    let resendCount = 0;
    if (existingStr) {
      const existing = JSON.parse(existingStr);
      resendCount = existing.resend_count || 0;
      
      if (resendCount >= 3) {
        // Block for 1 hour
        await redis.set(lockoutKey, 'true', 'EX', 3600);
        await redis.del(redisKey);
        throw new Error('Too many resend attempts. Please wait 1 hour.');
      }
      resendCount++;
    }

    const code = this.generateOtp();
    const payload = {
      code,
      attempts: 0,
      resend_count: resendCount
    };

    await redis.set(redisKey, JSON.stringify(payload), 'EX', this.OTP_TTL);
    
    await this._emailService.sendOtpEmail(email, code);

    // Development helper
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      message: 'OTP sent successfully to your email.',
      ...(isDev ? { devOtp: code } : {})
    };
  }

  async signup(input: { email: string; name: string }): Promise<{ message: string; devOtp?: string }> {
    let user = await this._repository.findByEmail(input.email);
    
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: '',
        isVerified: false,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpLastSentAt: null,
        createdAt: new Date().toISOString()
      };
      await this._repository.save(user);
    }

    return this.requestOtp(user.email);
  }

  async login(input: { email: string }): Promise<{ message: string; devOtp?: string }> {
    const user = await this._repository.findByEmail(input.email);
    if (!user) {
      throw new Error(AUTH_MESSAGES.USER_NOT_FOUND);
    }
    return this.requestOtp(user.email);
  }

  async verifyOtp(input: { email: string; otp: string }): Promise<{ message: string; user: PublicUser; token: string }> {
    const lockoutKey = this.getLockoutKey(input.email);
    const isLocked = await redis.get(lockoutKey);
    if (isLocked) {
      throw new Error(`You are temporarily locked out. Please try again later.`);
    }

    const redisKey = this.getRedisKey(input.email);
    const otpDataStr = await redis.get(redisKey);

    if (!otpDataStr) {
      throw new Error('OTP has expired or was not requested. Please request a new one.');
    }

    const otpData = JSON.parse(otpDataStr);

    if (otpData.attempts >= 3) {
      await redis.del(redisKey);
      await redis.set(lockoutKey, 'true', 'EX', 900); // 15 min lockout
      throw new Error('Too many failed attempts. You are locked out for 15 minutes.');
    }

    if (otpData.code !== input.otp) {
      otpData.attempts++;
      await redis.set(redisKey, JSON.stringify(otpData), 'KEEPTTL');
      throw new Error(AUTH_MESSAGES.INVALID_OTP);
    }

    // Success!
    await redis.del(redisKey);
    
    const user = await this._repository.findByEmail(input.email);
    if (!user) throw new Error(AUTH_MESSAGES.USER_NOT_FOUND);

    if (!user.isVerified) {
      user.isVerified = true;
      await this._repository.save(user);
    }

    const token = this.generateToken(user);

    return {
      message: 'Verified successfully',
      user: this._mapper.toPublicUser(user),
      token
    };
  }

  async resendOtp(input: { email: string }): Promise<{ message: string; devOtp?: string }> {
    return this.requestOtp(input.email);
  }

  private generateToken(user: UserRecord): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, this.JWT_SECRET) as AuthTokenPayload;
  }

  async updateProfile(userId: string, input: { name?: string; profilePhotoUrl?: string }): Promise<PublicUser> {
    const user = await this._repository.findById(userId);

    if (!user) {
      throw new Error(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    if (input.name) user.name = input.name;
    if (typeof input.profilePhotoUrl === 'string') user.profilePhotoUrl = input.profilePhotoUrl || null;

    await this._repository.save(user);
    return this._mapper.toPublicUser(user);
  }

  async getUserById(userId: string): Promise<PublicUser | null> {
    const user = await this._repository.findById(userId);
    return user ? this._mapper.toPublicUser(user) : null;
  }
}
