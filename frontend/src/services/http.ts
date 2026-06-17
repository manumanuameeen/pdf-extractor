import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { API_BASE_URL, HTTP_HEADERS, STORAGE_KEYS } from '../constants/api';

const http = axios.create({ baseURL: API_BASE_URL });

http.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.TOKEN);

  if (accessToken && config.headers) {
    config.headers[HTTP_HEADERS.AUTHORIZATION] = `${HTTP_HEADERS.BEARER} ${accessToken}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // On 401, clear session — no refresh token in this OTP-only flow
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }

    return Promise.reject(error);
  }
);

export default http;
