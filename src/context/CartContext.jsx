import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  addToCartAuthenticated,
  addToCartGuest,
  getCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  mergeGuestCart
} from '../api/cartService';

const CartContext = createContext();
export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(localStorage.getItem('guestCartId') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1) Sepeti getir
  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCart();
      if (response.status === 'success' && response.data) {
        setCartItems(response.data.items || []);
        if (response.data._id) {
          setCartId(response.data._id);
          if (!isAuthenticated) localStorage.setItem('guestCartId', response.data._id);
        }
      } else {
        setCartItems([]);
      }
    } catch {
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // 2) Guest-to-user cart merge
  const mergeCartsOnLogin = useCallback(async () => {
    const guestCartId = localStorage.getItem('guestCartId');
    if (!guestCartId) return;
    setIsLoading(true);
    try {
      await mergeGuestCart(guestCartId);
      await fetchCart();
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [fetchCart]);

  // 3) Başlangıçta veya login değişince
  useEffect(() => {
    if (isAuthenticated) mergeCartsOnLogin();
    else fetchCart();
  }, [isAuthenticated, fetchCart, mergeCartsOnLogin]);

  // 4) Add-to-cart (aynı)
  const addToCart = async (productId, quantity = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = isAuthenticated
        ? await addToCartAuthenticated(productId, quantity)
        : await addToCartGuest(productId, quantity, cartId);
      if (resp.status === 'success') {
        // ekledikten sonra hem badge, hem detay için yeniden çek
        await fetchCart();
        return { success: true };
      }
      throw new Error(resp.message || 'Add to cart failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add to cart';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // 5) Quantity update
  const updateItemQuantity = async (productId, quantity) => {
    setIsLoading(true);
    setError(null);

    // Optimistic olarak badge güncellemek için önce context'i güncelle
    setCartItems(prev =>
      prev.map(i => (i.product._id === productId ? { ...i, quantity } : i))
    );

    try {
      const resp = await apiUpdateCartItem(productId, quantity);
      if (resp.status === 'success') {
        // mutlak doğru data için yeniden fetch
        await fetchCart();
        return { success: true };
      } else {
        const msg = resp.message || 'Could not update quantity';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // 6) Remove item
  const removeItem = async (productId) => {
    setIsLoading(true);
    setError(null);

    // Önce badge için optimist çıkart
    setCartItems(prev => prev.filter(i => i.product._id !== productId));

    try {
      const resp = await apiRemoveCartItem(productId);
      if (resp.status === 'success') {
        await fetchCart();
        return { success: true };
      } else {
        const msg = resp.message || 'Could not remove item';
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // 7) Toplam fiyat ve adet
  const getCartTotalPrice = () =>
    cartItems.reduce((sum, i) => sum + i.quantity * i.product.price, 0);

  const getCartTotalQuantity = () =>
    cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading,
        error,
        fetchCart,
        addToCart,
        updateItemQuantity,
        removeItem,
        getCartTotalPrice,
        getCartTotalQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
