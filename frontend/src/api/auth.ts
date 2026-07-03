import apiClient from './client';
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
  const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, { name, email });
  return response.data;
}

export async function login(email: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, { email });
  return response.data;
}

export async function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
  if (response.data.token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
  }
  return response.data;
}

export async function resendOtp(email: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.RESEND_OTP, { email });
  return response.data;
}

export async function getProfile(): Promise<PublicUser> {
  const response = await apiClient.get<{ user: PublicUser }>(API_ENDPOINTS.AUTH.ME);
  return response.data.user;
}

export async function updateProfile(name: string): Promise<PublicUser> {
  const response = await apiClient.patch<{ user: PublicUser }>(API_ENDPOINTS.AUTH.PROFILE, { name });
  return response.data.user;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}
