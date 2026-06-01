import axios from 'axios';

// Create and export a simple axios instance.
// It will be configured with interceptors elsewhere.
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : '/api',
});

export default api;