import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { Router } from 'express';
import { AUTH_ROUTES } from '../constants/routes.js';
import { STORAGE } from '../constants/config.js';
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
/**
 * ARCHITECTURE: ROUTE CLASS
 * Purpose: Register auth endpoints without mixing in controller logic.
 */
export class AuthRoutes {
    _controller;
    _authenticateRequest;
    router = Router();
    constructor(_controller = container.authController, _authenticateRequest = authenticate) {
        this._controller = _controller;
        this._authenticateRequest = _authenticateRequest;
        this.registerRoutes();
    }
    registerRoutes() {
        this.router.post(AUTH_ROUTES.SIGNUP, this._controller.signup);
        this.router.post(AUTH_ROUTES.VERIFY_OTP, this._controller.verifyOtp);
        this.router.post(AUTH_ROUTES.RESEND_OTP, this._controller.resendOtp);
        this.router.post(AUTH_ROUTES.LOGIN, this._controller.login);
        this.router.post(AUTH_ROUTES.REFRESH_TOKEN, this._controller.refreshToken);
        this.router.post(AUTH_ROUTES.FORGOT_PASSWORD, this._controller.forgotPassword);
        this.router.post(AUTH_ROUTES.RESET_PASSWORD, this._controller.resetPassword);
        this.router.patch(AUTH_ROUTES.PROFILE, this._authenticateRequest, profilePhotoUpload.single('photo'), this._controller.updateProfile);
        this.router.patch(AUTH_ROUTES.CHANGE_PASSWORD, this._authenticateRequest, this._controller.changePassword);
        this.router.get(AUTH_ROUTES.ME, this._authenticateRequest, this._controller.me);
    }
}
export default new AuthRoutes().router;
