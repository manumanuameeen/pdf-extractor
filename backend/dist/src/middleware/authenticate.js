import { AUTH_MESSAGES } from '../constants/messages.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { container } from '../di/container.js';
/**
 * ARCHITECTURE: AUTH MIDDLEWARE CLASS
 * Purpose: Keep JWT extraction and verification separate from routes/controllers.
 */
export class AuthenticationMiddleware {
    _service;
    constructor(_service = container.authService) {
        this._service = _service;
    }
    handle = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(STATUS_CODES.UNAUTHORIZED).json({ error: AUTH_MESSAGES.TOKEN_REQUIRED });
            return;
        }
        try {
            const token = authHeader.replace('Bearer ', '').trim();
            const payload = this._service.verifyToken(token);
            req.user = payload;
            next();
        }
        catch {
            res.status(STATUS_CODES.UNAUTHORIZED).json({ error: AUTH_MESSAGES.INVALID_TOKEN });
        }
    };
}
const authenticationMiddleware = new AuthenticationMiddleware();
export const authenticate = authenticationMiddleware.handle;
export default authenticationMiddleware;
