// src/components/Checkout/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { checkout as doCheckout } from '../../api/orderService';
import axios from '../../api/axios';
import './Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotalPrice, clearCart: clearCartFunction } = useCart();
  const { isAuthenticated, token } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName:'', email:'', street:'', city:'', postalCode:'',
    cardName:'', cardNumber:'', expiryDate:'', cvv:''
  });
  const [error, setError] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // NEW: Add order success state
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  // Load address from profile
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }
    
    axios.get('/api/user/profile')
      .then(res => {
        if (res.data && res.data.data && res.data.data.user) {
          const u = res.data.data.user;
          setForm(f => ({
            ...f,
            fullName: u.name || '',
            email: u.email || '',
            street: u.address?.street || '',
            city: u.address?.city || '',
            postalCode: u.address?.postalCode || ''
          }));
        }
      })
      .catch(err => {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile information.');
      });
  }, [isAuthenticated, navigate]);

  // Handle input change
  const handle = e => {
    const { name, value } = e.target;
    
    // Special handling for credit card number
    if (name === 'cardNumber') {
      // Remove any non-digits and spaces
      let formattedValue = value.replace(/[^\d]/g, '');
      
      // Limit to 16 digits
      formattedValue = formattedValue.substring(0, 16);
      
      // Add spaces after every 4 digits
      let formattedCardNumber = '';
      for (let i = 0; i < formattedValue.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formattedCardNumber += ' ';
        }
        formattedCardNumber += formattedValue.charAt(i);
      }
      
      setForm(f => ({ ...f, [name]: formattedCardNumber }));
      return;
    }
    
    // Special handling for credit card expiry date
    if (name === 'expiryDate') {
      let formattedValue = value.replace(/\D/g, ''); // Remove non-digits
      
      if (formattedValue.length > 0) {
        // Limit to 4 digits (MMYY)
        formattedValue = formattedValue.substring(0, 4);
        
        // Add slash after 2 digits (MM/YY)
        if (formattedValue.length > 2) {
          formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
          
          // Validate expiry date
          const [month, year] = formattedValue.split('/');
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits of year
          const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
          
          const expiryMonth = parseInt(month);
          const expiryYear = parseInt(year);
          
          if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
            setError('Card expiry date is invalid. Please enter a future date.');
            return;
          }
        }
      }
      
      setForm(f => ({ ...f, [name]: formattedValue }));
      return;
    }
    
    // Handle other inputs normally
    setForm(f => ({ ...f, [name]: value }));
  };

  // Step 1 → 2 transition
  const next = () => {
    const { fullName, email, street, city, postalCode } = form;
    if (!fullName||!email||!street||!city||!postalCode) {
      setError('Please fill in all shipping details');
      return;
    }
    setError(''); setStep(2);
  };

  // Payment process simulation
  const processPayment = () =>
    new Promise(resolve => setTimeout(() => resolve({ success: true, transactionId: 'tx-'+Date.now() }), 1000));

  // UPDATED: Complete order with better success handling
  const placeOrder = async e => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    
    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      setIsProcessing(false);
      return;
    }
    
    try {
      console.log('Processing payment...');
      const pay = await processPayment();
      if (!pay.success) {
        setError('Payment failed.');
        setIsProcessing(false);
        return;
      }
      
      console.log('Payment successful, proceeding with checkout...');
      const resp = await doCheckout({
        paymentDetails: {
          cardName: form.cardName,
          cardNumber: form.cardNumber,
          expiryDate: form.expiryDate,
          cvv: form.cvv,
          transactionId: pay.transactionId
        },
        shippingDetails: {
          fullName: form.fullName,
          email: form.email,
          street: form.street,
          city: form.city,
          postalCode: form.postalCode
        },
        cartItems: cartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          priceAtPurchase: item.product.price,
          costAtPurchase: item.product.price // Use price as cost if not available
        }))
      });
      
      console.log('Full checkout response:', resp);
      console.log('Response data structure:', JSON.stringify(resp.data, null, 2));

      try {
        // Clear cart first
        if (typeof clearCartFunction === 'function') {
          await clearCartFunction();
          console.log('Cart cleared successfully');
        } else {
          console.warn('clearCart function not available');
        }
      } catch (clearError) {
        console.error('Error clearing cart:', clearError);
      }

      // Extract order ID from the response - order is in resp.data.data.order
      const orderData = resp?.data?.data?.order;
      console.log('Order object:', orderData);
      const orderId = orderData?._id;
      console.log('Extracted order ID:', orderId);

      // CHANGED: Instead of trying to navigate, show success page directly
      setOrderSuccess(true);
      setOrderDetails({
        orderId: orderId || `ORD-${Date.now().toString().slice(-6)}`,
        totalAmount: getCartTotalPrice(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        email: form.email,
        itemCount: cartItems.length
      });
      
      if (resp.data?.data?.invoiceUrl) {
        setInvoiceUrl(resp.data.data.invoiceUrl);
      }
      
      setMessage('Your order has been successfully placed! A confirmation email has been sent to your inbox.');
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || err.message || 'Order processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render progress bar
  const renderProgressBar = () => {
    return (
      <div className="progress-bar-container">
        <div className="progress-steps">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-text">Shipping Details</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-text">Payment Details</div>
          </div>
        </div>
      </div>
    );
  };

  // CHANGED: Show success page when order is successful
  if (orderSuccess) {
    return (
      <div className="checkout-container">
        <div className="order-success-card">
          <div className="success-icon">✓</div>
          <h1>Thank You!</h1>
          <p className="success-message">{message}</p>
          
          <div className="order-details-card">
            <h2>Order Summary</h2>
            <div className="order-details-content">
              <p>Order ID: <strong>{orderDetails?.orderId}</strong></p>
              <p>Total Amount: <strong>${orderDetails?.totalAmount?.toFixed(2)}</strong></p>
              <p>Email: <strong>{orderDetails?.email}</strong></p>
              <p>Items: <strong>{orderDetails?.itemCount}</strong></p>
              <p>Estimated Delivery: <strong>{orderDetails?.estimatedDelivery}</strong></p>
            </div>
          </div>
          
          {invoiceUrl && (
            <div className="invoice-container">
              <h2>Your Invoice</h2>
              <iframe
                title="Invoice"
                src={invoiceUrl}
                width="100%"
                height="500px"
                className="invoice-frame"
              />
            </div>
          )}
          
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // If invoice URL exists, show confirmation page (KEPT for backward compatibility)
  if (invoiceUrl && !orderSuccess) {
    return (
      <div className="checkout-container">
        <div className="order-success-card">
          <div className="success-icon">✓</div>
          <h1>Thank You!</h1>
          <p className="success-message">{message}</p>
          
          <div className="order-details-card">
            <h2>Order Summary</h2>
            <div className="order-details-content">
              <p>Total Amount: <strong>${getCartTotalPrice().toFixed(2)}</strong></p>
              <p>Order ID: <strong>ORD-{Date.now().toString().slice(-6)}</strong></p>
              <p>Estimated Delivery: <strong>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong></p>
            </div>
          </div>
          
          <div className="invoice-container">
            <h2>Your Invoice</h2>
            <iframe
              title="Invoice"
              src={invoiceUrl}
              width="100%"
              height="500px"
              className="invoice-frame"
            />
          </div>
          
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Normal checkout form
  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      {renderProgressBar()}
      
      {error && <div className="checkout-error">{error}</div>}

      <form onSubmit={placeOrder}>
        {step === 1 ? (
          <div className="checkout-card">
            <h2>Shipping Details</h2>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input 
                id="fullName"
                name="fullName" 
                placeholder="Full Name" 
                value={form.fullName} 
                onChange={handle}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                name="email" 
                type="email"
                placeholder="Email" 
                value={form.email} 
                onChange={handle}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="street">Address</label>
              <input 
                id="street"
                name="street" 
                placeholder="Street, Number" 
                value={form.street} 
                onChange={handle}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input 
                  id="city"
                  name="city" 
                  placeholder="City" 
                  value={form.city} 
                  onChange={handle}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="postalCode">Postal Code</label>
                <input 
                  id="postalCode"
                  name="postalCode" 
                  placeholder="Postal Code" 
                  value={form.postalCode} 
                  onChange={handle}
                />
              </div>
            </div>
            
            <button 
              type="button" 
              className="next-button" 
              onClick={next}
            >
              Next
            </button>
          </div>
        ) : (
          <div className="checkout-card">
            <h2>Payment Details</h2>
            
            <div className="form-group">
              <label htmlFor="cardName">Name on Card</label>
              <input 
                id="cardName"
                name="cardName" 
                placeholder="Name on Card" 
                value={form.cardName} 
                onChange={handle}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cardNumber">Card Number</label>
              <input 
                id="cardNumber"
                name="cardNumber" 
                placeholder="0000 0000 0000 0000" 
                value={form.cardNumber} 
                onChange={handle}
                maxLength="19"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiryDate">Expiration Date</label>
                <input 
                  id="expiryDate"
                  name="expiryDate" 
                  placeholder="MM/YY" 
                  value={form.expiryDate}
                  onChange={handle}
                  maxLength="5"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input 
                  id="cvv"
                  name="cvv" 
                  placeholder="CVV" 
                  value={form.cvv} 
                  onChange={handle}
                  maxLength="4"
                  type="password"
                />
              </div>
            </div>
            
            <div className="order-summary-card">
              <h3>Order Summary</h3>
              <p>Item Count: <strong>{cartItems.length}</strong></p>
              <p className="total-price">Total: <strong>${getCartTotalPrice().toFixed(2)}</strong></p>
            </div>
            
            <div className="checkout-buttons">
              <button 
                type="button" 
                className="back-button" 
                onClick={() => setStep(1)}
              >
                Back
              </button>
              
              <button 
                type="submit" 
                className="order-button"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Complete Order'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
