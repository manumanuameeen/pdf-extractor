export type PublicUser = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  profilePhotoUrl?: string | null;
};

export type UserRecord = PublicUser & {
  passwordHash: string;
  otpHash: string | null;
  otpExpiresAt: string | null;
  otpAttempts: number;
  otpLastSentAt: string | null;
  passwordResetOtpHash?: string | null;
  passwordResetOtpExpiresAt?: string | null;
  passwordResetOtpAttempts?: number;
  passwordResetOtpLastSentAt?: string | null;
  refreshTokenHash?: string | null;
  refreshTokenExpiresAt?: string | null;
};

export type PdfRecord = {
  id: string;
  userId: string;
  originalName: string;
  size: number;
  pageCount: number;
  path: string;
  createdAt: string;
};

export type AuthTokenPayload = {
  userId: string;
  email: string;
};
