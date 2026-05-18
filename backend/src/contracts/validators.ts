import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
  SignupDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from '../dtos/authDtos.js';
import type { ExtractPdfPagesDto } from '../dtos/pdfDtos.js';

export interface IAuthDtoValidator {
  validateSignup(body: unknown): SignupDto;
  validateLogin(body: unknown): LoginDto;
  validateVerifyOtp(body: unknown): VerifyOtpDto;
  validateResendOtp(body: unknown): ResendOtpDto;
  validateRefreshToken(body: unknown): RefreshTokenDto;
  validateForgotPassword(body: unknown): ForgotPasswordDto;
  validateResetPassword(body: unknown): ResetPasswordDto;
  validateUpdateProfile(body: unknown): UpdateProfileDto;
  validateChangePassword(body: unknown): ChangePasswordDto;
}

export interface IPdfDtoValidator {
  validateExtractPages(body: unknown): ExtractPdfPagesDto;
}
