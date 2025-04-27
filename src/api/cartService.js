// src/api/cartService.js

import axios from './axios';

// auth’li ekleme → /api/cart/add
export const addToCartAuthenticated = async (productId, quantity) => {
  const response = await axios.post('/api/cart/add', { productId, quantity });
  return response.data;
};

// guest ekleme, guestCartId’yi localStorage’a kaydet
export const addToCartGuest = async (productId, quantity, cartId = null) => {
  const payload = { productId, quantity };
  if (cartId) payload.cartId = cartId;
  const response = await axios.post('/api/cart/add', payload);
  if (response.data?.status === 'success' && response.data.data?._id) {
    localStorage.setItem('guestCartId', response.data.data._id);
  }
  return response.data;
};

// sepeti çek
export const getCart = async () => {
  try {
    const cartId = localStorage.getItem('guestCartId');
    let endpoint = '/api/cart';
    if (!localStorage.getItem('token')) {
      if (cartId) endpoint = `/api/cart?cartId=${cartId}`;
      else return { status: 'success', data: { _id: null, items: [] } };
    }
    const resp = await axios.get(endpoint);
    return resp.data;
  } catch {
    return { status: 'error', data: { items: [] } };
  }
};

// miktar güncelle → /api/cart/update
export const updateCartItem = async (productId, quantity) => {
  try {
    const payload = { productId, quantity };
    if (!localStorage.getItem('token')) {
      const cartId = localStorage.getItem('guestCartId');
      if (cartId) payload.cartId = cartId;
      else throw new Error('No cart ID for guest');
    }
    const resp = await axios.post('/api/cart/update', payload);
    return resp.data;
  } catch {
    return { status: 'error', message: 'Failed to update cart item' };
  }
};

// sepetten çıkar → /api/cart/remove
export const removeCartItem = async (productId) => {
  try {
    const payload = { productId };
    if (!localStorage.getItem('token')) {
      const cartId = localStorage.getItem('guestCartId');
      if (cartId) payload.cartId = cartId;
    }
    const resp = await axios.post('/api/cart/remove', payload);
    return resp.data;
  } catch {
    return { status: 'error', message: 'Failed to remove item' };
  }
};

// **MERGE**: artık addToCartAuthenticated yerine updateCartItem kullanıyoruz!
export const mergeGuestCart = async (guestCartId) => {
  try {
    const token = localStorage.getItem('token');
    if (!guestCartId || !token) {
      throw new Error('Cannot merge: missing guestCartId or token');
    }

    // önce guest sepetini çek
    const resp = await axios.get(`/api/cart?cartId=${guestCartId}`);
    if (resp.data?.status !== 'success') {
      throw new Error('Failed to fetch guest cart');
    }
    const guestItems = resp.data.data.items || [];

    // her birini user cart’a **set** et
    for (const item of guestItems) {
      await updateCartItem(item.product._id, item.quantity);
    }

    return { status: 'success', message: 'Guest cart merged' };
  } catch (err) {
    console.error('Error merging guest cart:', err);
    return { status: 'error', message: err.message };
  }
};
