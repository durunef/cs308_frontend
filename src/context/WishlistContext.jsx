import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import axios from '../api/axios';
import { API_URL } from '../config';

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchTimeRef = useRef(0);
  const isFetchingRef = useRef(false);

  // Fetch wishlist items with caching
  const fetchWishlist = useCallback(async (force = false) => {
    if (!isAuthenticated || isFetchingRef.current) {
      return;
    }
    
    // Only fetch if forced or if data is older than 30 seconds
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 30000) {
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/api/v1/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === 'success') {
        const items = response.data.data.wishlist || [];
        setWishlistItems(items);
        lastFetchTimeRef.current = now;
      } else {
        throw new Error(response.data.message || 'Failed to fetch wishlist');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch wishlist';
      setError(errorMessage);
      setWishlistItems([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [isAuthenticated, token]);

  // Add item to wishlist
  const addToWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please login to add items to wishlist' };
    }
    
    setError(null);
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/wishlist`,
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        // Force a fresh fetch of the wishlist to ensure we have the complete data
        await fetchWishlist(true);
        return { success: true };
      }
      throw new Error(response.data.message || 'Failed to add to wishlist');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add to wishlist';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [isAuthenticated, token, fetchWishlist]);

  // Remove item from wishlist
  const removeFromWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please login to manage wishlist' };
    }
    
    setError(null);
    try {
      const response = await axios.delete(
        `${API_URL}/api/v1/wishlist/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 204) {
        setWishlistItems(prev => prev.filter(item => item.productId !== productId));
        return { success: true };
      }
      throw new Error('Failed to remove from wishlist');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove from wishlist';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [isAuthenticated, token]);

  // Update notification preference
  const updateNotificationPreference = useCallback(async (productId, notifyOnDiscount) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please login to manage wishlist' };
    }
    
    setError(null);
    try {
      const response = await axios.patch(
        `${API_URL}/api/v1/wishlist/${productId}`,
        { notifyOnDiscount },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200 && response.data.status === 'success') {
        // Update the wishlist items with the response data
        setWishlistItems(prev => prev.map(item => 
          item.productId === productId 
            ? { ...item, notifyOnDiscount: response.data.data.wishlistItem.notifyOnDiscount }
            : item
        ));
        return { success: true };
      }
      throw new Error('Failed to update notification preference');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update notification preference';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [isAuthenticated, token]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId) => {
    return wishlistItems.some(item => item.productId === productId);
  }, [wishlistItems]);

  // Fetch wishlist on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist(true);
    } else {
      setWishlistItems([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchWishlist]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    wishlistItems,
    isLoading,
    error,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    updateNotificationPreference,
    isInWishlist
  }), [
    wishlistItems,
    isLoading,
    error,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    updateNotificationPreference,
    isInWishlist
  ]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
} 