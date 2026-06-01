// In: client/src/services/apiInterceptors.js
import axios from 'axios';
import { logout, tokenRefreshed } from '../features/auth/authSlice';

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
                originalRequest._retry = true;
                
                try {
                    const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
                    const newAccessToken = data.accessToken;

                    if (!newAccessToken) throw new Error("No new access token from refresh.");

                    store.dispatch(tokenRefreshed(newAccessToken));
                    
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    
                    return api(originalRequest);

                } catch (refreshError) {
                    console.error("[Interceptor] CRITICAL: Refresh token FAILED.", refreshError);
                    store.dispatch(logout());
                    if (window.location.pathname !== '/login') {
                         window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
};

export default setupInterceptors;