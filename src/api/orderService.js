// src/api/orderService.js
import axios from './axios';

/**
 * Checkout: ödeme/kargo bilgilerini backend’e yollayıp
 * { status:'success', data:{ order, invoiceUrl } } döner
 */
export const checkout = async ({ paymentDetails, shippingDetails, cartItems }) => {
  const response = await axios.post('/api/orders/checkout', {
    payment: paymentDetails,
    shipping: shippingDetails,
    cart: cartItems
  });
  return response.data; // { status:'success', data:{ order, invoiceUrl } }
};

/**
 * Kullanıcının tüm sipariş geçmişini çeker.
 * Dönen yapı: { status:'success', data: [order1, order2, …] }
 */
export const getOrderHistory = async () => {
  const response = await axios.get('/api/orders');
  return response.data;
};

/**
 * Tek bir siparişin detaylarını alır.
 * Dönen yapı: { status:'success', data: {order} }
 */
export const getOrderDetails = async (orderId) => {
  const response = await axios.get(`/api/orders/${orderId}`);
  return response.data;
};

/**
 * Sipariş durumunu sorgular.
 * Dönen yapı: { status:'success', data:{ status: 'processing'|'in-transit'|'delivered' } }
 */
export const getOrderStatus = async (orderId) => {
  const response = await axios.get(`/api/orders/${orderId}/status`);
  return response.data;
};

/**
 * Bir ürüne derecelendirme (1–5) gönderir.
 */
export const submitProductRating = async (productId, rating) => {
  const response = await axios.post(`/api/products/${productId}/rate`, { rating });
  return response.data;
};

/**
 * Bir ürüne yorum gönderir.
 */
export const submitProductComment = async (productId, comment) => {
  const response = await axios.post(`/api/products/${productId}/comment`, { comment });
  return response.data;
};

/**
 * Invoice PDF’ini indirir (blob).
 */
export const downloadInvoice = async (orderId) => {
  const response = await axios.get(`/api/orders/${orderId}/invoice`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Kullanıcıya e-posta olarak faturayı tekrar gönderir.
 */
export const emailInvoice = async (orderId) => {
  const response = await axios.post(`/api/orders/${orderId}/email-invoice`);
  return response.data;
};
