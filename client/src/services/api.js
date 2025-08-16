import axios from 'axios';

// Create and export a simple axios instance.
// It will be configured with interceptors elsewhere.
const api = axios.create({
    baseURL: '/api', // Use the proxy path
});

export default api;