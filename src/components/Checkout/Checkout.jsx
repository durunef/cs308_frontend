import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faLock, faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { checkout } from '../../api/orderService';
import axios from '../../api/axios';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotalPrice, clearCart } = useCart();
  const { isAuthenticated, user, token } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
  const [authStatus, setAuthStatus] = useState(null);
  
  // Debug auth token
  useEffect(() => {
    const testAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        console.log('Current auth state:', { 
          isAuthenticated, 
          userExists: !!user, 
          tokenExists: !!token,
          tokenInStorage: !!storedToken,
          tokenFirstChars: storedToken ? storedToken.substring(0, 15) + '...' : 'none'
        });
        
        // Test the token with a simple request
        const response = await axios.get('/api/user/profile');
        console.log('Auth test success:', response.data);
        setAuthStatus('Token is valid');
      } catch (err) {
        console.error('Auth test failed:', err);
        setAuthStatus(`Token error: ${err.message || 'Unknown error'}`);
      }
    };
    
    if (isAuthenticated) {
      testAuth();
    }
  }, [isAuthenticated, user, token]);
  
  const [formData, setFormData] = useState({
    // Shipping Details
    fullName: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    
    // Payment Details
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login?redirect=checkout');
      return;
    }
    
    // If cart is empty, redirect to cart page
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [isAuthenticated, navigate, cartItems]);
  
  // Fetch user profile to get address information
  useEffect(() => {
    const fetchUserProfileData = async () => {
      if (!token) {
        return;
      }
      
      try {
        const response = await fetch('http://localhost:3000/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'success' && data.data.user) {
            const userData = data.data.user;
            
            // Update form with user profile data
            setFormData(prev => ({
              ...prev,
              fullName: userData.name || prev.fullName,
              email: userData.email || prev.email,
              address: userData.address?.street || prev.address,
              city: userData.address?.city || prev.city,
              zipCode: userData.address?.postalCode || prev.zipCode,
              phone: userData.phone || prev.phone
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Don't set an error, just fail silently as this is just for pre-filling
      }
    };
    
    if (isAuthenticated) {
      fetchUserProfileData();
    }
  }, [isAuthenticated, token, user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNextStep = () => {
    // Validate shipping form
    if (step === 1) {
      const { fullName, email, address, city, zipCode, country, phone } = formData;
      if (!fullName || !email || !address || !city || !zipCode || !country || !phone) {
        setError('Please fill in all required fields');
        return;
      }
    }
    
    setStep(2);
    setError(null);
  };
  
  const handlePreviousStep = () => {
    setStep(1);
    setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Validate form before proceeding
      if (!validateForm()) {
        setIsProcessing(false);
        return;
      }

      // Check if cart is empty
      if (cartItems.length === 0) {
        setError('Your cart is empty');
        setIsProcessing(false);
        return;
      }

      // Check if user is authenticated
      if (!token) {
        setError('You must be logged in to checkout');
        setIsProcessing(false);
        return;
      }

      // Console log statements for debugging
      console.log('Starting checkout process');
      console.log('Payment details:', formData);
      
      // Process payment first
      const paymentResult = await processPayment({
        cardNumber: formData.cardNumber,
        cardName: formData.cardName,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv
      });
      
      if (!paymentResult.success) {
        setError('Payment processing failed: ' + paymentResult.message);
        setIsProcessing(false);
        return;
      }
      
      console.log('Payment successful, proceeding with checkout');

      // Combine payment and shipping details
      const checkoutData = {
        paymentDetails: {
          ...formData,
          cardNumber: formData.cardNumber.replace(/\s+/g, ''),
          transactionId: paymentResult.transactionId
        },
        shippingDetails: {
          fullName: formData.fullName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone
        },
        // Add cart items to help the backend process the order
        cart: cartItems
      };

      // Make cart items available globally for orderService to use
      window.cartItems = cartItems;

      console.log('Sending checkout data:', checkoutData);

      // Process checkout
      const response = await checkout(checkoutData);
      console.log('Checkout response received:', response);

      // Defensive programming to handle various response formats
      let orderId;
      if (response && response.data && response.data.orderId) {
        // Standard expected format
        orderId = response.data.orderId;
      } else if (response && response.orderId) {
        // Direct orderId in response
        orderId = response.orderId;
      } else if (response && response._id) {
        // Direct ID in response
        orderId = response._id;
      } else if (typeof response === 'string') {
        // Just in case the API returns the ID directly as a string
        orderId = response;
      } else {
        // Last resort fallback
        orderId = 'temp-' + Date.now();
        console.warn('Could not extract orderId from response, using temporary ID:', orderId);
      }

      // Save order data to localStorage as a fallback
      localStorage.setItem('lastOrderId', orderId);
      localStorage.setItem('lastCartItems', JSON.stringify(cartItems));
      localStorage.setItem('lastShippingDetails', JSON.stringify({
        fullName: formData.fullName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone
      }));

      // Clear cart only after data is saved
      await clearCart();

      // Navigate to order confirmation page
      console.log('Redirecting to order confirmation page:', orderId);
      setTimeout(() => {
        navigate(`/order-confirmation/${orderId}`);
        
        // If navigation fails, try a direct redirect
        setTimeout(() => {
          if (window.location.pathname !== `/order-confirmation/${orderId}`) {
            console.log('Forcing direct navigation to order confirmation');
            window.location.href = `/order-confirmation/${orderId}`;
          }
        }, 500);
      }, 100);
    } catch (err) {
      console.error('Error during checkout:', err);
      
      if (err.response) {
        setError(err.response.data?.message || 'An error occurred during checkout');
      } else {
        setError('Could not complete checkout. Please try again.');
      }
      
      setIsProcessing(false);
    }
  };
  
  const validateForm = () => {
    const { cardNumber, cardName, expiryDate, cvv } = formData;
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      setError('Please fill in all payment details');
      return false;
    }
    
    if (cardNumber.length < 16) {
      setError('Please enter a valid card number');
      return false;
    }
    
    if (cvv.length < 3) {
      setError('Please enter a valid CVV');
      return false;
    }
    
    // Validate expiry date (MM/YY)
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiryDate)) {
      setError('Please enter a valid expiry date in MM/YY format');
      return false;
    }
    
    // Check expiry date is not in the past
    const [expiryMonth, expiryYear] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(expiryYear), parseInt(expiryMonth) - 1, 1);
    const today = new Date();
    
    if (expiry < today) {
      setError('Your card has expired. Please use a valid card');
      return false;
    }
    
    return true;
  };
  
  // Simulate payment processing
  const processPayment = async (paymentDetails) => {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        // Simple validation - just check if card fields are not empty
        const { cardNumber, cardName, expiryDate, cvv } = paymentDetails;
        
        if (!cardNumber || !cardName || !expiryDate || !cvv) {
          resolve({
            success: false,
            message: 'Invalid payment details'
          });
          return;
        }
        
        // Simulate successful payment
        resolve({
          success: true,
          transactionId: 'mock-' + Date.now(),
          message: 'Payment successful'
        });
      }, 1500);
    });
  };
  
  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      {/* Debug section - only visible during development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="debug-panel" style={{ 
          background: '#f0f0f0', 
          padding: '10px', 
          marginBottom: '15px', 
          borderRadius: '5px',
          fontSize: '12px' 
        }}>
          <h3>Auth Debug Info:</h3>
          <p>Auth State: {isAuthenticated ? 'Authenticated ✓' : 'Not authenticated ✗'}</p>
          <p>User: {user ? `${user.name} (${user.email})` : 'No user data'}</p>
          <p>Token: {token ? `${token.substring(0, 10)}...` : 'No token'}</p>
          <p>Auth Test: {authStatus || 'Not tested yet'}</p>
        </div>
      )}
      
      <div className="checkout-progress">
        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-name">Shipping</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-name">Payment</span>
        </div>
      </div>
      
      {error && (
        <div className="checkout-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="checkout-form">
        {step === 1 ? (
          <div className="shipping-details">
            <h2>Shipping Details</h2>
            
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="zipCode">Zip Code</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            
            <button 
              type="button" 
              className="next-step-button"
              onClick={handleNextStep}
            >
              Continue to Payment
            </button>
          </div>
        ) : (
          <div className="payment-details">
            <h2>Payment Information</h2>
            <div className="secure-payment-note">
              <FontAwesomeIcon icon={faLock} />
              <span>All transactions are secure and encrypted</span>
            </div>
            
            <div className="form-group">
              <label htmlFor="cardName">Name on Card</label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                value={formData.cardName}
                onChange={handleChange}
                placeholder="Full name as displayed on card"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cardNumber">Card Number</label>
              <div className="card-input-container">
                <FontAwesomeIcon icon={faCreditCard} className="card-icon" />
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="16"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  maxLength="5"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  maxLength="4"
                  required
                />
              </div>
            </div>
            
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${getCartTotalPrice().toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>${(getCartTotalPrice() * 0.08).toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${(getCartTotalPrice() * 1.08).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="payment-actions">
              <button 
                type="button" 
                className="back-button"
                onClick={handlePreviousStep}
                disabled={isProcessing}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
              
              <button 
                type="submit" 
                className="place-order-button"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default Checkout; 