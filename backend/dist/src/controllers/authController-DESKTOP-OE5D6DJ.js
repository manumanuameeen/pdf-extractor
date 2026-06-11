"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const messages_js_1 = require("../constants/messages.js");
const statusCodes_js_1 = require("../constants/statusCodes.js");
/**
 * ARCHITECTURE: CONTROLLER LAYER
 * Purpose: Validate DTOs, call services, and shape HTTP responses.
 */
class AuthController {
    _service;
    _validator;
    constructor(_service, _validator) {
        this._service = _service;
        this._validator = _validator;
    }
    signup = async (req, res, next) => {
        try {
            const dto = this._validator.validateSignup(req.body);
            const result = await this._service.signup(dto);
            res.status(statusCodes_js_1.STATUS_CODES.CREATED).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    verifyOtp = async (req, res, next) => {
        try {
            const dto = this._validator.validateVerifyOtp(req.body);
            const result = await this._service.verifyOtp(dto);
            res.status(statusCodes_js_1.STATUS_CODES.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    resendOtp = async (req, res, next) => {
        try {
            const dto = this._validator.validateResendOtp(req.body);
            const result = await this._service.resendOtp(dto);
            res.status(statusCodes_js_1.STATUS_CODES.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const dto = this._validator.validateLogin(req.body);
            const result = await this._service.login(dto);
            res.status(statusCodes_js_1.STATUS_CODES.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    refreshToken = async (req, res, next) => {
        try {
            const dto = this._validator.validateRefreshToken(req.body);
            const result = await this._service.refreshToken(dto);
            res.status(statusCodes_js_1.STATUS_CODES.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    forgotPassword = async (req, res, next) => {
        try {
            const dto = this._validator.validateForgotPassword(req.body);
            const result = await this._service.forgotPassword(dto);
            res.status(statusCodes_js_1.STATUS_CODES.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            const dto = this._validator.validateResetPassword(req.body);
            const result = await this._service.resetPassword(dto);
            res.status(statusCodes_js_1.STATUS_CODES.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    updateProfile = async (req, res, next) => {
        try {
            const dto = this._validator.validateUpdateProfile(req.body);
            const profilePhotoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
            const result = await this._service.updateProfile(req.user.userId, {
                ...dto,
                profilePhotoUrl
            });
            res.status(statusCodes_js_1.STATUS_CODES.OK).json({ user: result });
        }
        catch (error) {
            next(error);
        }
    };
    changePassword = async (req, res, next) => {
        try {
            const dto = this._validator.validateChangePassword(req.body);
            const result = await this._service.changePassword(req.user.userId, dto);
            res.status(statusCodes_js_1.STATUS_CODES.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    };
    me = async (req, res, next) => {
        try {
            const user = await this._service.getUserById(req.user.userId);
            if (!user) {
                res.status(statusCodes_js_1.STATUS_CODES.NOT_FOUND).json({ error: messages_js_1.AUTH_MESSAGES.USER_NOT_FOUND });
                return;
            }
            res.status(statusCodes_js_1.STATUS_CODES.OK).json({ user });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
