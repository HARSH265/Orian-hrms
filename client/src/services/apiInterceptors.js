// In: client/src/services/apiInterceptors.js
import { logout, tokenRefreshed } from '../features/auth/authSlice';
import logger from '../utils/logger';
import { startTokenManager, stopTokenManager } from './tokenManager';

let isRefreshing = false;
let failedQueue = [];
const MAX_QUEUE_SIZE = 20;

function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch { return null; }
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const processQueue = (error, token = null) => {
  if (failedQueue.length >= MAX_QUEUE_SIZE) failedQueue.shift();
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const setupInterceptors = (api, store) => {
  api.interceptors.request.use(
    (config) => {
      const token = getCookie('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
        (error) => Promise.reject(error)
    );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.config?.headers?.['X-Aborted']) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If a refresh is already in progress, queue this request  
          failedQueue = failedQueue.filter(q => q.promise); // prune stale entries
          return new Promise((resolve, reject) => {
            if (failedQueue.length >= MAX_QUEUE_SIZE) { failedQueue.shift(); }
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          });
        }
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        isRefreshing = true;

        try {
          const refreshUrl = `${api.defaults.baseURL || ''}/auth/refresh`;
          const { data } = await api.post(refreshUrl, {}, { withCredentials: true });
          const newAccessToken = data.accessToken;
          if (!newAccessToken) throw new Error('No new access token from refresh.');

          store.dispatch(tokenRefreshed(newAccessToken));

          // Update default and outgoing request headers
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          document.cookie = `accessToken=${newAccessToken}; path=/; Secure; SameSite=Strict`;

          const expiry = getTokenExpiry(newAccessToken);
          store.dispatch({ type: 'auth/setTokenExpiry', payload: expiry });

          processQueue(null, newAccessToken);
          originalRequest._retry = false;
          startTokenManager(store);

          return api(originalRequest);
        } catch (refreshError) {
          logger.error('[Interceptor] Refresh token error:', refreshError);
          processQueue(refreshError, null);
          originalRequest._retry = false;
          stopTokenManager();
          store.dispatch(logout());
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    }
  );
};

export default setupInterceptors;
