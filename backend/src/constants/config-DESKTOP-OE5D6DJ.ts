export const STORAGE = {
  UPLOAD_DIR_ENV: 'UPLOAD_DIR',
  OUTPUT_DIR_ENV: 'OUTPUT_DIR',
  DEFAULT_UPLOAD_DIR: 'uploads',
  DEFAULT_OUTPUT_DIR: 'outputs',
  PDF_MIME_TYPE: 'application/pdf',
  PDF_EXTENSION: '.pdf',
  EXTRACTED_SUFFIX: '-extracted.pdf'
} as const;

export const AUTH_LIMITS = {
  MIN_NAME_LENGTH: 2,
  MIN_PASSWORD_LENGTH: 8,
  OTP_MIN: 100000,
  OTP_MAX: 999999,
  OTP_EXPIRY_MINUTES: 10,
  OTP_RESEND_COOLDOWN_SECONDS: 60,
  MAX_OTP_ATTEMPTS: 5,
  BCRYPT_PASSWORD_ROUNDS: 12,
  BCRYPT_OTP_ROUNDS: 10,
  DEFAULT_JWT_SECRET: 'development-jwt-secret-change-me',
  DEFAULT_JWT_EXPIRES_IN: '7d',
  REFRESH_TOKEN_EXPIRY_DAYS: 7
} as const;

export const FILE_LIMITS = {
  MAX_PDF_SIZE_BYTES: 50 * 1024 * 1024
} as const;

export const SMTP_DEFAULTS = {
  PORT: 587,
  SECURE_PORT: 465,
  SUBJECT: 'Verify your PDF Extractor account'
} as const;

export const DATABASE = {
  URI_ENV: 'MONGODB_URI',
  DB_NAME_ENV: 'MONGODB_DB_NAME',
  DEFAULT_DB_NAME: 'pdf_extractor'
} as const;

export const CLEANUP = {
  DEFAULT_INTERVAL_MINUTES: 60,
  CRON_EVERY_HOUR: '0 * * * *'
} as const;
