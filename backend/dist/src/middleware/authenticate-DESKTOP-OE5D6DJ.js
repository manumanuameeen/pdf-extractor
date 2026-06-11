"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.AuthenticationMiddleware = void 0;
const messages_js_1 = require("../constants/messages.js");
const statusCodes_js_1 = require("../constants/statusCodes.js");
const container_js_1 = require("../di/container.js");
/**
 * ARCHITECTURE: AUTH MIDDLEWARE CLASS
 * Purpose: Keep JWT extraction and verification separate from routes/controllers.
 */
class AuthenticationMiddleware {
    _service;
    constructor(_service = container_js_1.container.authService) {
        this._service = _service;
    }
    handle = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(statusCodes_js_1.STATUS_CODES.UNAUTHORIZED).json({ error: messages_js_1.AUTH_MESSAGES.TOKEN_REQUIRED });
            return;
        }
        try {
            const token = authHeader.replace('Bearer ', '').trim();
            const payload = this._service.verifyToken(token);
            req.user = payload;
            next();
        }
        catch {
            res.status(statusCodes_js_1.STATUS_CODES.UNAUTHORIZED).json({ error: messages_js_1.AUTH_MESSAGES.INVALID_TOKEN });
        }
    };
}
exports.AuthenticationMiddleware = AuthenticationMiddleware;
const authenticationMiddleware = new AuthenticationMiddleware();
exports.authenticate = authenticationMiddleware.handle;
exports.default = authenticationMiddleware;
