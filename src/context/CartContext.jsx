import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  addToCartAuthenticated, 
  addToCartGuest, 
  getCart,
  updateCartItem,
  removeCartItem 
} from '../api/cartService';

// Create Context
const CartContext = createContext();

// Custom hook to use the cart context
export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(localStorage.getItem('guestCartId') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  
  // Load cart on mount and when auth status changes
  useEffect(() => {
    fetchCart(true);
  }, [isAuthenticated]);
  
  // Fetch cart contents with debouncing and retry limiting
  const fetchCart = useCallback(async (force = false) => {
    // Prevent rapid successive fetches (debounce)
    const now = Date.now();
    if (!force && now - lastFetchTime < 2000 && cartItems.length > 0) {
      console.log('Skipping cart fetch - too recent');
      return;
    }
    
    // Limit retry attempts on errors
    if (fetchAttempts > 3 && !force) {
      console.log('Too many fetch attempts, skipping');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setLastFetchTime(now);
      
      const response = await getCart();
      console.log('Cart fetch response:', response);
      
      if (response.status === 'success' && response.data) {
        setCartItems(response.data.items || []);
        if (response.data._id) {
          setCartId(response.data._id);
          // Store cart ID for guest users
          if (!isAuthenticated) {
            localStorage.setItem('guestCartId', response.data._id);
          }
        }
        // Reset fetch attempts on success
        setFetchAttempts(0);
      } else if (response.status === 'error') {
        // Handle error gracefully
        console.log('Could not fetch cart, using empty cart instead');
        setCartItems([]);
        setFetchAttempts(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      // Only set user-facing error if this is important for UX
      // For background fetches, just log to console
      if (force) {
        setError('Failed to load cart. Please try again.');
      }
      // Set empty cart on error
      setCartItems([]);
      setFetchAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [cartItems.length, lastFetchTime, fetchAttempts, isAuthenticated]);
  
  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    if (!productId) {
      console.error('Cannot add to cart: productId is required');
      return { success: false, error: 'Product ID is required' };
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Adding product ${productId} to cart, quantity: ${quantity}`);
      
      const response = isAuthenticated
        ? await addToCartAuthenticated(productId, quantity)
        : await addToCartGuest(productId, quantity, cartId);
      
      console.log('Add to cart response:', response);
      
      if (response?.status === 'success' && response.data) {
        setCartItems(response.data.items || []);
        if (response.data._id) {
          setCartId(response.data._id);
          
          // Store cart ID in localStorage for guest carts
          if (!isAuthenticated) {
            localStorage.setItem('guestCartId', response.data._id);
          }
        }
        return { success: true };
      } else {
        throw new Error(response?.message || 'Failed to add item to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add item to cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update cart item quantity
  const updateItemQuantity = async (productId, quantity) => {
    if (!productId) {
      console.error('Cannot update cart: productId is required');
      return { success: false, error: 'Product ID is required' };
    }
    
    if (quantity <= 0) {
      return removeItem(productId);
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Save current cart state for rollback if needed
      const previousCartItems = [...cartItems];
      
      // Optimistic update for better UX
      const updatedCartItems = cartItems.map(item => 
        item.product._id === productId ? { ...item, quantity } : item
      );
      setCartItems(updatedCartItems);
      
      // Log the optimistic update
      console.log(`Optimistically updated quantity for product ${productId} to ${quantity}`);
      
      try {
        // Attempt to update via API
        const response = await updateCartItem(productId, quantity);
        
        if (response?.status === 'success' && response.data) {
          // Validate response data before using it
          if (response.data.items && Array.isArray(response.data.items)) {
            console.log('API update successful, updating cart with server data');
            setCartItems(response.data.items);
          } else {
            // If response doesn't have valid items, stick with our optimistic update
            console.log('API returned success but no valid items, keeping optimistic update');
          }
          return { success: true };
        } else if (response?.status === 'error') {
          // API returned an error but we'll keep the optimistic update
          console.warn('API returned error but keeping optimistic update:', response.message);
          // Don't revert UI but do set an error message
          setError(response.message || 'Could not update cart on server');
          return { success: true, warning: 'Changes may not be saved to server' };
        } else {
          // Unexpected response format, but still keep optimistic update
          console.warn('Unexpected API response format, keeping optimistic update');
          return { success: true, warning: 'Changes may not be saved to server' };
        }
      } catch (apiError) {
        console.error('API error during cart update:', apiError);
        // Even if API fails, we'll keep the optimistic update for better UX
        setError('Could not save changes to server, but your cart has been updated locally');
        return { success: true, warning: 'Changes not saved to server' };
      }
    } catch (err) {
      console.error('Error updating cart:', err);
      const errorMessage = 'Failed to update cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove item from cart
  const removeItem = async (productId) => {
    if (!productId) {
      console.error('Error: Cannot remove item - productId is missing');
      return { success: false, error: 'Product ID is required' };
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Save previous cart state for possible rollback
      const previousCartItems = [...cartItems];
      
      // Optimistic update - remove item immediately for better UX
      const filteredItems = cartItems.filter(item => item.product._id !== productId);
      setCartItems(filteredItems);
      
      // Log the optimistic update
      console.log(`Optimistically removed product ${productId} from cart`);
      
      try {
        // Try to update the server
        const response = await removeCartItem(productId);
        console.log('Remove item response:', response);
        
        if (response?.status === 'success') {
          // Only use the response data if it's valid
          if (response.data?.items && Array.isArray(response.data.items)) {
            const validResponseItems = response.data.items.every(
              item => item.product && item.product._id
            );
            
            if (validResponseItems) {
              console.log('API remove successful, updating cart with server data');
              setCartItems(response.data.items);
            } else {
              // If response has invalid items, keep our optimistic update
              console.log('API returned invalid items, keeping optimistic update');
            }
          }
          return { success: true };
        } else if (response?.status === 'error') {
          // API returned an error, but we'll keep the optimistic update
          console.warn('API returned error but keeping optimistic update:', response.message);
          setError(response.message || 'Could not update cart on server');
          return { success: true, warning: 'Item removed locally, but changes may not be saved to server' };
        } else {
          // Unexpected response format, but still keep optimistic update
          console.warn('Unexpected API response format, keeping optimistic update');
          return { success: true, warning: 'Item removed locally, but changes may not be saved to server' };
        }
      } catch (apiError) {
        console.error('API error during item removal:', apiError);
        // Even if API fails, keep optimistic update for better UX
        setError('Could not save changes to server, but item has been removed from your cart locally');
        return { success: true, warning: 'Item removed locally, but changes not saved to server' };
      }
    } catch (err) {
      console.error('Error removing item from cart:', err);
      const errorMsg = 'Failed to remove item from cart';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get cart total quantity
  const getCartTotalQuantity = () => {
    return cartItems.reduce((total, item) => {
      // Ensure item and quantity are valid
      if (!item || typeof item.quantity !== 'number') return total;
      return total + item.quantity;
    }, 0);
  };
  
  // Get cart total price
  const getCartTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Ensure item, product, and price are valid
      if (!item || !item.product || typeof item.product.price !== 'number') {
        return total;
      }
      return total + (item.product.price * item.quantity);
    }, 0);
  };
  
  // Clear cart
  const clearCart = async () => {
    try {
      setIsLoading(true);
      console.log('Clearing cart...');
      
      // If we have a real cart ID, attempt to clear it on the server
      if (cartId) {
        try {
          // You might need to implement this API endpoint
          // This is a placeholder for what the API call might look like
          // const response = await axios.delete(`/api/cart/${cartId}`);
          
          // For now, just wait a moment to simulate API call
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('Cart cleared on server');
        } catch (err) {
          console.error('Failed to clear cart on server, but continuing with local clear:', err);
          // Continue with local clear even if server fails
        }
      }
      
      // Clear local cart state
      setCartItems([]);
      
      // Clear guest cart ID if not authenticated
      if (!isAuthenticated) {
        localStorage.removeItem('guestCartId');
        setCartId(null);
      }
      
      console.log('Cart cleared successfully');
      return { success: true };
    } catch (err) {
      console.error('Error clearing cart:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    cartItems,
    cartId,
    isLoading,
    error,
    addToCart,
    updateItemQuantity,
    removeItem,
    getCartTotalQuantity,
    getCartTotalPrice,
    clearCart,
    fetchCart
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export default CartContext; 