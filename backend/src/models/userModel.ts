import mongoose from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const { Schema, model, models } = mongoose;

const userSchema = new Schema(
  {
    _id: { type: String, required: true }, // Store UUID as _id
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    isVerified: { type: Boolean, required: true, default: false },
    otpHash: { type: String, default: null },
    otpExpiresAt: { type: String, default: null },
    otpAttempts: { type: Number, required: true, default: 0 },
    otpLastSentAt: { type: String, default: null },
    refreshTokenHash: { type: String, default: null },
    refreshTokenExpiresAt: { type: String, default: null },
    passwordResetOtpHash: { type: String, default: null },
    passwordResetOtpExpiresAt: { type: String, default: null },
    passwordResetOtpAttempts: { type: Number, default: 0 },
    passwordResetOtpLastSentAt: { type: String, default: null },
    profilePhotoUrl: { type: String, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export default models.User || model('User', userSchema);
