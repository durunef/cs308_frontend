import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faFileInvoice, 
  faSpinner, 
  faExclamationTriangle, 
  faArrowLeft, 
  faShoppingBag, 
  faSync,
  faMapMarkerAlt,
  faPhone,
  faInfoCircle,
  faBoxOpen,
  faTimes,
  faUndo
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getOrderHistory, downloadInvoice, getOrderStatus, cancelOrder, getRefundStatus } from '../../api/orderService';
import RefundRequest from '../RefundRequest/RefundRequest';
import './OrderHistory.css';

function OrderHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refundRequests, setRefundRequests] = useState({});
  
  // Check if component is being rendered inside profile page
  const isInsideProfile = location.pathname.includes('/profile');
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isInsideProfile) {
      navigate('/login?redirect=order-history');
    }
  }, [isAuthenticated, navigate, isInsideProfile]);
  
  // Fetch refund status for an order
  const fetchRefundStatus = async (refundId) => {
    try {
      console.log('Fetching refund status for order with refundId:', refundId);
      const refundData = await getRefundStatus(refundId);
      console.log('Received refund data:', refundData);
      
      if (refundData && refundData.refund) {
        setRefundRequests(prev => ({
          ...prev,
          [refundData.refund.order]: refundData.refund
        }));
      }
    } catch (error) {
      console.error('Error fetching refund status:', error);
      // Don't throw the error, just log it and continue
    }
  };

  // Fetch orders and their refund statuses
  const fetchOrdersAndRefunds = async () => {
    try {
      setLoading(true);
      const ordersResponse = await getOrderHistory();
      
      // Ensure ordersResponse is an array
      if (!Array.isArray(ordersResponse)) {
        console.error('Expected array of orders but got:', ordersResponse);
        setError('Failed to load orders. Invalid response format.');
        setOrders([]);
        return;
      }

      setOrders(ordersResponse);

      // Fetch refund status for each order that has a refund request
      console.log('Checking orders for refund requests:', ordersResponse);
      const refundPromises = ordersResponse
        .filter(order => order && order.refundId) // Add null check
        .map(async (order) => {
          console.log('Found order with refundId:', order.refundId);
          await fetchRefundStatus(order.refundId);
        });

      await Promise.all(refundPromises);
      
      // Log the final state of refund requests
      console.log('Final refund requests state:', refundRequests);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again later.');
      setOrders([]); // Set empty array to prevent filter errors
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrdersAndRefunds();
    }
  }, [isAuthenticated]);

  // Refresh refund status periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const refreshRefunds = async () => {
      const ordersWithRefunds = orders.filter(order => order.refundId);
      console.log('Orders with refund requests:', ordersWithRefunds);
      
      for (const order of ordersWithRefunds) {
        await fetchRefundStatus(order.refundId);
      }
    };

    // Initial check
    refreshRefunds();

    // Set up interval for periodic checks
    const intervalId = setInterval(refreshRefunds, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated, orders]);
  
  // Fetch order history
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Starting to fetch orders...');
        
        const response = await getOrderHistory();
        console.log('Received orders:', response);
        
        if (!Array.isArray(response)) {
          throw new Error('Invalid response format: expected an array of orders');
        }
        
        // Ensure we have proper data structure for each order
        const enhancedOrders = response.map(order => {
          if (!order) return null;
          
          try {
            // Add orderNumber if missing
            if (!order.orderNumber) {
              order.orderNumber = `ORD-${order._id.substring(0, 8)}`;
            }
            
            // Calculate subtotal if missing
            if (!order.subtotal && order.items && order.items.length > 0) {
              order.subtotal = order.items.reduce((sum, item) => {
                return sum + (item.priceAtPurchase || item.product?.price || 0) * (item.quantity || 0);
              }, 0);
            }
            
            // Add tax if missing
            if (!order.tax && order.subtotal) {
              order.tax = order.subtotal * 0.08; // Assuming 8% tax
            }
            
            // Add shipping cost if missing
            if (!order.shippingCost) {
              order.shippingCost = 5.99;
            }
            
            // Calculate total if missing
            if (!order.total) {
              const subtotal = order.subtotal || 0;
              const tax = order.tax || 0;
              const shipping = order.shippingCost || 0;
              order.total = subtotal + tax + shipping;
            }
            
            return order;
          } catch (err) {
            console.error('Error processing order:', err, order);
            return null;
          }
        }).filter(Boolean); // Remove any null orders
        
        // Sort orders by date in descending order (most recent first)
        const sortedOrders = enhancedOrders.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setOrders(sortedOrders);
        
        // After loading orders, fetch their status
        if (sortedOrders.length > 0) {
          fetchOrderStatuses(sortedOrders);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'We could not load your order history. Please try again later.');
        setOrders([]); // Set empty array to prevent filter errors
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);
  
  // Fetch status for all orders
  const fetchOrderStatuses = async (ordersList) => {
    try {
      const updatedOrders = [...ordersList];
      
      for (let i = 0; i < updatedOrders.length; i++) {
        const order = updatedOrders[i];
        try {
          // First check if the order already has a status we can use
          if (order.status) {
            console.log(`Order ${order._id} already has status: ${order.status}`);
            continue; // Skip API call if we already have a status
          }
          
          // Try to get status from API
          console.log(`Fetching status for order ${order._id}`);
          const statusResponse = await getOrderStatus(order._id);
          
          if (statusResponse.status === 'success' && statusResponse.data) {
            console.log(`Successfully got status for order ${order._id}: ${statusResponse.data.status}`);
            updatedOrders[i] = {
              ...order,
              status: statusResponse.data.status || order.status
            };
          }
        } catch (err) {
          console.error(`Error fetching status for order ${order._id}:`, err);
          // If we hit a 404, it means the endpoint doesn't exist yet
          // In this case, just keep using the status from the order object
          console.log(`Will use existing status for order ${order._id}: ${order.status || 'processing'}`);
        }
      }
      
      setOrders(updatedOrders);
    } catch (err) {
      console.error('Error fetching order statuses:', err);
    }
  };
  
  // Manual refresh of order statuses
  const refreshOrderStatuses = async () => {
    if (refreshingStatus || orders.length === 0) return;
    
    try {
      setRefreshingStatus(true);
      console.log('Manually refreshing order statuses...');
      
      // Create a copy of orders with status field cleared to force refresh
      const ordersForRefresh = orders.map(order => ({
        ...order,
        _isRefreshing: true // Add a flag to indicate this is a refresh
      }));
      
      // Show a temporary "refreshing" state in the UI
      setOrders(ordersForRefresh);
      
      // Wait a moment to show the refreshing state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to refresh statuses
      try {
        await fetchOrderStatuses(orders);
        console.log('Order statuses refreshed successfully');
      } catch (refreshError) {
        console.error('Error during status refresh:', refreshError);
        // Restore original orders if refresh fails
        setOrders(orders.map(order => ({
          ...order,
          _isRefreshing: false
        })));
      }
    } catch (err) {
      console.error('Error refreshing order statuses:', err);
    } finally {
      setRefreshingStatus(false);
    }
  };
  
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
  
  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };
  
  // Add a function to save order data for detail view that persists when navigating 
  const saveOrderForDetailView = (order) => {
    if (!order) return;
    
    try {
      // Store in sessionStorage to persist through navigation but not browser close
      sessionStorage.setItem('currentOrderDetail', JSON.stringify(order));
      // Store orderId separately so we can verify correct order
      sessionStorage.setItem('currentOrderId', order._id);
      
      // Also store user information separately for better access
      if (user) {
        sessionStorage.setItem('userName', user.name || '');
        sessionStorage.setItem('userEmail', user.email || '');
        sessionStorage.setItem('userPhone', user.phone || '');
      }
      
      console.log('Saved order to sessionStorage for detail view:', order);
    } catch (err) {
      console.error('Error saving order to sessionStorage:', err);
    }
  };
  
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancellingOrder(orderId);
    try {
      const response = await cancelOrder(orderId);
      // Update the order in the list
      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, status: 'cancelled', cancelledAt: response.order.cancelledAt }
          : order
      ));
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Failed to cancel order. Please try again later.');
    } finally {
      setCancellingOrder(null);
    }
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    return order.items.some(item => 
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
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
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            onClick={refreshOrderStatuses} 
            className="refresh-status-button"
            disabled={refreshingStatus}
          >
            <FontAwesomeIcon icon={faSync} spin={refreshingStatus} /> Refresh Statuses
          </button>
          <Link to="/" className="back-link">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Shop
          </Link>
        </div>
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
          {filteredOrders.map(order => (
            <div key={order._id} className="order-card">
              <div 
                className="order-card-header"
                onClick={() => toggleOrderDetails(order._id)}
              >
                <div className="order-basic-info">
                  <div className="order-number-date">
                    <h3 className="order-number">Order #{order.orderNumber || order._id.substring(0, 8)}</h3>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-status-total">
                    <span className={`order-status ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="order-total">${(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="order-preview">
                  <div className="items-preview">
                    {order.items && order.items.length > 0 ? (
                      <div className="items-preview-container">
                        {order.items.map((item, idx) => idx < 2 && (
                          <div key={idx} className="item-preview">
                            <span className="item-name">{item.product.name}</span>
                            <span className="item-qty">×{item.quantity}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="more-items">+{order.items.length - 2} more</div>
                        )}
                      </div>
                    ) : (
                      <span className="no-items">No items</span>
                    )}
                  </div>
                  
                  <div className="order-actions">
                    {order.status !== 'cancelled' && (
                      <>
                        <Link 
                          to={`/order-confirmation/${order._id}`} 
                          className="view-details-button"
                          title="View Order Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveOrderForDetailView(order);
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} /> Details
                        </Link>
                        <button
                          className="download-invoice-button"
                          onClick={(e) => handleDownloadInvoice(order._id, e)}
                          title="Download Invoice"
                        >
                          <FontAwesomeIcon icon={faFileInvoice} /> Invoice
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <button
                        className="cancel-order-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order._id);
                        }}
                        disabled={cancellingOrder === order._id}
                        title="Cancel Order"
                      >
                        {cancellingOrder === order._id ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faTimes} />
                        )} Cancel
                      </button>
                    )}
                    {order.status === 'delivered' && !refundRequests[order._id] && (
                      <RefundRequest 
                        order={order} 
                        onRefundRequested={fetchRefundStatus}
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {expandedOrder === order._id && (
                <div className="order-detail-panel">
                  <div className="order-details-grid">
                    <div className="detail-section shipping-info">
                      <h4><FontAwesomeIcon icon={faMapMarkerAlt} /> Shipping Address</h4>
                      <p className="customer-name">{user?.name || 'Customer'}</p>
                      <p>{order.shippingAddress?.street || 'No address available'}</p>
                      <p>
                        {order.shippingAddress?.city || ''} 
                        {order.shippingAddress?.city && order.shippingAddress?.postalCode ? ', ' : ''}
                        {order.shippingAddress?.postalCode || ''}
                      </p>
                      {user?.phone && <p><FontAwesomeIcon icon={faPhone} /> {user.phone}</p>}
                    </div>
                    
                    <div className="detail-section order-summary">
                      <h4><FontAwesomeIcon icon={faInfoCircle} /> Order Summary</h4>
                      <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>${(order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Shipping:</span>
                        <span>${(order.shippingCost || 0).toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Tax:</span>
                        <span>${(order.tax || 0).toFixed(2)}</span>
                      </div>
                      <div className="summary-row total-row">
                        <span>Total:</span>
                        <span>${(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section items-list">
                    <h4><FontAwesomeIcon icon={faBoxOpen} /> Items</h4>
                    <div className="order-items">
                      {order.items && order.items.length > 0 ? (
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx}>
                                <td>{item.product.name}</td>
                                <td>{item.quantity}</td>
                                <td>${(item.priceAtPurchase || item.product.price).toFixed(2)}</td>
                                <td>${((item.priceAtPurchase || item.product.price) * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="no-items-message">No items in this order</p>
                      )}
                    </div>
                  </div>
                  
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
                </div>
              )}
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