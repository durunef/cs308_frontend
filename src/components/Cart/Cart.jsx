import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faMinus, faArrowLeft, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
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
      // Create a local copy of cart items to avoid modifying the context state directly
      // Also filter out any invalid items that might have corrupted product data
      const items = cartItems
        .filter(item => item && item.product && item.product._id && item.product.name)
        .map(item => ({
          ...item,
          isLoading: false // add loading state for each item
        }));
      
      setLocalItems(items);
    }
  }, [cartItems]);
  
  const handleQuantityChange = async (item, newQuantity, index) => {
    if (newQuantity < 1) return;
    
    // Update local state first for better UX
    const updatedItems = [...localItems];
    updatedItems[index].isLoading = true;
    setLocalItems(updatedItems);
    
    setIsUpdating(true);
    
    try {
      await updateItemQuantity(item.product._id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleRemoveItem = async (item, index) => {
    // Apply loading state to the specific item being removed
    const updatedItems = [...localItems];
    updatedItems[index].isLoading = true;
    setLocalItems(updatedItems);
    
    // Set overall updating state to disable all interactions
    setIsUpdating(true);
    
    try {
      console.log('Removing product:', item.product._id);
      const result = await removeItem(item.product._id);
      
      if (!result.success) {
        // If removal failed, revert the loading state on the item
        const revertedItems = [...localItems];
        revertedItems[index].isLoading = false;
        setLocalItems(revertedItems);
      }
      // If successful, the CartContext will update cartItems and trigger the useEffect
    } catch (error) {
      console.error('Failed to remove item', error);
      // Revert loading state on error
      const revertedItems = [...localItems];
      revertedItems[index].isLoading = false;
      setLocalItems(revertedItems);
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
          <button className="retry-button" onClick={fetchCart}>
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
        {localItems.map((item, index) => {
          // Skip rendering if item or product is missing crucial data
          if (!item || !item.product || !item.product._id) {
            return null;
          }
          
          return (
            <div key={item._id || index} className={`cart-item ${item.isLoading ? 'loading' : ''}`}>
              <div className="cart-item-image">
                {item.product.image && (
                  <img src={item.product.image} alt={item.product.name || 'Product'} />
                )}
              </div>
              <div className="cart-item-details">
                <h3>{item.product.name || 'Unknown Product'}</h3>
                <p className="cart-item-price">
                  ${item.product.price ? item.product.price.toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="cart-item-quantity">
                <button 
                  onClick={() => handleQuantityChange(item, item.quantity - 1, index)}
                  disabled={item.isLoading || isUpdating || item.quantity <= 1}
                  className="quantity-button"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(item, item.quantity + 1, index)}
                  disabled={item.isLoading || isUpdating}
                  className="quantity-button"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
              <div className="cart-item-total">
                ${item.product.price ? (item.product.price * item.quantity).toFixed(2) : '0.00'}
              </div>
              <button 
                className="cart-item-remove"
                onClick={() => handleRemoveItem(item, index)}
                disabled={item.isLoading || isUpdating}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          );
        })}
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
          <Link to="/checkout" className="checkout-button" style={{ textDecoration: 'none' }}>
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;