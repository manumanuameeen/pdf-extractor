"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const messages_js_1 = require("../constants/messages.js");
const redis_js_1 = require("../config/redis.js");
class AuthService {
    _repository;
    _emailService;
    _mapper;
    JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
    JWT_EXPIRES_IN = '1d';
    OTP_TTL = 300; // 5 minutes
    constructor(_repository, _emailService, _mapper) {
        this._repository = _repository;
        this._emailService = _emailService;
        this._mapper = _mapper;
    }
    generateOtp() {
        return node_crypto_1.default.randomInt(100000, 999999).toString();
    }
    getRedisKey(email) {
        return `otp:${email.toLowerCase()}`;
    }
    getLockoutKey(email) {
        return `lockout:${email.toLowerCase()}`;
    }
    async requestOtp(email) {
        const lockoutKey = this.getLockoutKey(email);
        const isLocked = await redis_js_1.redis.get(lockoutKey);
        if (isLocked) {
            throw new Error(`You are temporarily locked out. Please try again later.`);
        }
        const redisKey = this.getRedisKey(email);
        const existingStr = await redis_js_1.redis.get(redisKey);
        let resendCount = 0;
        if (existingStr) {
            const existing = JSON.parse(existingStr);
            resendCount = existing.resend_count || 0;
            if (resendCount >= 3) {
                // Block for 1 hour
                await redis_js_1.redis.set(lockoutKey, 'true', 'EX', 3600);
                await redis_js_1.redis.del(redisKey);
                throw new Error('Too many resend attempts. Please wait 1 hour.');
            }
            resendCount++;
        }
        const code = this.generateOtp();
        const payload = {
            code,
            attempts: 0,
            resend_count: resendCount
        };
        await redis_js_1.redis.set(redisKey, JSON.stringify(payload), 'EX', this.OTP_TTL);
        await this._emailService.sendOtp(email, code);
        // Development helper
        const isDev = process.env.NODE_ENV !== 'production';
        return {
            message: 'OTP sent successfully to your email.',
            ...(isDev ? { devOtp: code } : {})
        };
    }
    async signup(input) {
        let user = await this._repository.findByEmail(input.email);
        if (user && user.isVerified) {
            throw new Error(messages_js_1.AUTH_MESSAGES.EMAIL_EXISTS);
        }
        const password = input.password || '';
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        if (user) {
            // Update unverified user's name/password in case they corrected it
            user.name = input.name;
            user.passwordHash = passwordHash;
            await this._repository.save(user);
        }
        else {
            user = {
                id: node_crypto_1.default.randomUUID(),
                name: input.name,
                email: input.email.toLowerCase(),
                passwordHash,
                isVerified: false,
                otpHash: null,
                otpExpiresAt: null,
                otpAttempts: 0,
                otpLastSentAt: null,
                createdAt: new Date().toISOString()
            };
            await this._repository.save(user);
        }
        const otpResult = await this.requestOtp(user.email);
        return {
            message: messages_js_1.AUTH_MESSAGES.SIGNUP_OTP_SENT,
            devOtp: otpResult.devOtp,
        };
    }
    async login(input) {
        const user = await this._repository.findByEmail(input.email);
        if (!user) {
            throw new Error(messages_js_1.AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
        const password = input.password || '';
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error(messages_js_1.AUTH_MESSAGES.INVALID_CREDENTIALS);
        }
        if (!user.isVerified) {
            // Trigger new OTP send
            const otpResult = await this.requestOtp(user.email);
            return {
                message: messages_js_1.AUTH_MESSAGES.VERIFY_BEFORE_LOGIN,
                requiresVerification: true,
                devOtp: otpResult.devOtp,
            };
        }
        const token = this.generateToken(user);
        return {
            message: messages_js_1.AUTH_MESSAGES.LOGIN_SUCCESS,
            user: this._mapper.toPublicUser(user),
            token,
        };
    }
    async verifyOtp(input) {
        const lockoutKey = this.getLockoutKey(input.email);
        const isLocked = await redis_js_1.redis.get(lockoutKey);
        if (isLocked) {
            throw new Error(`You are temporarily locked out. Please try again later.`);
        }
        const redisKey = this.getRedisKey(input.email);
        const otpDataStr = await redis_js_1.redis.get(redisKey);
        if (!otpDataStr) {
            throw new Error('OTP has expired or was not requested. Please request a new one.');
        }
        const otpData = JSON.parse(otpDataStr);
        if (otpData.attempts >= 3) {
            await redis_js_1.redis.del(redisKey);
            await redis_js_1.redis.set(lockoutKey, 'true', 'EX', 900); // 15 min lockout
            throw new Error('Too many failed attempts. You are locked out for 15 minutes.');
        }
        if (otpData.code !== input.otp) {
            otpData.attempts++;
            await redis_js_1.redis.set(redisKey, JSON.stringify(otpData), 'KEEPTTL');
            throw new Error(messages_js_1.AUTH_MESSAGES.INVALID_OTP);
        }
        // Success!
        await redis_js_1.redis.del(redisKey);
        const user = await this._repository.findByEmail(input.email);
        if (!user)
            throw new Error(messages_js_1.AUTH_MESSAGES.USER_NOT_FOUND);
        if (!user.isVerified) {
            user.isVerified = true;
            await this._repository.save(user);
        }
        const token = this.generateToken(user);
        return {
            message: 'Verified successfully',
            user: this._mapper.toPublicUser(user),
            token
        };
    }
    async resendOtp(input) {
        return this.requestOtp(input.email);
    }
    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
        };
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
    }
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
    }
    async updateProfile(userId, input) {
        const user = await this._repository.findById(userId);
        if (!user) {
            throw new Error(messages_js_1.AUTH_MESSAGES.USER_NOT_FOUND);
        }
        if (input.name)
            user.name = input.name;
        if (typeof input.profilePhotoUrl === 'string')
            user.profilePhotoUrl = input.profilePhotoUrl || null;
        await this._repository.save(user);
        return this._mapper.toPublicUser(user);
    }
    async getUserById(userId) {
        const user = await this._repository.findById(userId);
        return user ? this._mapper.toPublicUser(user) : null;
    }
}
exports.AuthService = AuthService;
