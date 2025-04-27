import axios from './axios';

// Add item to cart with authentication
export const addToCartAuthenticated = async (productId, quantity) => {
  try {
    const response = await axios.post('/api/cart/add', {
      productId,
      quantity
    });
    return response.data;
  } catch (error) {
    console.error('Error adding item to cart (authenticated):', error);
    throw error;
  }
};

// Add item to cart without authentication (guest cart)
export const addToCartGuest = async (productId, quantity, cartId = null) => {
  try {
    const payload = { productId, quantity };
    if (cartId) {
      payload.cartId = cartId;
    }
    const response = await axios.post('/api/cart/add', payload);
    if (response.data?.status === 'success' && response.data.data?._id) {
      localStorage.setItem('guestCartId', response.data.data._id);
    }
    return response.data;
  } catch (error) {
    console.error('Error adding item to cart (guest):', error);
    throw error;
  }
};

// Get cart contents
export const getCart = async () => {
  try {
    const cartId = localStorage.getItem('guestCartId');
    let endpoint = '/api/cart';

    // Guest user: gönderilecek cartId varsa query’ye ekle
    if (!localStorage.getItem('token')) {
      if (cartId) {
        endpoint = `/api/cart?cartId=${cartId}`;
      } else {
        console.log('No cart ID for guest user, returning empty cart');
        return { status: 'success', data: { _id: null, items: [] } };
      }
    }

    const response = await axios.get(endpoint);
    console.log('Cart fetch successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return { status: 'error', data: { items: [] } };
  }
};

// Update cart item quantity
export const updateCartItem = async (productId, quantity) => {
  try {
    const payload = { productId, quantity };
    if (!localStorage.getItem('token')) {
      const cartId = localStorage.getItem('guestCartId');
      if (cartId) {
        payload.cartId = cartId;
      } else {
        throw new Error('No cart ID found for guest user');
      }
    }

    console.log('Updating cart with payload:', payload);
    // --- BURADA DEĞİŞTİRDİK ---
    const response = await axios.post('/api/cart/update', payload);
    console.log('Cart update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    return {
      status: 'error',
      message: 'Failed to update cart item',
      data: { items: [] }
    };
  }
};

// Remove item from cart
export const removeCartItem = async (productId) => {
  try {
    if (!productId) throw new Error('Product ID is required');

    const payload = { productId };
    if (!localStorage.getItem('token')) {
      const cartId = localStorage.getItem('guestCartId');
      if (cartId) payload.cartId = cartId;
    }

    console.log('Removing cart item with payload:', payload);
    const response = await axios.post('/api/cart/remove', payload);
    console.log('Remove cart item response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error removing cart item:', error);
    return {
      status: 'error',
      message: 'Failed to remove item from cart',
      data: { items: [] }
    };
  }
};

// Merge guest cart into user cart after login
export const mergeGuestCart = async (guestCartId) => {
  try {
    if (!guestCartId) throw new Error('Guest cart ID is required');
    const token = localStorage.getItem('token');
    if (!token) throw new Error('User must be authenticated to merge carts');

    console.log('Manually merging guest cart:', guestCartId);

    const response = await axios.get(`/api/cart?cartId=${guestCartId}`);
    if (response.data?.status !== 'success' || !response.data.data?.items) {
      throw new Error('Failed to fetch guest cart for merging');
    }

    const guestItems = response.data.data.items;
    let mergeResults = { success: [], errors: [] };

    for (const item of guestItems) {
      try {
        await addToCartAuthenticated(item.product._id, item.quantity);
        mergeResults.success.push(item.product._id);
      } catch (err) {
        const msg = err.response?.data?.message || `Failed to add item`;
        mergeResults.errors.push({
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          message: msg
        });
      }
    }

    localStorage.removeItem('guestCartId');

    if (mergeResults.success.length > 0) {
      const warnings = mergeResults.errors.map(e => ({
        productId: e.productId,
        productName: e.productName,
        message: e.message.includes('stock') 
          ? `${e.productName} exceeded stock limit`
          : e.message
      }));
      return {
        status: 'success',
        message: `${mergeResults.success.length} items merged, ${mergeResults.errors.length} failed`,
        warnings: warnings.length ? warnings : undefined
      };
    }

    if (mergeResults.errors.length) {
      return {
        status: 'error',
        message: 'Failed to merge any items from guest cart',
        warnings: mergeResults.errors
      };
    }

    return { status: 'success', message: 'No items to merge from guest cart' };

  } catch (error) {
    console.error('Error merging guest cart:', error);
    localStorage.removeItem('guestCartId');
    return { status: 'error', message: error.message || 'Failed to merge guest cart' };
  }
};
