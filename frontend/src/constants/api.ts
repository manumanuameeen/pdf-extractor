export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/api/auth/signup',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESEND_OTP: '/api/auth/resend-otp',
    LOGIN: '/api/auth/login',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    PROFILE: '/api/auth/profile',
    ME: '/api/auth/me',
  },
  PDFS: {
    UPLOAD: '/api/pdfs/upload',
    EXTRACT: (id: string) => `/api/pdfs/${id}/extract`,
    LIST: '/api/pdfs',
    BY_ID: (id: string) => `/api/pdfs/${id}`,
    DELETE: (id: string) => `/api/pdfs/${id}`,
  },
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'pdf_extractor_token',
  REFRESH_TOKEN: 'pdf_extractor_refresh_token',
} as const;

export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  BEARER: 'Bearer',
} as const;
