import type { NextFunction, Request, Response } from 'express';
import { AUTH_MESSAGES } from '../constants/messages.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import type { ErrorResponseDto, IAuthDtoValidator } from '../contracts/index.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { sendError, sendSuccess } from '../utils/responseSender.js';
import type { AuthService } from '../services/authService.js';
import type { PublicUser } from '../types/models.js';

export class AuthController {
  constructor(
    private readonly _service: AuthService,
    private readonly _validator: IAuthDtoValidator
  ) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateSignup(req.body);
      const result = await this._service.signup(dto);
      sendSuccess(res, STATUS_CODES.CREATED, result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateLogin(req.body);
      const result = await this._service.login(dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateVerifyOtp(req.body);
      const result = await this._service.verifyOtp(dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = this._validator.validateResendOtp(req.body);
      const result = await this._service.resendOtp(dto);
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: AuthenticatedRequest,
    res: Response<{ user: PublicUser } | ErrorResponseDto>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = req.body as { name?: string };
      const profilePhotoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const user = await this._service.updateProfile(req.user.userId, {
        name: body.name,
        profilePhotoUrl
      });
      sendSuccess(res, STATUS_CODES.OK, { user });
    } catch (error) {
      next(error);
    }
  };

  me = async (
    req: AuthenticatedRequest,
    res: Response<{ user: PublicUser } | ErrorResponseDto>,
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
