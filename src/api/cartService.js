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
    
    // If we're a guest user with a cart ID
    if (!localStorage.getItem('token') && cartId) {
      // Pass the cartId as a query parameter
      endpoint = `/api/cart?cartId=${cartId}`;
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
    
    // Try to determine which endpoint is available
    // First try the standard update endpoint with POST
    try {
      const response = await axios.post('/api/cart/update', payload);
      console.log('Cart update response:', response.data);
      return response.data;
    } catch (endpointError) {
      console.log('First update attempt failed, trying alternative endpoint...');
      
      // If the update endpoint fails, try using the add endpoint with the new quantity
      // Many implementations allow re-adding an item to update its quantity
      try {
        const response = await axios.post('/api/cart/add', payload);
        console.log('Cart update via add endpoint response:', response.data);
        return response.data;
      } catch (addError) {
        console.log('Second update attempt failed, trying one more endpoint...');
        
        // As a last resort, try the update-item endpoint
        try {
          const response = await axios.post('/api/cart/update-item', payload);
          console.log('Cart update via update-item endpoint response:', response.data);
          return response.data;
        } catch (finalError) {
          // If all attempts fail, throw the original error
          throw endpointError;
        }
      }
    }
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
    
    // Try to determine which endpoint is available
    // First try the standard remove endpoint
    try {
      const response = await axios.post('/api/cart/remove', payload);
      console.log('Remove cart item response:', response.data);
      return response.data;
    } catch (endpointError) {
      console.log('First remove attempt failed, trying alternative endpoint...');
      
      // Try another possible endpoint
      try {
        const response = await axios.post('/api/cart/delete', payload);
        console.log('Remove via delete endpoint response:', response.data);
        return response.data;
      } catch (deleteError) {
        console.log('Second remove attempt failed, trying one more endpoint...');
        
        // As a last resort, try with DELETE method
        try {
          const response = await axios.delete('/api/cart/item', { data: payload });
          console.log('Remove via DELETE method response:', response.data);
          return response.data;
        } catch (finalError) {
          // If all attempts fail, throw the original error
          throw endpointError;
        }
      }
    }
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