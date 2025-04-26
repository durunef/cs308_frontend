import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faEnvelope, 
  faMapMarkerAlt, 
  faCreditCard, 
  faHistory,
  faCog,
  faCoffee,
  faHome,
  faPlus,
  faEdit,
  faTrash,
  faShoppingBag,
  faEye,
  faSpinner,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import "./profile.css";
import { useAuth } from "../../context/AuthContext";
import { getOrderHistory } from "../../api/orderService";

function Profile() {
  const { user, token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    postalCode: ""
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  useEffect(() => {
    console.log('Profile component - Auth state:', { user, token, isAuthenticated });
    const storedUser = localStorage.getItem('user');
    console.log('Stored user data:', storedUser);

    const fetchUserData = async () => {
      if (!token) {
        console.log('No token available');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching user data with token:', token);
        const response = await fetch('http://localhost:3000/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Received data:', data);
          
          if (data.status === 'success' && data.data.user) {
            const userData = data.data.user;
            setAddress({
              street: userData.address?.street || "",
              city: userData.address?.city || "",
              postalCode: userData.address?.postalCode || ""
            });
          }
        } else {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        setMessage("Failed to load user data. Please try again later.");
        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token, isAuthenticated]);

  // Fetch order history when the orders tab is clicked
  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      fetchOrders();
    }
  }, [activeTab, isAuthenticated]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    
    try {
      const response = await getOrderHistory();
      
      if (response.status === 'success') {
        setOrders(response.data || []);
      } else {
        throw new Error('Failed to fetch order history');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrdersError('We could not load your order history. Please try again later.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage("You must be logged in to update your address.");
      setMessageType("error");
      return;
    }

    // Validate address fields
    if (!address.street || !address.city || !address.postalCode) {
      setMessage("Please fill in all address fields.");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/user/address', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(address)
      });

      if (!response.ok) {
        throw new Error('Failed to update address');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setMessage("Address updated successfully!");
        setMessageType("success");
      }
    } catch (error) {
      console.error('Error updating address:', error);
      setMessage("Failed to update address. Please try again.");
      setMessageType("error");
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

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log('Not authenticated or no user data:', { isAuthenticated, user });
    return (
      <div className="profile-container">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1 className="profile-heading">
        <FontAwesomeIcon icon={faCoffee} className="coffee-icon" /> 
        Your Coffee Profile
      </h1>
      
      <div className="profile-tabs">
        <button 
          className={`profile-tab ${activeTab === "personal" ? "active" : ""}`}
          onClick={() => setActiveTab("personal")}
        >
          <FontAwesomeIcon icon={faUser} /> Personal Info
        </button>
        <button 
          className={`profile-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <FontAwesomeIcon icon={faHistory} /> Order History
        </button>
        <button 
          className={`profile-tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <FontAwesomeIcon icon={faCog} /> Account Settings
        </button>
      </div>
      
      <div className="profile-content">
        {activeTab === "personal" && (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-field">
              <label htmlFor="name">
                <FontAwesomeIcon icon={faUser} className="field-icon" /> Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={user.name || ""}
                readOnly
              />
            </div>
            
            <div className="profile-field">
              <label htmlFor="email">
                <FontAwesomeIcon icon={faEnvelope} className="field-icon" /> Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email || ""}
                readOnly
              />
            </div>
            
            <div className="profile-field">
              <label htmlFor="street">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="field-icon" /> Street Address
              </label>
              <input
                type="text"
                id="street"
                name="street"
                value={address.street}
                onChange={handleChange}
                placeholder="Enter your street address"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="city">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="field-icon" /> City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={address.city}
                onChange={handleChange}
                placeholder="Enter your city"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="postalCode">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="field-icon" /> Postal Code
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={address.postalCode}
                onChange={handleChange}
                placeholder="Enter your postal code"
              />
            </div>
            
            <button type="submit" className="profile-submit">
              Save Changes
            </button>
            
            {message && (
              <div className={`profile-message ${messageType}`}>{message}</div>
            )}
          </form>
        )}
        
        {activeTab === "orders" && (
          <div className="order-history">
            <h2><FontAwesomeIcon icon={faShoppingBag} /> Your Orders</h2>
            
            {ordersLoading ? (
              <div className="loading-state">
                <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
                <p>Loading your order history...</p>
              </div>
            ) : ordersError ? (
              <div className="error-state">
                <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                <p>{ordersError}</p>
                <button onClick={fetchOrders} className="retry-button">
                  Try Again
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faCoffee} className="empty-icon" />
                <p>You haven't placed any orders yet.</p>
                <Link to="/products" className="shop-now-button">Shop Now</Link>
              </div>
            ) : (
              <div className="order-list">
                {orders.map(order => (
                  <div key={order._id} className="order-item">
                    <div className="order-header">
                      <span className="order-id">Order #{order.orderNumber || order._id}</span>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="order-items">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="order-item-entry">
                          {item.product.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                    <div className="order-details">
                      <span className="order-total">${order.total.toFixed(2)}</span>
                      <span className={`order-status ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                      <Link to={`/order-confirmation/${order._id}`} className="view-order-button">
                        <FontAwesomeIcon icon={faEye} /> View Details
                      </Link>
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
        )}
        
        {activeTab === "settings" && (
          <div className="account-settings">
            <h2><FontAwesomeIcon icon={faCog} /> Account Settings</h2>
            
            <div className="settings-section">
              <h3>Password</h3>
              <button className="change-password-button">Change Password</button>
            </div>
            
            <div className="settings-section">
              <h3>Communication Preferences</h3>
              <div className="preference-option">
                <input type="checkbox" id="emailNotifications" defaultChecked />
                <label htmlFor="emailNotifications">Email notifications about orders</label>
              </div>
              <div className="preference-option">
                <input type="checkbox" id="marketingEmails" defaultChecked />
                <label htmlFor="marketingEmails">Coffee promotions and special offers</label>
              </div>
            </div>
            
            <div className="settings-section danger-zone">
              <h3>Danger Zone</h3>
              <button className="delete-account-button">Delete Account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;