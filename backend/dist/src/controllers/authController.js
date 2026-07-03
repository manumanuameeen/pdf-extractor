"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const messages_js_1 = require("../constants/messages.js");
const statusCodes_js_1 = require("../constants/statusCodes.js");
const responseSender_js_1 = require("../utils/responseSender.js");
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
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.CREATED, result);
        }
        catch (error) {
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const dto = this._validator.validateLogin(req.body);
            const result = await this._service.login(dto);
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.OK, result);
        }
        catch (error) {
            next(error);
        }
    };
    verifyOtp = async (req, res, next) => {
        try {
            const dto = this._validator.validateVerifyOtp(req.body);
            const result = await this._service.verifyOtp(dto);
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.OK, result);
        }
        catch (error) {
            next(error);
        }
    };
    resendOtp = async (req, res, next) => {
        try {
            const dto = this._validator.validateResendOtp(req.body);
            const result = await this._service.resendOtp(dto);
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.OK, result);
        }
        catch (error) {
            next(error);
        }
    };
    updateProfile = async (req, res, next) => {
        try {
            const body = req.body;
            const profilePhotoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
            const user = await this._service.updateProfile(req.user.userId, {
                name: body.name,
                profilePhotoUrl
            });
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.OK, { user });
        }
        catch (error) {
            next(error);
        }
    };
    me = async (req, res, next) => {
        try {
            const user = await this._service.getUserById(req.user.userId);
            if (!user) {
                (0, responseSender_js_1.sendError)(res, statusCodes_js_1.STATUS_CODES.NOT_FOUND, messages_js_1.AUTH_MESSAGES.USER_NOT_FOUND);
                return;
            }
            (0, responseSender_js_1.sendSuccess)(res, statusCodes_js_1.STATUS_CODES.OK, { user });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
