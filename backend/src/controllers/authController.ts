import type { NextFunction, Request, Response } from 'express';
import { AUTH_MESSAGES } from '../constants/messages.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import type { ErrorResponseDto } from '../contracts/mappers.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { sendError, sendSuccess } from '../utils/responseSender.js';
import type { AuthService } from '../services/authService.js';
import type { PublicUser } from '../types/models.js';

export class AuthController {
  constructor(private readonly _service: AuthService) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email } = req.body;
      if (!name || !email) {
        sendError(res, STATUS_CODES.BAD_REQUEST, 'Name and email are required');
        return;
      }
      const result = await this._service.signup({ name, email });
      sendSuccess(res, STATUS_CODES.CREATED, result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        sendError(res, STATUS_CODES.BAD_REQUEST, 'Email is required');
        return;
      }
      const result = await this._service.login({ email });
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        sendError(res, STATUS_CODES.BAD_REQUEST, 'Email and OTP are required');
        return;
      }
      const result = await this._service.verifyOtp({ email, otp });
      sendSuccess(res, STATUS_CODES.OK, result);
    } catch (error) {
      next(error);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        sendError(res, STATUS_CODES.BAD_REQUEST, 'Email is required');
        return;
      }
      const result = await this._service.resendOtp({ email });
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
