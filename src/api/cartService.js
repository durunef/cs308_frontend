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
    // Create the payload
    const payload = {
      productId,
      quantity
    };
    
    // If cartId exists, include it in the request body
    if (cartId) {
      payload.cartId = cartId;
    }
    
    // Make the API call
    const response = await axios.post('/api/cart/add', payload);
    
    // Store the cartId in localStorage for future use
    if (response.data && response.data.status === 'success' && response.data.data && response.data.data._id) {
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
    // Get the cartId from localStorage for guest users
    const cartId = localStorage.getItem('guestCartId');
    let endpoint = '/api/cart';
    
    // If we're a guest user
    if (!localStorage.getItem('token')) {
      // If we have a cartId, use it
      if (cartId) {
        endpoint = `/api/cart?cartId=${cartId}`;
      } else {
        // For guest users with no cartId, create a new cart instead of fetching
        console.log('No cart ID for guest user, creating a new cart');
        // Create an empty cart and return it
        return {
          status: 'success',
          data: {
            _id: null,
            items: []
          }
        };
      }
    }
    
    // Make the API call
    const response = await axios.get(endpoint);
    
    // Log successful response
    console.log('Cart fetch successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    // Return a fallback response with empty items
    return {
      status: 'error',
      data: {
        items: []
      }
    };
  }
};

// Update cart item quantity
export const updateCartItem = async (productId, quantity) => {
  try {
    // Create the base payload
    const payload = {
      productId,
      quantity
    };
    
    // Add cartId for guest users
    if (!localStorage.getItem('token')) {
      const cartId = localStorage.getItem('guestCartId');
      if (cartId) {
        payload.cartId = cartId;
      } else {
        throw new Error('No cart ID found for guest user');
      }
    }
    
    // Log what we're sending
    console.log('Updating cart with payload:', payload);
    
    // Use the add endpoint - it already handles both add and update cases
    const response = await axios.post('/api/cart/add', payload);
    console.log('Cart update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    
    // Return a fallback response that won't break the UI
    return {
      status: 'error',
      message: 'Failed to update cart item',
      data: {
        items: [] // Return empty items to avoid breaking the UI
      }
    };
  }
};

// Remove item from cart
export const removeCartItem = async (productId) => {
  try {
    if (!productId) {
      console.error('Error: productId is required for removing cart item');
      throw new Error('Product ID is required');
    }
    
    // Create the base payload
    const payload = { productId };
    
    // Add cartId for guest users
    if (!localStorage.getItem('token')) {
      const cartId = localStorage.getItem('guestCartId');
      if (cartId) {
        payload.cartId = cartId;
      } else {
        console.warn('No cartId found in localStorage for guest user');
      }
    }
    
    console.log('Removing cart item with payload:', payload);
    
    // Use the remove endpoint
    const response = await axios.post('/api/cart/remove', payload);
    console.log('Remove cart item response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error removing cart item:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    
    // Return a fallback response
    return {
      status: 'error',
      message: 'Failed to remove item from cart',
      data: {
        items: [] // Return empty items as fallback
      }
    };
  }
};

// We'll implement cart merging manually since there's no endpoint
export const mergeGuestCart = async (guestCartId) => {
  try {
    if (!guestCartId) {
      throw new Error('Guest cart ID is required');
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('User must be authenticated to merge carts');
    }
    
    console.log('Manually merging guest cart:', guestCartId);
    
    // Get the guest cart contents
    const response = await axios.get(`/api/cart?cartId=${guestCartId}`);
    
    if (!response.data || response.data.status !== 'success' || !response.data.data || !response.data.data.items) {
      throw new Error('Failed to fetch guest cart for merging');
    }
    
    const guestCartItems = response.data.data.items;
    let mergeResults = { success: [], errors: [] };
    
    // Add each item from the guest cart to the user's cart
    for (const item of guestCartItems) {
      try {
        await addToCartAuthenticated(item.product._id, item.quantity);
        mergeResults.success.push(item.product._id);
      } catch (error) {
        // Capture the error message
        const errorMessage = error.response?.data?.message || `Failed to add ${item.product.name || 'item'}`;
        mergeResults.errors.push({
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          message: errorMessage
        });
        console.warn(`Could not add item ${item.product._id} during merge: ${errorMessage}`);
      }
    }
    
    // Remove the guest cart ID from localStorage even if we had partial failures
    localStorage.removeItem('guestCartId');
    
    // If we had any successful merges, consider it a success but with warnings
    if (mergeResults.success.length > 0) {
      // Create a list of warnings for items that couldn't be added
      const warnings = mergeResults.errors.map(err => ({
        productId: err.productId,
        productName: err.productName || 'Product',
        message: err.message.includes('stock limit') ? 
          `${err.productName || 'Product'} exceeded stock limit` : 
          err.message
      }));
      
      return {
        status: 'success',
        message: `${mergeResults.success.length} items merged, ${mergeResults.errors.length} failed`,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
    
    // If all items failed, return error
    if (mergeResults.errors.length > 0) {
      return {
        status: 'error',
        message: 'Failed to merge any items from guest cart',
        warnings: mergeResults.errors
      };
    }
    
    // If no items to merge
    return {
      status: 'success',
      message: 'No items to merge from guest cart'
    };
  } catch (error) {
    console.error('Error merging guest cart:', error);
    // Remove guest cart ID even on errors to prevent repeated failures
    localStorage.removeItem('guestCartId');
    return {
      status: 'error',
      message: error.message || 'Failed to merge guest cart'
    };
  }
}; 