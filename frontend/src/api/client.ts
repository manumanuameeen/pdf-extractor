import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { API_BASE_URL, HTTP_HEADERS, STORAGE_KEYS } from '../constants/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (accessToken && config.headers) {
      config.headers[HTTP_HEADERS.AUTHORIZATION] = `${HTTP_HEADERS.BEARER} ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
