import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faTrash, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import './Notifications.css';

const Notifications = () => {
  const { token } = useAuth();
  const { addToCart } = useCart();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNotifications(response.data.notifications || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(`http://localhost:3000/api/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      console.log('Deleting notification with ID:', notificationId);
      const response = await axios.delete(`http://localhost:3000/api/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Delete response:', response.data);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== notificationId)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      await addToCart(productId, 1);
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    } catch (err) {
      console.error('Error adding to cart:', err);
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faBell} spin />
          <span>Loading notifications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-container">
        <div className="error-message">
          <FontAwesomeIcon icon={faBell} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <h1 className="notifications-title">
        <FontAwesomeIcon icon={faBell} className="bell-icon" />
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <FontAwesomeIcon icon={faBell} />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                <h3 className="notification-title">
                  {notification.title}
                  {!notification.read && <span className="unread-badge" />}
                </h3>
                <p className="notification-message">{notification.message}</p>
                <div className="notification-meta">
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                  {notification.link && (
                    <button
                      className="add-to-cart-button"
                      onClick={() => handleAddToCart(notification.link.split('/').pop())}
                      disabled={addingToCart[notification.link.split('/').pop()]}
                    >
                      <FontAwesomeIcon icon={faShoppingCart} />
                      {addingToCart[notification.link.split('/').pop()] ? 'Adding...' : 'Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button
                    className="action-button mark-read"
                    onClick={() => handleMarkAsRead(notification._id)}
                    title="Mark as read"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
                <button
                  className="action-button delete"
                  onClick={() => handleDelete(notification._id)}
                  title="Delete notification"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 