// src/api/axios.js
import axios from 'axios';
import { API_URL } from '../config';

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

export default instance;
