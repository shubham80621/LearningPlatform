import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearSession } from '../auth/authStorage';
import {
  isAuthPublicUrl,
  redirectToLogin,
  refreshAccessToken,
} from '../auth/tokenRefresh';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !original ||
      original._retry ||
      isAuthPublicUrl(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      await refreshAccessToken();
      return api(original);
    } catch {
      clearSession();
      redirectToLogin();
      return Promise.reject(error);
    }
  },
);

export default api;
