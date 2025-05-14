import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
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

  // Fetch wishlist items
  const fetchWishlist = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/v1/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setWishlistItems(response.data.data.wishlist || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId) => {
    if (!isAuthenticated) return { success: false, error: 'Please login to add items to wishlist' };
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/wishlist`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        await fetchWishlist();
        return { success: true };
      }
      throw new Error(response.data.message || 'Failed to add to wishlist');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add to wishlist';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) return { success: false, error: 'Please login to manage wishlist' };
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.delete(
        `${API_URL}/api/v1/wishlist/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 204) {
        await fetchWishlist();
        return { success: true };
      }
      throw new Error('Failed to remove from wishlist');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove from wishlist';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Update notification preference
  const updateNotificationPreference = async (productId, notifyOnDiscount) => {
    if (!isAuthenticated) return { success: false, error: 'Please login to manage wishlist' };
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.patch(
        `${API_URL}/api/v1/wishlist/${productId}`,
        { notifyOnDiscount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 204) {
        await fetchWishlist();
        return { success: true };
      }
      throw new Error('Failed to update notification preference');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update notification preference';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product._id === productId);
  };

  // Fetch wishlist on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [isAuthenticated]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isLoading,
        error,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        updateNotificationPreference,
        isInWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
} 