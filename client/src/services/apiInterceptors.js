import axios from 'axios';
import { logout, tokenRefreshed } from '../features/auth/authSlice';

// This function takes the `api` instance and the `store` and wires them together.
const setupInterceptors = (api, store) => {
    // Request Interceptor to add the token
    api.interceptors.request.use(
        (config) => {
            const token = store.getState().auth.token;
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response Interceptor to handle token refresh
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                
                try {
                    const { data } = await axios.post(
                        '/api/auth/refresh', // Use proxy path
                        {},
                        { withCredentials: true }
                    );
                    
                    const newAccessToken = data.accessToken;
                    localStorage.setItem('accessToken', newAccessToken);
                    store.dispatch(tokenRefreshed(newAccessToken));
                    
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    
                    return api(originalRequest);

                } catch (refreshError) {
                    store.dispatch(logout());
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
};

export default setupInterceptors;