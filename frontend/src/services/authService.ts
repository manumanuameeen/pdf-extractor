import http from './http';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/api';
import type { PublicUser } from '../types';

export type AuthResponse = {
  message: string;
  user: PublicUser;
  token?: string;
  refreshToken?: string;
  devOtp?: string;
  devResetOtp?: string;
  otpExpiresInSeconds?: number;
  resendAvailableInSeconds?: number;
};

function setSession(token: string, refreshToken?: string) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);

  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export async function login(email: string, password: string) {
  const response = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
    email,
    password,
  });

  if (response.data.token) {
    setSession(response.data.token, response.data.refreshToken);
  }

  return response.data;
}

export async function signup(name: string, email: string, password: string) {
  const response = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
    name,
    email,
    password,
  });

  return response.data;
}

export async function verifyOtp(email: string, otp: string) {
  const response = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, {
    email,
    otp,
  });

  if (response.data.token) {
    setSession(response.data.token, response.data.refreshToken);
  }

  return response.data;
}

export async function resendOtp(email: string) {
  const response = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.RESEND_OTP, {
    email,
  });

  return response.data;
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
    refreshToken,
  });

  if (response.data.token) {
    setSession(response.data.token, response.data.refreshToken);
  }

  return response.data;
}

export async function getProfile() {
  const response = await http.get<{ user: PublicUser }>(API_ENDPOINTS.AUTH.ME);
  return response.data.user;
}

export async function updateProfile(name: string) {
  const response = await http.patch<{ user: PublicUser }>(API_ENDPOINTS.AUTH.PROFILE, {
    name,
  });
  return response.data.user;
}
