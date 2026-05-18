import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
export class MongoUserRepository {
    mapToUserRecord(doc) {
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
    async findAll() {
        const docs = await User.find({});
        return docs.map((doc) => this.mapToUserRecord(doc));
    }
    async findById(id) {
        const doc = await User.findById(id);
        return doc ? this.mapToUserRecord(doc) : null;
    }
    async findByEmail(email) {
        const doc = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        return doc ? this.mapToUserRecord(doc) : null;
    }
    async findByRefreshToken(refreshToken) {
        const docs = await User.find({ refreshTokenHash: { $ne: null } });
        for (const doc of docs) {
            if (await bcrypt.compare(refreshToken, doc.refreshTokenHash)) {
                return this.mapToUserRecord(doc);
            }
        }
        return null;
    }
    async save(record) {
        const doc = {
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
        await User.findByIdAndUpdate(record.id, doc, { upsert: true, new: true });
        return record;
    }
}
