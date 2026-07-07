import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { AUTH_ROUTES } from '../constants/routes.js';
import { STORAGE } from '../constants/config.js';
import type { IAuthController, IRouteBuilder } from '../contracts/index.js';
import { container } from '../di/container.js';
import { authenticate } from '../middleware/authenticate.js';

const profilePhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = process.env[STORAGE.UPLOAD_DIR_ENV] || STORAGE.DEFAULT_UPLOAD_DIR;
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

export class AuthRoutes implements IRouteBuilder {
  readonly router = Router();

  constructor(
    private readonly _controller: IAuthController = container.authController,
    private readonly _authenticateRequest: RequestHandler = authenticate
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post(AUTH_ROUTES.SIGNUP, authRateLimiter, this._controller.signup as RequestHandler);
    this.router.post(AUTH_ROUTES.LOGIN, authRateLimiter, this._controller.login as RequestHandler);
    this.router.post(AUTH_ROUTES.VERIFY_OTP, authRateLimiter, this._controller.verifyOtp as RequestHandler);
    this.router.post(AUTH_ROUTES.RESEND_OTP, authRateLimiter, this._controller.resendOtp as RequestHandler);

    this.router.patch(AUTH_ROUTES.PROFILE, this._authenticateRequest, profilePhotoUpload.single('photo'), this._controller.updateProfile as RequestHandler);
    this.router.get(AUTH_ROUTES.ME, this._authenticateRequest, this._controller.me as RequestHandler);
  }
}

export default new AuthRoutes().router;

