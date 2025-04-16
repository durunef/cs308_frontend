import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTrash, 
  faShoppingCart, 
  faArrowLeft,
  faMinus,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import mockData from "../../data/mockData.json";
import "./Cart.css";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching cart data using mockData
    setTimeout(() => {
      // Select random items from mockData and add quantity
      const randomItems = [...mockData]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .map(item => ({
          ...item,
          quantity: Math.floor(Math.random() * 3) + 1
        }));
      
      setCartItems(randomItems);
      setIsLoading(false);
    }, 600);
  }, []);

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (isLoading) {
    return (
      <div className="cart-container">
        <div className="cart-loading">
          <div className="loading-spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1><FontAwesomeIcon icon={faShoppingCart} className="cart-icon" /> Shopping Cart</h1>
        <Link to="/" className="back-to-shopping">
          <FontAwesomeIcon icon={faArrowLeft} /> Continue Shopping
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <FontAwesomeIcon icon={faShoppingCart} />
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any products to your cart yet.</p>
          <Link to="/products" className="browse-products-btn">Browse Products</Link>
        </div>
      ) : (
        <>
          <div className="cart-count">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
          </div>
          
          <div className="cart-content">
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    <img src={item.image || "https://via.placeholder.com/150"} alt={item.name} />
                  </div>
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p className="cart-item-type">{item.type} - {item.subtype}</p>
                    <p className="cart-item-description">{item.description}</p>
                    <div className="cart-item-price">${item.price.toFixed(2)}</div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                    <div className="item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>${(calculateSubtotal() * 0.07).toFixed(2)}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>${(calculateSubtotal() * 1.07).toFixed(2)}</span>
              </div>
              
              <button className="checkout-btn">
                Proceed to Checkout
              </button>
              
              <div className="payment-methods">
                <p>We Accept:</p>
                <div className="payment-icons">
                  <span className="payment-icon">Visa</span>
                  <span className="payment-icon">MC</span>
                  <span className="payment-icon">Amex</span>
                  <span className="payment-icon">PayPal</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;