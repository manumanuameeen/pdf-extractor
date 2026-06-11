import { AUTH_LIMITS } from '../constants/config.js';
import { AUTH_MESSAGES } from '../constants/messages.js';
import type { IAuthDtoValidator } from '../contracts/validators.js';

export type SignupDto = {
  name: string;
  email: string;
  password: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type VerifyOtpDto = {
  email: string;
  otp: string;
};

export type ResendOtpDto = {
  email: string;
};

export type ForgotPasswordDto = {
  email: string;
};

export type RefreshTokenDto = {
  refreshToken: string;
};

export type ResetPasswordDto = {
  email: string;
  otp: string;
  password: string;
};

export type UpdateProfileDto = {
  name?: string;
  email?: string;
  profilePhotoUrl?: string;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export class AuthDtoValidator implements IAuthDtoValidator {
  validateSignup(body: unknown): SignupDto {
    const name = this.readString(body, 'name');
    const email = this.normalizeEmail(this.readString(body, 'email'));
    const password = this.isRecord(body) && typeof body.password === 'string' ? body.password : '';

    if (name.length < AUTH_LIMITS.MIN_NAME_LENGTH) {
      throw new Error(AUTH_MESSAGES.NAME_TOO_SHORT);
    }

    this.assertEmail(email);
    this.assertPassword(password);

    return { name, email, password };
  }

  validateLogin(body: unknown): LoginDto {
    const email = this.normalizeEmail(this.readString(body, 'email'));
    const password = this.isRecord(body) && typeof body.password === 'string' ? body.password : '';

    this.assertEmail(email);
    this.assertPassword(password);

    return { email, password };
  }

  validateVerifyOtp(body: unknown): VerifyOtpDto {
    const email = this.normalizeEmail(this.readString(body, 'email'));
    const otp = this.readString(body, 'otp');

    this.assertEmail(email);

    this.assertOtp(otp);

    return { email, otp };
  }

  validateResendOtp(body: unknown): ResendOtpDto {
    const email = this.normalizeEmail(this.readString(body, 'email'));
    this.assertEmail(email);

    return { email };
  }

  validateRefreshToken(body: unknown): RefreshTokenDto {
    const refreshToken = this.readString(body, 'refreshToken');

    if (!refreshToken) {
      throw new Error(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    return { refreshToken };
  }

  validateForgotPassword(body: unknown): ForgotPasswordDto {
    const email = this.normalizeEmail(this.readString(body, 'email'));
    this.assertEmail(email);

    return { email };
  }

  validateResetPassword(body: unknown): ResetPasswordDto {
    const email = this.normalizeEmail(this.readString(body, 'email'));
    const otp = this.readString(body, 'otp');
    const password = this.isRecord(body) && typeof body.password === 'string' ? body.password : '';

    this.assertEmail(email);
    this.assertOtp(otp);
    this.assertPassword(password);

    return { email, otp, password };
  }

  validateUpdateProfile(body: unknown): UpdateProfileDto {
    const result: UpdateProfileDto = {};

    if (!this.isRecord(body)) {
      return result;
    }

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (name.length < AUTH_LIMITS.MIN_NAME_LENGTH) {
        throw new Error(AUTH_MESSAGES.NAME_TOO_SHORT);
      }
      result.name = name;
    }

    if (typeof body.email === 'string') {
      const email = this.normalizeEmail(body.email);
      this.assertEmail(email);
      result.email = email;
    }

    if (typeof body.profilePhotoUrl === 'string') {
      result.profilePhotoUrl = body.profilePhotoUrl.trim();
    }

    return result;
  }

  validateChangePassword(body: unknown): ChangePasswordDto {
    const currentPassword = this.isRecord(body) && typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = this.isRecord(body) && typeof body.newPassword === 'string' ? body.newPassword : '';

    this.assertPassword(currentPassword);
    this.assertPassword(newPassword);

    return { currentPassword, newPassword };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private readString(body: unknown, field: string): string {
    if (!this.isRecord(body) || typeof body[field] !== 'string') {
      return '';
    }

    return body[field].trim();
  }

  private assertEmail(email: string): void {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error(AUTH_MESSAGES.INVALID_EMAIL);
    }
  }

  private assertPassword(password: string): void {
    if (password.length < AUTH_LIMITS.MIN_PASSWORD_LENGTH) {
      throw new Error(AUTH_MESSAGES.PASSWORD_TOO_SHORT);
    }
  }

  private assertOtp(otp: string): void {
    if (!/^\d{6}$/.test(otp)) {
      throw new Error(AUTH_MESSAGES.INVALID_OTP);
    }
  }
}

export default new AuthDtoValidator();
