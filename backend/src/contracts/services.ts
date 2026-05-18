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
import type { AuthTokenPayload, PublicUser } from '../types/models.js';

export type AuthResponse = {
  message: string;
  user: PublicUser;
  token?: string;
  refreshToken?: string;
  devOtp?: string;
  devResetOtp?: string;
};

export type PdfMetadata = {
  pageCount: number;
};

export type SendOtpResult = {
  delivered: boolean;
  devMode: boolean;
};

export interface IAuthService {
  signup(input: SignupDto): Promise<AuthResponse>;
  verifyOtp(input: VerifyOtpDto): Promise<AuthResponse>;
  resendOtp(input: ResendOtpDto): Promise<AuthResponse>;
  login(input: LoginDto): Promise<AuthResponse>;
  refreshToken(input: RefreshTokenDto): Promise<AuthResponse>;
  forgotPassword(input: ForgotPasswordDto): Promise<AuthResponse>;
  resetPassword(input: ResetPasswordDto): Promise<AuthResponse>;
  updateProfile(userId: string, input: UpdateProfileDto): Promise<PublicUser>;
  changePassword(userId: string, input: ChangePasswordDto): Promise<AuthResponse>;
  getUserById(userId: string): Promise<PublicUser | null>;
  verifyToken(token: string): AuthTokenPayload;
}

export interface IPdfService {
  extractPages(sourcePath: string, pageIndices: number[]): Promise<Buffer>;
  validatePageRange(sourcePath: string, pageIndices: number[]): Promise<PdfMetadata>;
  getMetadata(sourcePath: string): Promise<PdfMetadata>;
}

export interface IEmailService {
  sendOtp(email: string, otp: string): Promise<SendOtpResult>;
  sendPasswordResetOtp(email: string, otp: string): Promise<SendOtpResult>;
}
