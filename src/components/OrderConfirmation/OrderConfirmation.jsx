import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  faPrint,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { getOrderDetails, downloadInvoice, getOrderStatus, emailInvoice } from '../../api/orderService';
import './OrderConfirmation.css';
import axios from 'axios';
import ProductReview from '../ProductReview/ProductReview';
import RefundRequest from '../RefundRequest/RefundRequest';
import { API_URL } from '../../config';

function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const { navigate } = useNavigate();
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [emailingInvoice, setEmailingInvoice] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const invoiceRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [refundRequests, setRefundRequests] = useState(() => {
    const savedRefunds = localStorage.getItem('refundRequests');
    return savedRefunds ? JSON.parse(savedRefunds) : {};
  });
  
  // Debug message when component loads
  console.log(`OrderConfirmation component mounted with orderId: ${orderId}`);
  
  // Convert status to CSS class - same as in OrderHistory
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'processing':
        return 'status-processing';
      case 'in-transit':
        return 'status-in-transit';
      case 'delivered':
        return 'status-delivered';
      default:
        return '';
    }
  };
  
  useEffect(() => {
    // Show alert to verify component is rendering
    console.log(`OrderConfirmation - displaying order: ${orderId}`);
    
    // Log current URL for debugging
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching order details for:', orderId);
        
        let orderData = null;
        
        // First, check sessionStorage for saved order data from OrderHistory
        try {
          const savedOrderJSON = sessionStorage.getItem('currentOrderDetail');
          const savedOrderId = sessionStorage.getItem('currentOrderId');
          
          if (savedOrderJSON && savedOrderId === orderId) {
            const savedOrder = JSON.parse(savedOrderJSON);
            console.log('Found saved order data in sessionStorage:', savedOrder);
            orderData = savedOrder;
          } else if (savedOrderId !== orderId) {
            console.log('Saved order ID does not match current order ID');
          }
        } catch (storageError) {
          console.error('Error retrieving order from sessionStorage:', storageError);
        }
        
        // If we don't have data from sessionStorage, try the API
        if (!orderData) {
          try {
            console.log('Making API call to getOrderDetails for order:', orderId);
            const response = await getOrderDetails(orderId);
            
            console.log('API response for order details:', response);
            
            if (response.status === 'success' && response.data) {
              orderData = response.data;
              console.log('Order details retrieved from API:', orderData);
            } else {
              console.warn('API returned success but with invalid or empty data:', response);
            }
          } catch (apiError) {
            console.error('API error fetching order details:', apiError);
          }
          
          if (!orderData) {
            console.log('Attempting to fetch order status directly...');
            try {
              const statusResponse = await getOrderStatus(orderId);
              console.log('Status API response:', statusResponse);
              
              if (statusResponse.status === 'success' && statusResponse.data) {
                console.log('Retrieved status:', statusResponse.data.status);
              }
            } catch (statusError) {
              console.error('Error fetching order status:', statusError);
            }
          }
        }
        
        // If we have data from API or sessionStorage, ensure it's properly structured
        if (orderData) {
          // Ensure all required fields are present
          const enhancedOrder = {
            ...orderData,
            // Add orderNumber if missing
            orderNumber: orderData.orderNumber || `ORD-${orderData._id.substring(0, 8)}`,
            
            // Ensure shipping address is properly structured
            shippingAddress: orderData.shippingAddress || orderData.shippingDetails?.address || {
              street: orderData.shippingDetails?.street || '',
              city: orderData.shippingDetails?.city || '',
              postalCode: orderData.shippingDetails?.postalCode || ''
            },
            
            // Ensure the order always has a status
            status: orderData.status || 'processing',
            
            // Ensure user information is properly structured
            user: {
              ...(orderData.user || {}),
              // If user is a string ID, create a proper user object
              name: typeof orderData.user === 'object' ? 
                orderData.user.name || sessionStorage.getItem('userName') || 'Customer' :
                sessionStorage.getItem('userName') || 'Customer',
              email: typeof orderData.user === 'object' ? 
                orderData.user.email || sessionStorage.getItem('userEmail') || '' : 
                sessionStorage.getItem('userEmail') || '',
              phone: typeof orderData.user === 'object' ? 
                orderData.user.phone || '' : ''
            }
          };
          
          // Calculate financials only if they're missing
          if (!enhancedOrder.subtotal || enhancedOrder.subtotal === 0) {
            enhancedOrder.subtotal = calculateSubtotal(enhancedOrder.items);
          }
          
          if (!enhancedOrder.tax) {
            enhancedOrder.tax = enhancedOrder.subtotal * 0.08;
          }
          
          if (!enhancedOrder.shippingCost) {
            enhancedOrder.shippingCost = 5.99;
          }
          
          // Always recalculate total to ensure it's the sum of components
          enhancedOrder.total = enhancedOrder.subtotal + enhancedOrder.tax + enhancedOrder.shippingCost;
          
          console.log('Order components:', { 
            subtotal: enhancedOrder.subtotal,
            tax: enhancedOrder.tax,
            shipping: enhancedOrder.shippingCost,
            total: enhancedOrder.total
          });
          
          console.log('Setting enhanced order data with status:', enhancedOrder.status);
          setOrder(enhancedOrder);
          setOrderStatus(enhancedOrder.status);
        } else {
          // Attempt to create a valid fallback from available data
          console.log('No order data available, creating fallback from orderId:', orderId);
          
          // Try to get status one last time
          let fallbackStatus = 'processing';
          try {
            const statusResponse = await getOrderStatus(orderId);
            if (statusResponse.status === 'success' && statusResponse.data && statusResponse.data.status) {
              fallbackStatus = statusResponse.data.status;
              console.log('Using status from direct API call:', fallbackStatus);
            }
          } catch (statusError) {
            console.log('Could not get status, using default:', fallbackStatus);
          }
          
          const fallbackOrder = {
            _id: orderId,
            orderNumber: `ORD-${orderId.substring(0, 8)}`,
            createdAt: new Date().toISOString(),
            status: fallbackStatus,
            subtotal: 0,
            shippingCost: 5.99,
            tax: 0,
            total: 5.99, // subtotal(0) + tax(0) + shipping(5.99)
            items: [],
            shippingAddress: {
              street: 'Please contact support for address details',
              city: '',
              postalCode: ''
            },
            user: {
              name: sessionStorage.getItem('userName') || 'Customer',
              email: sessionStorage.getItem('userEmail') || '',
              phone: sessionStorage.getItem('userPhone') || ''
            }
          };
          
          // Store this fallback in sessionStorage for consistency
          try {
            sessionStorage.setItem('currentOrderDetail', JSON.stringify(fallbackOrder));
            sessionStorage.setItem('currentOrderId', orderId);
            console.log('Saved fallback order to sessionStorage');
          } catch (err) {
            console.error('Error saving fallback to sessionStorage:', err);
          }
          
          setOrder(fallbackOrder);
          setOrderStatus(fallbackStatus);
        }
      } catch (err) {
        console.error('Error in fetchOrderDetails:', err);
        setError('We could not find your order. Please contact customer support.');
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);
  
  // Fetch order status only if it wasn't provided in the order details
  useEffect(() => {
    if (!orderId || !order) return;
    
    const fetchStatus = async () => {
      try {
        console.log('Attempting to fetch status for order:', orderId);
        
        // Skip the status request if we already have a valid status
        if (order.status && ['processing', 'in-transit', 'delivered'].includes(order.status.toLowerCase())) {
          console.log('Using existing status from order:', order.status);
          return;
        }
        
        const response = await getOrderStatus(orderId);
        if (response.status === 'success' && response.data) {
          console.log('Got updated status from API:', response.data.status);
          // Only update status if it's different from what we already have
          if (response.data.status !== orderStatus) {
            setOrderStatus(response.data.status);
            // Also update order object to have consistent status
            setOrder(prevOrder => ({
              ...prevOrder,
              status: response.data.status
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching order status:', err);
        if (err.response && err.response.status === 404) {
          console.log('Status endpoint returned 404, using order status from main data');
          // Keep using the current status, it's fine
        }
        // Don't set error here to avoid disrupting the UI on status check failures
      }
    };
    
    // Initial status fetch - only if needed
    fetchStatus();
    
    // Set up polling with less frequent intervals (every 60 seconds instead of 30)
    // and only if we don't have a "delivered" status yet
    let statusInterval;
    if (orderStatus !== 'delivered') {
      statusInterval = setInterval(fetchStatus, 60000); // Check every 60 seconds
    }
    
    // Clean up interval on component unmount
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [orderId, order, orderStatus]);
  
  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      
      // Try direct file access first in development mode
      const isDev = window.location.hostname === 'localhost';
      if (isDev) {
        try {
          const directUrl = `http://localhost:3000/invoices/invoice-${orderId}.pdf`;
          console.log('Attempting to download PDF directly from:', directUrl);
          
          // Check if the file exists
          await axios.head(directUrl);
          
          // If it exists, trigger direct download
          console.log('Direct PDF download');
          const link = document.createElement('a');
          link.href = directUrl;
          link.download = `invoice-${orderId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        } catch (directErr) {
          console.log('Direct PDF URL not accessible for download, falling back to API:', directErr.message);
        }
      }
      
      // If direct access failed or not in dev mode, fall back to API
      try {
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
        // Handle 404 errors specifically
        if (err.response && err.response.status === 404) {
          console.log('Invoice PDF not found on the server (404).');
          alert('The invoice PDF is not available yet. You can use the Print Invoice option instead.');
        } else {
          console.error('Error downloading invoice:', err);
          alert('Failed to download invoice. Please try again later or use the Print Invoice option.');
        }
      }
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
    
    // Create a safe item price getter function to avoid errors
    const getItemPrice = (item) => {
      return item.priceAtPurchase || item.product.price || 0;
    };
    
    // Get correct order totals
    const subtotal = order.subtotal || 0;
    const tax = order.tax || 0;
    const shipping = order.shippingCost || 0;
    const total = order.total || (subtotal + tax + shipping);
    
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
            .status-processing { color: #f57c00; font-weight: bold; }
            .status-in-transit { color: #1565c0; font-weight: bold; }
            .status-delivered { color: #2e7d32; font-weight: bold; }
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
              <p>${order.user?.name || sessionStorage.getItem('userName') || 'Customer'}</p>
              <p>${order.shippingAddress?.street || 'No address available'}</p>
              <p>${order.shippingAddress?.city || ''} ${order.shippingAddress?.postalCode || ''}</p>
              <p>Phone: ${order.user?.phone || sessionStorage.getItem('userPhone') || 'N/A'}</p>
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
                ${order.items && order.items.map(item => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${(item.priceAtPurchase || item.product.price).toFixed(2)}</td>
                    <td>$${((item.priceAtPurchase || item.product.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td colspan="3" style="text-align: right;">Subtotal</td>
                  <td>$${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;">Shipping</td>
                  <td>$${shipping.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: right;">Tax</td>
                  <td>$${tax.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Total</td>
                  <td>$${total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div>
              <p><strong>Status:</strong> <span class="${getStatusClass(orderStatus)}">${orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}</span></p>
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
  
  // Add a function to load the PDF invoice
  const loadPdfInvoice = async () => {
    if (!orderId) return;
    
    try {
      setPdfLoading(true);
      setPdfError(null);
      console.log('Loading PDF invoice for order:', orderId);
      
      // First try to use the URL directly if we're in development
      const isDev = window.location.hostname === 'localhost';
      if (isDev) {
        // First attempt: Try the direct URL
        try {
          const directUrl = `http://localhost:3000/invoices/invoice-${orderId}.pdf`;
          console.log('Attempting to load PDF directly from:', directUrl);
          
          // Test if the file exists with a HEAD request
          await axios.head(directUrl);
          
          // If it exists, use this URL directly
          console.log('Direct PDF URL is accessible');
          setPdfUrl(directUrl);
          return;
        } catch (directErr) {
          console.log('Direct PDF URL not accessible, falling back to API:', directErr.message);
        }
      }
      
      // If direct URL failed or we're not in dev mode, try the API
      try {
        const pdfBlob = await downloadInvoice(orderId);
        const url = URL.createObjectURL(pdfBlob);
        
        console.log('PDF blob created with URL:', url);
        setPdfUrl(url);
      } catch (err) {
        // Handle 404 errors specifically
        if (err.response && err.response.status === 404) {
          console.log('Invoice PDF not found on the server (404). Showing HTML version instead.');
          setPdfError('The invoice PDF is not available yet. Using the HTML version below.');
        } else {
          console.error('Error loading PDF invoice:', err);
          setPdfError('Could not load the invoice PDF. Using the HTML version below.');
        }
      }
    } finally {
      setPdfLoading(false);
    }
  };
  
  // Load the PDF when component mounts and we have order data
  useEffect(() => {
    if (order && !pdfUrl && !pdfLoading) {
      loadPdfInvoice();
    }
    
    // Clean up the PDF URL when component unmounts
    return () => {
      if (pdfUrl) {
        console.log('Revoking PDF blob URL');
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [order, pdfUrl, pdfLoading, orderId]);
  
  // Add a cleanup effect to remove session data when component unmounts
  useEffect(() => {
    return () => {
      // No need to clean up sessionStorage when unmounting
      // It will persist until navigation but be cleaned when browser closes
      console.log('Component unmounting');
    };
  }, []);
  
  // Save refund requests to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('refundRequests', JSON.stringify(refundRequests));
  }, [refundRequests]);

  const handleRefundRequested = (refund) => {
    setRefundRequests(prev => {
      const updated = {
        ...prev,
        [refund.order]: refund
      };
      return updated;
    });
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
      
      {/* Order Summary */}
      <div className="order-summary-section">
        <div className="order-summary-columns">
          <div className="order-summary-column">
            <h3><FontAwesomeIcon icon={faMapMarkerAlt} /> Shipping Address</h3>
            <div className="shipping-address-display">
              <p className="customer-name">{order.user?.name || 'Customer'}</p>
              <p>{order.shippingAddress?.street || 'No address available'}</p>
              <p>
                {order.shippingAddress?.city || ''} 
                {order.shippingAddress?.city && order.shippingAddress?.postalCode ? ', ' : ''}
                {order.shippingAddress?.postalCode || ''}
              </p>
              {order.user?.phone && <p>Phone: {order.user.phone}</p>}
            </div>
          </div>
          
          <div className="order-summary-column">
            <h3><FontAwesomeIcon icon={faTruck} /> Order Status</h3>
            <div className="status-display">
              <p className={`order-current-status ${getStatusClass(orderStatus)}`}>
                {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
              </p>
              <p className="status-date">
                Order Date: {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="order-summary-column">
            <h3><FontAwesomeIcon icon={faFileInvoice} /> Order Total</h3>
            <div className="total-summary">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Shipping:</span>
                <span>${(order.shippingCost || 0).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tax:</span>
                <span>${(order.tax || 0).toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>${(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
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
      
      {/* Order Items Section - Moved here */}
      <div className="order-items-section">
        <h2>Order Items</h2>
        <div className="order-items-container">
          {order.items && order.items.map((item, index) => (
            <div key={index} className="order-item-with-review">
              <div className="order-item">
                <img 
                  src={item.product.image ? `${API_URL}${item.product.image}` : 'https://via.placeholder.com/100x100?text=Product'} 
                  alt={item.product.name} 
                  className="order-item-image" 
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100x100?text=Product';
                  }}
                />
                <div className="order-item-details">
                  <h3 className="order-item-name">{item.product.name}</h3>
                  <p className="order-item-price">${(item.priceAtPurchase || item.product.price).toFixed(2)} x {item.quantity}</p>
                  <p className="order-item-total">Total: ${((item.priceAtPurchase || item.product.price) * item.quantity).toFixed(2)}</p>
                  
                  {/* Add ProductReview component */}
                  <ProductReview 
                    product={item.product} 
                    orderStatus={orderStatus}
                    onReviewSubmitted={(productId, rating, comment) => {
                      console.log(`Review submitted for ${productId}: ${rating} stars, "${comment}"`);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add Refund Request Section */}
      {orderStatus === 'delivered' && !refundRequests[order._id] && (
        <div className="refund-request-section">
          <RefundRequest 
            order={order} 
            onRefundRequested={handleRefundRequested}
          />
        </div>
      )}

      {refundRequests[order._id] && (
        <div className="refund-status">
          <h4>Refund Status</h4>
          <div className={`refund-status-badge status-${refundRequests[order._id].status}`}>
            {refundRequests[order._id].status}
          </div>
          <div className="refund-details">
            <p>Total Refund Amount: ${refundRequests[order._id].totalRefundAmount.toFixed(2)}</p>
            <p>Requested on: {new Date(refundRequests[order._id].createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}
      
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
          
          {!pdfUrl && !pdfLoading && !pdfError && (
            <button 
              className="invoice-action-button" 
              onClick={loadPdfInvoice}
            >
              <FontAwesomeIcon icon={faFileInvoice} />
              View PDF
            </button>
          )}
        </div>
        
        {pdfLoading && (
          <div className="pdf-loading">
            <FontAwesomeIcon icon={faSpinner} spin /> Loading invoice PDF...
          </div>
        )}
        
        {pdfError && (
          <div className="pdf-error">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {pdfError}
          </div>
        )}
        
        {pdfUrl && (
          <div className="pdf-viewer-container">
            <iframe 
              src={pdfUrl} 
              className="pdf-viewer" 
              width="100%" 
              height="600px" 
              title="Invoice PDF"
              onError={(e) => {
                console.error('Error loading PDF in iframe:', e);
                setPdfError('The PDF viewer encountered an error. Using the HTML version below.');
                setPdfUrl(null);
              }}
            ></iframe>
          </div>
        )}
        
        {emailSuccess && (
          <div className="email-success-message">
            <FontAwesomeIcon icon={faCheckCircle} /> Invoice has been sent to your email.
          </div>
        )}
        
        {/* Always show the HTML invoice if PDF is not available or loading failed */}
        {(!pdfUrl || pdfError) && (
          <div className="invoice-container" ref={invoiceRef}>
            <div className="invoice-header">
              <h3>Invoice #{order.orderNumber || order._id}</h3>
              <p className="invoice-date">Date: {formatDate(order.createdAt)}</p>
            </div>
            
            <div className="invoice-shipping-info">
              <h4>Ship To</h4>
              <p>{order.user?.name || sessionStorage.getItem('userName') || 'Customer'}</p>
              <p>{order.shippingAddress?.street || 'No address available'}</p>
              <p>
                {order.shippingAddress?.city || ''} 
                {order.shippingAddress?.city && order.shippingAddress?.postalCode ? ', ' : ''}
                {order.shippingAddress?.postalCode || ''}
              </p>
              <p>Phone: {order.user?.phone || sessionStorage.getItem('userPhone') || 'N/A'}</p>
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
                {order.items && order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="item-name">{item.product.name}</td>
                    <td>{item.quantity}</td>
                    <td>${(item.priceAtPurchase || item.product.price).toFixed(2)}</td>
                    <td>${((item.priceAtPurchase || item.product.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="subtotal-row">
                  <td colSpan="3">Subtotal</td>
                  <td>${(order.subtotal || 0).toFixed(2)}</td>
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
                  <td>${(order.total || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div className="invoice-footer">
              <p>
                <strong>Status:</strong> 
                <span className={getStatusClass(orderStatus)}>
                  {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                </span>
              </p>
              <p>Thank you for your business!</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="order-actions">
        <Link to="/profile?tab=orders" className="view-orders-button">
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