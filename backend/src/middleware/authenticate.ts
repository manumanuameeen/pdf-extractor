import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AUTH_MESSAGES } from '../constants/messages.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { sendError } from '../utils/responseSender.js';
import { container } from '../di/container.js';
import type { AuthTokenPayload } from '../types/models.js';

export type AuthenticatedRequest<
  TParams = Record<string, string>,
  TResBody = unknown,
  TReqBody = unknown
> = Request<TParams, TResBody, TReqBody> & {
  user: AuthTokenPayload;
};

/**
 * ARCHITECTURE: AUTH MIDDLEWARE CLASS
 * Purpose: Keep JWT extraction and verification separate from routes/controllers.
 */
export class AuthenticationMiddleware {
  constructor(private readonly _service = container.authService) { }

  handle: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, STATUS_CODES.UNAUTHORIZED, AUTH_MESSAGES.TOKEN_REQUIRED);
      return;
    }

    try {
      const token = authHeader.replace('Bearer ', '').trim();
      const payload = this._service.verifyToken(token);

      (req as AuthenticatedRequest).user = payload;
      next();
    } catch (err) {
      console.error('JWT token verification failed:', err);
      sendError(res, STATUS_CODES.UNAUTHORIZED, AUTH_MESSAGES.INVALID_TOKEN);
    }
  };
}

const authenticationMiddleware = new AuthenticationMiddleware();

export const authenticate = authenticationMiddleware.handle;
export default authenticationMiddleware;
