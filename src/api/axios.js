// src/api/axios.js
import axios from 'axios';
import { API_URL } from '../config';

console.log('API URL:', API_URL); // Add logging for debugging

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('Axios interceptor - Token:', token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Axios interceptor - Headers:', config.headers);
  }
  return config;
});

// Add response interceptor for debugging
instance.interceptors.response.use(
  response => {
    console.log('API Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

export default instance;
