import { AUTH_LIMITS } from '../constants/config.js';
import { AUTH_MESSAGES } from '../constants/messages.js';
export class AuthDtoValidator {
    validateSignup(body) {
        const name = this.readString(body, 'name');
        const email = this.normalizeEmail(this.readString(body, 'email'));
        const password = this.isRecord(body) && typeof body.password === 'string' ? body.password : '';
        if (name.length < AUTH_LIMITS.MIN_NAME_LENGTH) {
            throw new Error(AUTH_MESSAGES.NAME_TOO_SHORT);
        }
        this.assertEmail(email);
        this.assertPassword(password);
        return { name, email, password };
    }
    validateLogin(body) {
        const email = this.normalizeEmail(this.readString(body, 'email'));
        const password = this.isRecord(body) && typeof body.password === 'string' ? body.password : '';
        this.assertEmail(email);
        this.assertPassword(password);
        return { email, password };
    }
    validateVerifyOtp(body) {
        const email = this.normalizeEmail(this.readString(body, 'email'));
        const otp = this.readString(body, 'otp');
        this.assertEmail(email);
        this.assertOtp(otp);
        return { email, otp };
    }
    validateResendOtp(body) {
        const email = this.normalizeEmail(this.readString(body, 'email'));
        this.assertEmail(email);
        return { email };
    }
    validateRefreshToken(body) {
        const refreshToken = this.readString(body, 'refreshToken');
        if (!refreshToken) {
            throw new Error(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
        }
        return { refreshToken };
    }
    validateForgotPassword(body) {
        const email = this.normalizeEmail(this.readString(body, 'email'));
        this.assertEmail(email);
        return { email };
    }
    validateResetPassword(body) {
        const email = this.normalizeEmail(this.readString(body, 'email'));
        const otp = this.readString(body, 'otp');
        const password = this.isRecord(body) && typeof body.password === 'string' ? body.password : '';
        this.assertEmail(email);
        this.assertOtp(otp);
        this.assertPassword(password);
        return { email, otp, password };
    }
    validateUpdateProfile(body) {
        const result = {};
        if (!this.isRecord(body)) {
            return result;
        }
        if (typeof body.name === 'string') {
            const name = body.name.trim();
            if (name.length < AUTH_LIMITS.MIN_NAME_LENGTH) {
                throw new Error(AUTH_MESSAGES.NAME_TOO_SHORT);
            }
            result.name = name;
        }
        if (typeof body.email === 'string') {
            const email = this.normalizeEmail(body.email);
            this.assertEmail(email);
            result.email = email;
        }
        if (typeof body.profilePhotoUrl === 'string') {
            result.profilePhotoUrl = body.profilePhotoUrl.trim();
        }
        return result;
    }
    validateChangePassword(body) {
        const currentPassword = this.isRecord(body) && typeof body.currentPassword === 'string' ? body.currentPassword : '';
        const newPassword = this.isRecord(body) && typeof body.newPassword === 'string' ? body.newPassword : '';
        this.assertPassword(currentPassword);
        this.assertPassword(newPassword);
        return { currentPassword, newPassword };
    }
    isRecord(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    readString(body, field) {
        if (!this.isRecord(body) || typeof body[field] !== 'string') {
            return '';
        }
        return body[field].trim();
    }
    assertEmail(email) {
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            throw new Error(AUTH_MESSAGES.INVALID_EMAIL);
        }
    }
    assertPassword(password) {
        if (password.length < AUTH_LIMITS.MIN_PASSWORD_LENGTH) {
            throw new Error(AUTH_MESSAGES.PASSWORD_TOO_SHORT);
        }
    }
    assertOtp(otp) {
        if (!/^\d{6}$/.test(otp)) {
            throw new Error(AUTH_MESSAGES.INVALID_OTP);
        }
    }
}
export default new AuthDtoValidator();
