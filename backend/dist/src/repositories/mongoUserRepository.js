"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoUserRepository = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userModel_js_1 = __importDefault(require("../models/userModel.js"));
const mongoBaseRepository_js_1 = require("./mongoBaseRepository.js");
function mapToUserRecord(doc) {
    return {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        passwordHash: doc.passwordHash,
        isVerified: doc.isVerified,
        otpHash: doc.otpHash,
        otpExpiresAt: doc.otpExpiresAt,
        otpAttempts: doc.otpAttempts,
        otpLastSentAt: doc.otpLastSentAt,
        refreshTokenHash: doc.refreshTokenHash,
        refreshTokenExpiresAt: doc.refreshTokenExpiresAt,
        passwordResetOtpHash: doc.passwordResetOtpHash,
        passwordResetOtpExpiresAt: doc.passwordResetOtpExpiresAt,
        passwordResetOtpAttempts: doc.passwordResetOtpAttempts,
        passwordResetOtpLastSentAt: doc.passwordResetOtpLastSentAt,
        profilePhotoUrl: doc.profilePhotoUrl,
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
    };
}
function mapToUserDoc(record) {
    return {
        _id: record.id,
        name: record.name,
        email: record.email,
        passwordHash: record.passwordHash,
        isVerified: record.isVerified,
        otpHash: record.otpHash,
        otpExpiresAt: record.otpExpiresAt,
        otpAttempts: record.otpAttempts,
        otpLastSentAt: record.otpLastSentAt,
        refreshTokenHash: record.refreshTokenHash,
        refreshTokenExpiresAt: record.refreshTokenExpiresAt,
        passwordResetOtpHash: record.passwordResetOtpHash,
        passwordResetOtpExpiresAt: record.passwordResetOtpExpiresAt,
        passwordResetOtpAttempts: record.passwordResetOtpAttempts,
        passwordResetOtpLastSentAt: record.passwordResetOtpLastSentAt,
        profilePhotoUrl: record.profilePhotoUrl
    };
}
class MongoUserRepository extends mongoBaseRepository_js_1.MongoBaseRepository {
    constructor() {
        super(userModel_js_1.default, mapToUserRecord, mapToUserDoc);
    }
    async findByEmail(email) {
        const doc = await userModel_js_1.default.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        return doc ? mapToUserRecord(doc) : null;
    }
    async findByRefreshToken(refreshToken) {
        const docs = await userModel_js_1.default.find({ refreshTokenHash: { $ne: null } });
        for (const doc of docs) {
            if (await bcryptjs_1.default.compare(refreshToken, doc.refreshTokenHash)) {
                return mapToUserRecord(doc);
            }
        }
        return null;
    }
}
exports.MongoUserRepository = MongoUserRepository;
