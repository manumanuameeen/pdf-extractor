import type { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import type multer from 'multer';
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
import type { UploadedPdfInput, ExtractPdfResponseDto, UploadPdfResponseDto } from '../mappers/pdfMapper.js';
import type { AuthTokenPayload, PdfRecord, PublicUser, UserRecord } from '../types/models.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';

// ==========================================
// 1. CONFIG CONTRACTS
// ==========================================

export interface IDatabaseConnection {
  connect(): Promise<void>;
}

export interface ICleanupJob {
  start(uploadDir: string, outputDir: string): void;
}

export interface IMulterConfig {
  createUpload(): multer.Multer;
}

// ==========================================
// 2. CONTROLLER CONTRACTS
// ==========================================

export interface IAuthController {
  signup(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  verifyOtp(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  resendOtp(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  login(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  refreshToken(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  forgotPassword(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  resetPassword(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  updateProfile(
    req: AuthenticatedRequest,
    res: Response<{ user: AuthResponse['user'] } | ErrorResponseDto>,
    next: NextFunction
  ): Promise<void>;
  changePassword(req: AuthenticatedRequest, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  me(
    req: AuthenticatedRequest,
    res: Response<{ user: AuthResponse['user'] } | ErrorResponseDto>,
    next: NextFunction
  ): Promise<void>;
}

export interface IPdfController {
  uploadPdf(
    req: AuthenticatedRequest,
    res: Response<UploadPdfResponseDto | ErrorResponseDto>,
    next: NextFunction
  ): Promise<void>;
  extractPdfPages(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response<ExtractPdfResponseDto | ErrorResponseDto>,
    next: NextFunction
  ): Promise<void>;
  getPdf(req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction): Promise<void>;
  listUserPdfs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
  deletePdf(req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction): Promise<void>;
}

// ==========================================
// 3. MAPPER CONTRACTS
// ==========================================

export interface IUserMapper {
  toPublicUser(user: UserRecord): PublicUser;
}

export interface IPdfMapper {
  toRecord(input: UploadedPdfInput): PdfRecord;
  toUploadResponse(record: PdfRecord): UploadPdfResponseDto;
  toExtractResponse(fileName: string, pageCount: number): ExtractPdfResponseDto;
}

export type ErrorResponseDto = {
  error: string;
};

// ==========================================
// 4. REPOSITORY CONTRACTS
// ==========================================

export interface IRepository<TRecord extends { id: string }> {
  findAll(): Promise<TRecord[]>;
  findById(id: string): Promise<TRecord | null>;
  save(record: TRecord): Promise<TRecord>;
}

export interface IUserRepository extends IRepository<UserRecord> {
  findByEmail(email: string): Promise<UserRecord | null>;
  findByRefreshToken(refreshToken: string): Promise<UserRecord | null>;
}

export interface IPdfRepository extends IRepository<PdfRecord> {
  findOwnedByUser(id: string, userId: string): Promise<PdfRecord | null>;
  findByUserId(userId: string): Promise<PdfRecord[]>;
  delete(id: string): Promise<boolean>;
}

// ==========================================
// 5. ROUTE CONTRACTS
// ==========================================

export interface IRouteBuilder {
  router: Router;
}

// ==========================================
// 6. SERVICE CONTRACTS
// ==========================================

export type AuthResponse = {
  message: string;
  user?: PublicUser;
  token?: string;
  refreshToken?: string;
  devOtp?: string;
  devResetOtp?: string;
  otpExpiresInSeconds?: number;
  resendAvailableInSeconds?: number;
  requiresVerification?: boolean;
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
  savePdfRecord(
    userId: string,
    originalName: string,
    size: number,
    pageCount: number,
    path: string
  ): Promise<PdfRecord>;
  getUserPdfs(userId: string): Promise<PdfRecord[]>;
  deleteUserPdf(id: string, userId: string): Promise<boolean>;
}

export interface IEmailService {
  sendOtp(email: string, otp: string): Promise<SendOtpResult>;
  sendPasswordResetOtp(email: string, otp: string): Promise<SendOtpResult>;
}

// ==========================================
// 7. VALIDATOR CONTRACTS
// ==========================================

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
