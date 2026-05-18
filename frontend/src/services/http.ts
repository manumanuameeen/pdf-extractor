import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_ENDPOINTS, HTTP_HEADERS, STORAGE_KEYS } from '../constants/api';

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

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN)
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
          refreshToken,
        });

        const token = response.data?.token;
        const nextRefreshToken = response.data?.refreshToken;

        if (token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, token);

          if (typeof nextRefreshToken === 'string') {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, nextRefreshToken);
          }

          if (originalRequest.headers) {
            originalRequest.headers[HTTP_HEADERS.AUTHORIZATION] = `${HTTP_HEADERS.BEARER} ${token}`;
          }

          return http(originalRequest);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
    }

    return Promise.reject(error);
  }
);

export default http;
