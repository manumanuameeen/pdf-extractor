export const API_ROUTES = {
  AUTH_BASE: '/api/auth',
  PDF_BASE: '/api/pdfs',
  OUTPUTS_BASE: '/outputs'
} as const;

export const AUTH_ROUTES = {
  SIGNUP: '/signup',
  VERIFY_OTP: '/verify-otp',
  RESEND_OTP: '/resend-otp',
  LOGIN: '/login',
  REFRESH_TOKEN: '/refresh-token',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ME: '/me',
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/change-password'
} as const;

export const PDF_ROUTES = {
  UPLOAD: '/upload',
  BY_ID: '/:id',
  EXTRACT: '/:id/extract'
} as const;
