// In: client/src/services/apiInterceptors.js
import axios from 'axios';
import { logout, tokenRefreshed } from '../features/auth/authSlice';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
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
            // --- We now read from localStorage directly as the most reliable source ---
            const token = localStorage.getItem('accessToken');
            
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            
            if (error.response?.status === 401 && !originalRequest._retry) {
                
                if (isRefreshing) {
                    // If a refresh is already in progress, queue this request
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    }).catch((err) => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshUrl = `${api.defaults.baseURL || ''}/auth/refresh`;
                    const { data } = await axios.post(refreshUrl, {}, { withCredentials: true });
                    const newAccessToken = data.accessToken;

                    if (!newAccessToken) throw new Error("No new access token from refresh.");

                    store.dispatch(tokenRefreshed(newAccessToken));
                    
                    // Update the default header for future requests
                    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

                    processQueue(null, newAccessToken);
                    
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    
                    return api(originalRequest);

                } catch (refreshError) {
                    console.error("[Interceptor] CRITICAL: Refresh token FAILED.", refreshError);
                    processQueue(refreshError, null);
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
