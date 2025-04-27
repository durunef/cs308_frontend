// src/components/Cart/Cart.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faPlus,
  faMinus,
  faArrowLeft,
  faShoppingCart
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';
import './Cart.css';

function Cart() {
  const {
    cartItems,
    isLoading,
    error,
    fetchCart,
    updateItemQuantity,
    removeItem,
    getCartTotalPrice
  } = useCart();

  const [localItems, setLocalItems] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (cartItems && cartItems.length >= 0) {
      const items = cartItems
        .filter(item => item?.product?._id && item.product.name)
        .map(item => ({ ...item, isLoading: false }));
      setLocalItems(items);
    }
  }, [cartItems]);

  const handleQuantityChange = async (item, action, index) => {
    // Eğer hâlihazırda güncelleme varsa yeni isteği iptal et
    if (isUpdating) return;

    const newQuantity = action === 'increment'
      ? item.quantity + 1
      : item.quantity - 1;

    if (newQuantity < 1) return;

    const stockLimit = item.product.quantityInStock || item.product.quantity_in_stocks || 0;
    if (newQuantity > stockLimit) {
      const updated = [...localItems];
      updated[index] = {
        ...updated[index],
        errorMessage: `Only ${stockLimit} available in stock`,
        showError: true
      };
      setLocalItems(updated);

      setTimeout(() => {
        const cleared = [...localItems];
        if (cleared[index]) {
          cleared[index] = { ...cleared[index], showError: false };
          setLocalItems(cleared);
        }
      }, 3000);
      return;
    }

    // Başlat: loading & disable
    setIsUpdating(true);
    const updated = [...localItems];
    updated[index].isLoading = true;
    setLocalItems(updated);

    try {
      const result = await updateItemQuantity(item.product._id, newQuantity);

      if (!result.success && result.error) {
        const errItems = [...localItems];
        errItems[index] = {
          ...errItems[index],
          errorMessage: result.error,
          showError: true,
          isLoading: false
        };
        setLocalItems(errItems);

        setTimeout(() => {
          const cleared = [...localItems];
          if (cleared[index]) {
            cleared[index] = { ...cleared[index], showError: false };
            setLocalItems(cleared);
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to update quantity', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (item, index) => {
    if (isUpdating) return;

    setIsUpdating(true);
    const updated = [...localItems];
    updated[index].isLoading = true;
    setLocalItems(updated);

    try {
      await removeItem(item.product._id);
      // Sepet güncellendiğinde context tetiklenecek, localItems yeniden set edilir
    } catch (err) {
      console.error('Failed to remove item', err);
      const reverted = [...localItems];
      reverted[index].isLoading = false;
      setLocalItems(reverted);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && !localItems.length) {
    return (
      <div className="cart-container">
        <div className="loading-cart">
          <div className="loading-spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container">
        <div className="cart-error">
          <p>{error}</p>
          <button className="retry-button" onClick={() => fetchCart(true)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!localItems.length) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <FontAwesomeIcon icon={faShoppingCart} className="empty-cart-icon" />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any products to your cart yet.</p>
          <Link to="/" className="continue-shopping-button">
            <FontAwesomeIcon icon={faArrowLeft} /> Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>

      <div className="cart-items">
        {localItems.map((item, index) => (
          <div
            key={item._id || index}
            className={`cart-item ${item.isLoading ? 'loading' : ''}`}
          >
            <div className="cart-item-image">
              {item.product.image && (
                <img src={item.product.image} alt={item.product.name} />
              )}
            </div>
            <div className="cart-item-details">
              <h3>{item.product.name}</h3>
              <p className="cart-item-price">
                ${item.product.price?.toFixed(2) ?? '0.00'}
              </p>
            </div>
            <div className="cart-item-quantity">
              <button
                onClick={() => handleQuantityChange(item, 'decrement', index)}
                disabled={item.isLoading || isUpdating || item.quantity <= 1}
                className="quantity-button"
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <span className="quantity">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item, 'increment', index)}
                disabled={
                  item.isLoading ||
                  isUpdating ||
                  item.quantity >= (item.product.quantityInStock || item.product.quantity_in_stocks)
                }
                className="quantity-button"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              {item.showError && (
                <div className="quantity-error">{item.errorMessage}</div>
              )}
            </div>
            <div className="cart-item-total">
              $
              {(item.product.price * item.quantity)?.toFixed(2) ?? '0.00'}
            </div>
            <button
              className="cart-item-remove"
              onClick={() => handleRemoveItem(item, index)}
              disabled={item.isLoading || isUpdating}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          <span>Total:</span>
          <span>${getCartTotalPrice().toFixed(2)}</span>
        </div>
        <div className="cart-actions">
          <Link to="/" className="continue-shopping">
            <FontAwesomeIcon icon={faArrowLeft} /> Continue Shopping
          </Link>
          <Link to="/checkout" className="checkout-button">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;
