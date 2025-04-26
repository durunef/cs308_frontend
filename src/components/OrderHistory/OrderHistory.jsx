import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileInvoice, faSpinner, faExclamationTriangle, faArrowLeft, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getOrderHistory, downloadInvoice } from '../../api/orderService';
import './OrderHistory.css';

function OrderHistory() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=order-history');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch order history
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getOrderHistory();
        
        if (response.status === 'success') {
          setOrders(response.data);
        } else {
          throw new Error('Failed to fetch order history');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('We could not load your order history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);
  
  const handleDownloadInvoice = async (orderId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
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
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again later.');
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
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
  
  if (loading) {
    return (
      <div className="order-history-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
          <p>Loading your order history...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="order-history-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Could Not Load Orders</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h1>Order History</h1>
        <Link to="/" className="back-link">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Shop
        </Link>
      </div>
      
      {orders.length === 0 ? (
        <div className="no-orders">
          <FontAwesomeIcon icon={faShoppingBag} className="no-orders-icon" />
          <h2>No Orders Yet</h2>
          <p>You haven't placed any orders yet.</p>
          <Link to="/" className="shop-now-link">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          <div className="order-header-row">
            <div className="order-header-column">Order #</div>
            <div className="order-header-column">Date</div>
            <div className="order-header-column">Items</div>
            <div className="order-header-column">Total</div>
            <div className="order-header-column">Status</div>
            <div className="order-header-column">Actions</div>
          </div>
          
          {orders.map(order => (
            <div key={order._id} className="order-row">
              <div className="order-column">{order.orderNumber}</div>
              <div className="order-column">{formatDate(order.createdAt)}</div>
              <div className="order-column">{order.items.length} item(s)</div>
              <div className="order-column">${order.total.toFixed(2)}</div>
              <div className="order-column">
                <span className={`order-status ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-column order-actions">
                <Link 
                  to={`/order-confirmation/${order._id}`} 
                  className="view-details-button"
                  title="View Order Details"
                >
                  <FontAwesomeIcon icon={faEye} />
                </Link>
                <button
                  className="download-invoice-button"
                  onClick={(e) => handleDownloadInvoice(order._id, e)}
                  title="Download Invoice"
                >
                  <FontAwesomeIcon icon={faFileInvoice} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="order-status-legend">
        <h3>Order Status Legend</h3>
        <div className="legend-item">
          <span className="status-dot status-processing"></span>
          <span>Processing - Your order has been received and is being prepared</span>
        </div>
        <div className="legend-item">
          <span className="status-dot status-in-transit"></span>
          <span>In Transit - Your order is on its way to you</span>
        </div>
        <div className="legend-item">
          <span className="status-dot status-delivered"></span>
          <span>Delivered - Your order has been delivered</span>
        </div>
      </div>
    </div>
  );
}

export default OrderHistory; 