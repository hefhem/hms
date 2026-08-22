import axios from 'axios';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle 401 & 409 Concurrency Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 409) {
      // Dispatch global custom event for 409 Concurrency Conflict
      window.dispatchEvent(
        new CustomEvent('hms-concurrency-conflict', {
          detail: {
            message:
              error.response?.data?.message ||
              'Concurrency Conflict: Record was modified by another user. Please refresh and retry.',
          },
        }),
      );
    }
    return Promise.reject(error);
  },
);

export default api;
