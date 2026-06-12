import type { NextFunction, Request, Response } from 'express';
import { AUTH_MESSAGES } from '../constants/messages.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import type { ErrorResponseDto } from '../contracts/mappers.js';
import type { AuthResponse, IAuthService } from '../contracts/services.js';
import type { IAuthDtoValidator } from '../contracts/validators.js';
import type { IAuthController } from '../contracts/controllers.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { sendError, sendSuccess } from '../utils/responseSender.js';

/**
 * ARCHITECTURE: CONTROLLER LAYER
 * Purpose: Validate DTOs, call services, and shape HTTP responses.
 */
export class AuthController implements IAuthController {
  constructor(
    private readonly _service: IAuthService,
    private readonly _validator: IAuthDtoValidator
  ) {}

  signup = async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateSignup(req.body);
      const result = await this._service.signup(dto);
      sendSuccess(res, STATUS_CODES.CREATED, result);
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateVerifyOtp(req.body);
      const result = await this._service.verifyOtp(dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  resendOtp = async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateResendOtp(req.body);
      const result = await this._service.resendOtp(dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateLogin(req.body);
      const result = await this._service.login(dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateRefreshToken(req.body);
      const result = await this._service.refreshToken(dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateForgotPassword(req.body);
      const result = await this._service.forgotPassword(dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateResetPassword(req.body);
      const result = await this._service.resetPassword(dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: AuthenticatedRequest,
    res: Response<{ user: AuthResponse['user'] } | ErrorResponseDto>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = this._validator.validateUpdateProfile(req.body);
      const profilePhotoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const result = await this._service.updateProfile(req.user.userId, {
        ...dto,
        profilePhotoUrl
      });
      sendSuccess(res, STATUS_CODES.OK, { user: result });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: AuthenticatedRequest,
    res: Response<AuthResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = this._validator.validateChangePassword(req.body);
      const result = await this._service.changePassword(req.user.userId, dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  me = async (
    req: AuthenticatedRequest,
    res: Response<{ user: AuthResponse['user'] } | ErrorResponseDto>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this._service.getUserById(req.user.userId);

      if (!user) {
        sendError(res, STATUS_CODES.NOT_FOUND, AUTH_MESSAGES.USER_NOT_FOUND);
        return;
      }

      sendSuccess(res, STATUS_CODES.OK, { user });
    } catch (error) {
      next(error);
    }
  };
}
