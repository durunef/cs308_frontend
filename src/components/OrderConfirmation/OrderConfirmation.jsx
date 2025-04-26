import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faFileInvoice, 
  faDownload, 
  faHome, 
  faSpinner, 
  faExclamationTriangle,
  faTruck,
  faBox,
  faShippingFast,
  faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';
import { getOrderDetails, downloadInvoice, getOrderStatus } from '../../api/orderService';
import './OrderConfirmation.css';

function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState('processing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  
  // Debug message when component loads
  console.log(`OrderConfirmation component mounted with orderId: ${orderId}`);
  
  useEffect(() => {
    // Show alert to verify component is rendering
    console.log(`OrderConfirmation - displaying order: ${orderId}`);
    
    // Log current URL for debugging
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await getOrderDetails(orderId);
        
        if (response.status === 'success' && response.data) {
          setOrder(response.data);
          setOrderStatus(response.data.status || 'processing');
        } else {
          // If we don't get valid order data, create a default order object
          // This is useful during development or when the API isn't fully implemented
          console.log('Creating default order data for ID:', orderId);
          setOrder({
            _id: orderId,
            orderNumber: `ORD-${orderId.substring(0, 8)}`,
            createdAt: new Date().toISOString(),
            status: 'processing',
            subtotal: 0,
            shippingCost: 0,
            tax: 0,
            total: 0,
            items: [],
            shippingDetails: {
              fullName: 'Customer',
              address: '123 Main St',
              city: 'Anytown',
              state: 'ST',
              zipCode: '12345',
              country: 'Country',
              phone: '555-123-4567'
            }
          });
          setOrderStatus('processing');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('We could not find your order. Please contact customer support.');
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);
  
  // Fetch order status periodically
  useEffect(() => {
    if (!orderId) return;
    
    const fetchStatus = async () => {
      try {
        const response = await getOrderStatus(orderId);
        if (response.status === 'success') {
          setOrderStatus(response.data.status);
        }
      } catch (err) {
        console.error('Error fetching order status:', err);
        // Don't set error here to avoid disrupting the UI on status check failures
      }
    };
    
    // Initial status fetch
    fetchStatus();
    
    // Set up polling every 30 seconds
    const statusInterval = setInterval(fetchStatus, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(statusInterval);
  }, [orderId]);
  
  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const pdfBlob = await downloadInvoice(orderId);
      
      // Create a URL for the blob
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again later.');
    } finally {
      setDownloadingInvoice(false);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="order-confirmation-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
          <p>Loading your order details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="order-confirmation-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Order Not Found</h2>
          <p>{error || 'We could not retrieve your order information.'}</p>
          <Link to="/" className="home-button">
            <FontAwesomeIcon icon={faHome} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="order-confirmation-container">
      <div className="confirmation-header">
        <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
        <h1>Order Confirmed!</h1>
        <p className="confirmation-subheader">Thank you for your purchase.</p>
        <p className="order-id">Order #: {order.orderNumber || orderId}</p>
        <p className="email-message">An email confirmation has been sent to your email address.</p>
      </div>
      
      {/* Order Timeline */}
      <div className="order-timeline">
        <h2>Order Status</h2>
        <div className="timeline-container">
          <div className={`timeline-step ${orderStatus === 'processing' || orderStatus === 'in-transit' || orderStatus === 'delivered' ? 'active' : ''}`}>
            <div className="timeline-icon">
              <FontAwesomeIcon icon={faBox} />
            </div>
            <div className="timeline-content">
              <h3>Order Received</h3>
              <p>We've received your order and we're preparing it.</p>
            </div>
          </div>
          
          <div className="timeline-connector"></div>
          
          <div className={`timeline-step ${orderStatus === 'in-transit' || orderStatus === 'delivered' ? 'active' : ''}`}>
            <div className="timeline-icon">
              <FontAwesomeIcon icon={faShippingFast} />
            </div>
            <div className="timeline-content">
              <h3>In Transit</h3>
              <p>Your order is on its way to you.</p>
            </div>
          </div>
          
          <div className="timeline-connector"></div>
          
          <div className={`timeline-step ${orderStatus === 'delivered' ? 'active' : ''}`}>
            <div className="timeline-icon">
              <FontAwesomeIcon icon={faClipboardCheck} />
            </div>
            <div className="timeline-content">
              <h3>Delivered</h3>
              <p>Your order has been delivered successfully.</p>
              {orderStatus === 'delivered' && (
                <Link to={`/rate-products/${orderId}`} className="rate-products-button">
                  Rate Products
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="order-info">
        <div className="order-meta">
          <div className="info-group">
            <h3>Order Number</h3>
            <p>{order.orderNumber || orderId}</p>
          </div>
          <div className="info-group">
            <h3>Order Date</h3>
            <p>{formatDate(order.createdAt)}</p>
          </div>
          <div className="info-group">
            <h3>Status</h3>
            <p className={`order-status ${orderStatus}`}>{orderStatus}</p>
          </div>
        </div>
        
        <div className="order-details-section">
          <h2>Order Details</h2>
          {order.items && order.items.length > 0 ? (
            <div className="order-items">
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-info">
                    <h3>{item.product?.name || 'Product'}</h3>
                    <p className="item-quantity">Quantity: {item.quantity || 1}</p>
                  </div>
                  <p className="item-price">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-items-message">Your order details will be available soon.</p>
          )}
          
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>${(order.shippingCost || 0).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <span>${(order.tax || 0).toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="shipping-payment-info">
          <div className="shipping-info">
            <h2>Shipping Information</h2>
            {order.shippingDetails ? (
              <>
                <p>{order.shippingDetails.fullName || 'Customer'}</p>
                <p>{order.shippingDetails.address || '123 Main St'}</p>
                <p>
                  {order.shippingDetails.city || 'City'}, 
                  {order.shippingDetails.state ? ` ${order.shippingDetails.state}` : ''} 
                  {order.shippingDetails.zipCode ? ` ${order.shippingDetails.zipCode}` : ''}
                </p>
                <p>{order.shippingDetails.country || 'Country'}</p>
                <p>{order.shippingDetails.phone || 'Phone number not provided'}</p>
              </>
            ) : (
              <p>Shipping details will be available soon.</p>
            )}
          </div>
          
          <div className="payment-info">
            <h2>Payment Information</h2>
            <p>Method: Credit Card</p>
            {order.paymentDetails ? (
              <>
                <p>Card: **** **** **** {order.paymentDetails.cardNumber ? 
                  order.paymentDetails.cardNumber.slice(-4) : '****'}</p>
                <p>Name: {order.paymentDetails.cardName || 'Card Holder'}</p>
              </>
            ) : (
              <p>Payment processed securely</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="confirmation-actions">
        <button 
          className="invoice-button"
          onClick={handleDownloadInvoice}
          disabled={downloadingInvoice}
        >
          {downloadingInvoice ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin /> Downloading...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faFileInvoice} /> Download Invoice
            </>
          )}
        </button>
        
        <Link to="/profile" className="view-orders-button">
          View All Orders
        </Link>
        
        <Link to="/" className="continue-shopping-button">
          <FontAwesomeIcon icon={faHome} /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmation; 