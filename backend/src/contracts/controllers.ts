import type { NextFunction, Request, Response } from 'express';
import type { AuthResponse } from './services.js';
import type { ErrorResponseDto } from './mappers.js';
import type { ExtractPdfResponseDto, UploadPdfResponseDto } from '../mappers/pdfMapper.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';

/**
 * ARCHITECTURE: CONTROLLER CONTRACTS
 * Purpose: Define contracts for all controller implementations to ensure consistency.
 */

export interface IAuthController {
  signup(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  verifyOtp(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  resendOtp(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  login(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  refreshToken(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  forgotPassword(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  resetPassword(req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  updateProfile(req: AuthenticatedRequest, res: Response<{ user: AuthResponse['user'] } | ErrorResponseDto>, next: NextFunction): Promise<void>;
  changePassword(req: AuthenticatedRequest, res: Response<AuthResponse>, next: NextFunction): Promise<void>;
  me(req: AuthenticatedRequest, res: Response<{ user: AuthResponse['user'] } | ErrorResponseDto>, next: NextFunction): Promise<void>;
}

export interface IPdfController {
  uploadPdf(req: AuthenticatedRequest, res: Response<UploadPdfResponseDto | ErrorResponseDto>, next: NextFunction): Promise<void>;
  extractPdfPages(req: AuthenticatedRequest<{ id: string }>, res: Response<ExtractPdfResponseDto | ErrorResponseDto>, next: NextFunction): Promise<void>;
  getPdf(req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction): Promise<void>;
  listUserPdfs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
  deletePdf(req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction): Promise<void>;
}
