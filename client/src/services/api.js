// In: client/src/services/api.js
import axios from 'axios';

// Create and export a simple axios instance.
// It will be configured with interceptors elsewhere.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api',
  timeout: 10_000,
});

api.defaults.withCredentials = true;

export default api;
