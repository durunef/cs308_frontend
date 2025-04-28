import axios from './axios';

/**
 * Add to cart when authenticated.  Creates a cart if none yet.
 */
export const addToCartAuthenticated = async (productId, quantity) => {
  const response = await axios.post('/api/cart/add', { productId, quantity });
  return response.data;
};

/**
 * Add to cart as guest.  Returns guestCartId in data._id, which we store.
 */
export const addToCartGuest = async (productId, quantity, cartId = null) => {
  const payload = { productId, quantity };
  if (cartId) payload.cartId = cartId;
  const resp = await axios.post('/api/cart/add', payload);

  if (resp.data?.status === 'success' && resp.data.data?._id) {
    localStorage.setItem('guestCartId', resp.data.data._id);
  }
  return resp.data;
};

/**
 * Fetch the cart:
 *  - if logged in, GET /api/cart → user’s cart
 *  - if guest & have guestCartId, GET /api/cart?cartId=… → guest’s cart
 *  - else empty
 */
export const getCart = async () => {
  try {
    const guestId = localStorage.getItem('guestCartId');
    let url = '/api/cart';
    if (!localStorage.getItem('token')) {
      if (guestId) url = `/api/cart?cartId=${guestId}`;
      else return { status: 'success', data: { _id: null, items: [] } };
    }
    const resp = await axios.get(url);
    return resp.data;
  } catch {
    return { status: 'error', data: { items: [] } };
  }
};

/**
 * Update quantity of an existing line.
 */
export const updateCartItem = async (productId, quantity) => {
  try {
    const payload = { productId, quantity };
    if (!localStorage.getItem('token')) {
      const guestId = localStorage.getItem('guestCartId');
      if (guestId) payload.cartId = guestId;
      else throw new Error('No cart ID for guest');
    }
    const resp = await axios.post('/api/cart/update', payload);
    return resp.data;
  } catch {
    return { status: 'error', message: 'Failed to update cart item' };
  }
};

/**
 * Remove a line-item.
 */
export const removeCartItem = async (productId) => {
  try {
    const payload = { productId };
    if (!localStorage.getItem('token')) {
      const guestId = localStorage.getItem('guestCartId');
      if (guestId) payload.cartId = guestId;
    }
    const resp = await axios.post('/api/cart/remove', payload);
    return resp.data;
  } catch {
    return { status: 'error', message: 'Failed to remove item' };
  }
};

/**
 * Merge the old guest cart into the now-logged-in user cart:
 * 1) fetch guest cart via native fetch(...) so no JWT header is sent
 * 2) for each guest line, call addToCartAuthenticated(...)
 * 3) clear out guestCartId so we don’t merge again
 */
export const mergeGuestCart = async (guestCartId) => {
  try {
    const token = localStorage.getItem('token');
    if (!guestCartId || !token) {
      throw new Error('Cannot merge: missing guestCartId or token');
    }

    // 1) raw fetch → no axios interceptor → no Authorization header
    const base = axios.defaults.baseURL || '';
    const raw = await fetch(`${base}/api/cart?cartId=${guestCartId}`);
    const guestResp = await raw.json();
    if (guestResp.status !== 'success') {
      throw new Error('Failed to fetch guest cart');
    }

    const items = guestResp.data.items || [];

    // 2) re-POST each into the authenticated user cart
    for (const item of items) {
      await addToCartAuthenticated(item.product._id || item.product, item.quantity);
    }

    return { status: 'success', message: 'Guest cart merged' };
  } catch (err) {
    console.error('Error merging guest cart:', err);
    return { status: 'error', message: err.message };
  } finally {
    localStorage.removeItem('guestCartId');
  }
};
