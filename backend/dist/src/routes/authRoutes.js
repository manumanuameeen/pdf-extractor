"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const multer_1 = __importDefault(require("multer"));
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const routes_js_1 = require("../constants/routes.js");
const config_js_1 = require("../constants/config.js");
const container_js_1 = require("../di/container.js");
const authenticate_js_1 = require("../middleware/authenticate.js");
const profilePhotoUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            const uploadDir = process.env[config_js_1.STORAGE.UPLOAD_DIR_ENV] || config_js_1.STORAGE.DEFAULT_UPLOAD_DIR;
            node_fs_1.default.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
            cb(null, `${node_crypto_1.default.randomUUID()}${node_path_1.default.extname(file.originalname).toLowerCase()}`);
        }
    }),
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        cb(null, allowedTypes.includes(file.mimetype));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});
const authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after a minute' },
    standardHeaders: true,
    legacyHeaders: false,
});
class AuthRoutes {
    _controller;
    _authenticateRequest;
    router = (0, express_1.Router)();
    constructor(_controller = container_js_1.container.authController, _authenticateRequest = authenticate_js_1.authenticate) {
        this._controller = _controller;
        this._authenticateRequest = _authenticateRequest;
        this.registerRoutes();
    }
    registerRoutes() {
        this.router.post(routes_js_1.AUTH_ROUTES.SIGNUP, authRateLimiter, this._controller.signup);
        this.router.post(routes_js_1.AUTH_ROUTES.LOGIN, authRateLimiter, this._controller.login);
        this.router.post(routes_js_1.AUTH_ROUTES.VERIFY_OTP, authRateLimiter, this._controller.verifyOtp);
        this.router.post(routes_js_1.AUTH_ROUTES.RESEND_OTP, authRateLimiter, this._controller.resendOtp);
        this.router.patch(routes_js_1.AUTH_ROUTES.PROFILE, this._authenticateRequest, profilePhotoUpload.single('photo'), this._controller.updateProfile);
        this.router.get(routes_js_1.AUTH_ROUTES.ME, this._authenticateRequest, this._controller.me);
    }
}
exports.AuthRoutes = AuthRoutes;
exports.default = new AuthRoutes().router;
