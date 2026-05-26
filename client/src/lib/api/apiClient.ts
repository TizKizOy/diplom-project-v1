import axios from 'axios';
import { toast } from 'react-toastify';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const NO_REFRESH_URLS = ['/auth/login', '/auth/register', '/auth/refresh'];

/** Не показывать toast (частые фоновые запросы). */
const SILENT_TOAST_SUBSTRINGS = [
  '/auth/me',
  '/auth/refresh',
  '/notifications',
  '/auth/login',
  '/auth/register',
];

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(null)));
  failedQueue = [];
};

const shouldToast = (url: string, status?: number) => {
  if (status === 401) return false;
  return !SILENT_TOAST_SUBSTRINGS.some((s) => url.includes(s));
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || '';
    const status = error.response?.status as number | undefined;

    const isNoRefreshUrl = NO_REFRESH_URLS.some((u) => url.includes(u));

    if (status === 401 && !originalRequest._retry && !isNoRefreshUrl) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (typeof window !== 'undefined' && shouldToast(url, status)) {
      const msg = getApiErrorMessage(error, 'Ошибка сети или сервера');
      toast.error(msg, { toastId: `err-${url}-${status}-${msg}`.slice(0, 200) });
    }

    return Promise.reject(error);
  },
);

export default apiClient;
