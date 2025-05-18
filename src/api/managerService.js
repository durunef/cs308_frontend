// src/api/managerService.js
import axios from './axios';

// Products
export const fetchAllProducts = () =>
  axios.get('/api/v1/product-manager/products').then(r => r.data);

export const createProduct = formData =>
  axios.post('/api/v1/product-manager/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);

// …and so on for update/delete, categories, stocks, reviews, orders, invoices
