import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import { MongoBaseRepository } from './mongoBaseRepository.js';
import type { IUserRepository } from '../contracts/index.js';
import type { UserRecord } from '../types/models.js';

function mapToUserRecord(doc: any): UserRecord {
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

function mapToUserDoc(record: UserRecord): any {
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

export class MongoUserRepository extends MongoBaseRepository<UserRecord> implements IUserRepository {
  constructor() {
    super(User, mapToUserRecord, mapToUserDoc);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const doc = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    return doc ? mapToUserRecord(doc) : null;
  }

  async findByRefreshToken(refreshToken: string): Promise<UserRecord | null> {
    const docs = await User.find({ refreshTokenHash: { $ne: null } });

    for (const doc of docs) {
      if (await bcrypt.compare(refreshToken, doc.refreshTokenHash)) {
        return mapToUserRecord(doc);
      }
    }

    return null;
  }
}
