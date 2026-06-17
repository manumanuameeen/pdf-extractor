import http from './http';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/api';
import type { PublicUser } from '../types';

export type { PublicUser };

export type User = PublicUser;

export type AuthResponse = {
  message: string;
  user?: PublicUser;
  token?: string;
  devOtp?: string;
};

export async function signup(name: string, email: string): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, { name, email });
  return res.data;
}

export async function login(email: string): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, { email });
  return res.data;
}

export async function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
  if (res.data.token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
  }
  return res.data;
}

export async function resendOtp(email: string): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.RESEND_OTP, { email });
  return res.data;
}

export async function getProfile(): Promise<PublicUser> {
  const res = await http.get<{ user: PublicUser }>(API_ENDPOINTS.AUTH.ME);
  return res.data.user;
}

export async function updateProfile(name: string): Promise<PublicUser> {
  const res = await http.patch<{ user: PublicUser }>(API_ENDPOINTS.AUTH.PROFILE, { name });
  return res.data.user;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}
