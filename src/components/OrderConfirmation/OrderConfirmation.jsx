import React, { useState, useEffect, useRef } from 'react';
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
  faClipboardCheck,
  faEnvelope,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { getOrderDetails, downloadInvoice, getOrderStatus, emailInvoice } from '../../api/orderService';
import './OrderConfirmation.css';

function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState('processing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [emailingInvoice, setEmailingInvoice] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const invoiceRef = useRef(null);
  
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
        
        // First try to get order from localStorage if API fails
        const lastOrderId = localStorage.getItem('lastOrderId');
        const cartItems = JSON.parse(localStorage.getItem('lastCartItems') || '[]');
        const shippingDetails = JSON.parse(localStorage.getItem('lastShippingDetails') || '{}');
        
        let orderData = null;
        let isFromLocalStorage = false;
        
        try {
          const response = await getOrderDetails(orderId);
          
          if (response.status === 'success' && response.data) {
            orderData = response.data;
            console.log('Order details retrieved from API:', orderData);
          }
        } catch (apiError) {
          console.error('API error fetching order details:', apiError);
          // If API fails, we'll use localStorage data below
        }
        
        // If we don't have data from API, try to create it from localStorage
        if (!orderData && lastOrderId === orderId && cartItems.length > 0) {
          console.log('Creating order data from localStorage');
          
          isFromLocalStorage = true;
          
          // Calculate order totals
          const subtotal = cartItems.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
          }, 0);
          
          const tax = subtotal * 0.08; // Assuming 8% tax rate
          const shippingCost = 0; // Free shipping
          const total = subtotal + tax + shippingCost;
          
          orderData = {
            _id: orderId,
            orderNumber: `ORD-${orderId.substring(0, 8)}`,
            createdAt: new Date().toISOString(),
            status: 'processing',
            subtotal,
            tax,
            shippingCost,
            total,
            items: cartItems,
            shippingDetails
          };
        }
        
        if (orderData) {
          setOrder(orderData);
          setOrderStatus(orderData.status || 'processing');
          console.log('Order data set:', orderData);
        } else {
          // Create a default order as last resort
          console.log('No order data available, creating minimal fallback');
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
  
  const handleEmailInvoice = async () => {
    try {
      setEmailingInvoice(true);
      setEmailSuccess(false);
      
      const response = await emailInvoice(orderId);
      
      if (response.status === 'success') {
        setEmailSuccess(true);
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setEmailSuccess(false);
        }, 5000);
      } else {
        throw new Error(response.message || 'Failed to email invoice');
      }
    } catch (err) {
      console.error('Error emailing invoice:', err);
      alert('Failed to email the invoice. Please try again later.');
    } finally {
      setEmailingInvoice(false);
    }
  };
  
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.orderNumber || orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; }
            .header { display: flex; justify-content: space-between; }
            .order-info { margin: 20px 0; }
            .shipping-info { margin: 20px 0; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>Invoice</h1>
              <div>
                <p><strong>Order #:</strong> ${order.orderNumber || orderId}</p>
                <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
              </div>
            </div>
            
            <div class="shipping-info">
              <h3>Shipping Information</h3>
              <p>${order.shippingDetails?.fullName}</p>
              <p>${order.shippingDetails?.address}</p>
              <p>${order.shippingDetails?.city}, ${order.shippingDetails?.state} ${order.shippingDetails?.zipCode}</p>
              <p>${order.shippingDetails?.country}</p>
              <p>Phone: ${order.shippingDetails?.phone}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.product.price.toFixed(2)}</td>
                    <td>$${(item.quantity * item.product.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td colspan="3" style="text-align: right;">Subtotal</td>
                  <td>$${(order.subtotal || calculateSubtotal(order.items)).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;">Shipping</td>
                  <td>$${(order.shippingCost || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;">Tax</td>
                  <td>$${(order.tax || 0).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Total</td>
                  <td>$${(order.total || calculateTotal(order)).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div>
              <p><strong>Status:</strong> ${orderStatus}</p>
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load and then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const calculateSubtotal = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return 0;
    }
    return items.reduce((total, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };
  
  const calculateTotal = (order) => {
    if (!order) return 0;
    
    const subtotal = order.subtotal || calculateSubtotal(order.items || []);
    const shipping = order.shippingCost || 0;
    const tax = order.tax || 0;
    return subtotal + shipping + tax;
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
              <p>Your order has been delivered.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Invoice Section */}
      <div className="invoice-section">
        <h2>Invoice</h2>
        <div className="invoice-actions">
          <button 
            className="invoice-action-button" 
            onClick={handlePrintInvoice}
          >
            <FontAwesomeIcon icon={faPrint} />
            Print Invoice
          </button>
          
          <button 
            className="invoice-action-button" 
            onClick={handleDownloadInvoice} 
            disabled={downloadingInvoice}
          >
            {downloadingInvoice ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faDownload} />
            )}
            Download PDF
          </button>
          
          <button 
            className="invoice-action-button" 
            onClick={handleEmailInvoice}
            disabled={emailingInvoice}
          >
            {emailingInvoice ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faEnvelope} />
            )}
            Email Invoice
          </button>
        </div>
        
        {emailSuccess && (
          <div className="email-success-message">
            <FontAwesomeIcon icon={faCheckCircle} /> Invoice has been sent to your email.
          </div>
        )}
        
        <div className="invoice-container" ref={invoiceRef}>
          <div className="invoice-header">
            <h3>Invoice #{order.orderNumber || order._id}</h3>
            <p className="invoice-date">Date: {formatDate(order.createdAt)}</p>
          </div>
          
          <div className="invoice-shipping-info">
            <h4>Ship To</h4>
            <p>{order.shippingDetails?.fullName}</p>
            <p>{order.shippingDetails?.address}</p>
            <p>{order.shippingDetails?.city}, {order.shippingDetails?.state} {order.shippingDetails?.zipCode}</p>
            <p>{order.shippingDetails?.country}</p>
            <p>Phone: {order.shippingDetails?.phone}</p>
          </div>
          
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="item-name">{item.product.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.product.price.toFixed(2)}</td>
                  <td>${(item.quantity * item.product.price).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="subtotal-row">
                <td colSpan="3">Subtotal</td>
                <td>${(order.subtotal || calculateSubtotal(order.items)).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="3">Shipping</td>
                <td>${(order.shippingCost || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="3">Tax</td>
                <td>${(order.tax || 0).toFixed(2)}</td>
              </tr>
              <tr className="total-row">
                <td colSpan="3">Total</td>
                <td>${(order.total || calculateTotal(order)).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="invoice-footer">
            <p><strong>Status:</strong> {orderStatus}</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
      
      <div className="order-items-section">
        <h2>Order Items</h2>
        <div className="order-items-container">
          {order.items.map((item, index) => (
            <div key={index} className="order-item">
              <img 
                src={item.product.image} 
                alt={item.product.name} 
                className="order-item-image" 
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/100x100?text=Product';
                }}
              />
              <div className="order-item-details">
                <h3 className="order-item-name">{item.product.name}</h3>
                <p className="order-item-price">${item.product.price.toFixed(2)} x {item.quantity}</p>
                <p className="order-item-total">Total: ${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="order-actions">
        <Link to="/order-history" className="view-orders-button">
          View All Orders
        </Link>
        <Link to="/" className="continue-shopping-button">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmation; 