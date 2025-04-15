import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt, 
  faCreditCard, 
  faHistory,
  faHeart,
  faCog,
  faCoffee,
  faShoppingBag
} from "@fortawesome/free-solid-svg-icons";
import "./profile.css";

function Profile() {
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "555-123-4567",
    address: "123 Coffee St, Bean City, 90210",
    paymentMethod: "Visa ending in 4242",
  });
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");
  
  // Mock order history
  const orderHistory = [
    { id: "ORD-001", date: "2023-04-01", total: 42.99, status: "Delivered" },
    { id: "ORD-002", date: "2023-03-15", total: 28.50, status: "Delivered" },
    { id: "ORD-003", date: "2023-02-20", total: 35.75, status: "Delivered" },
  ];
  
  // Mock wishlist items
  const wishlistItems = [
    { id: 1, name: "Colombian Dark Roast", price: 14.99 },
    { id: 2, name: "Ethiopian Medium Roast", price: 15.99 },
    { id: 3, name: "Coffee Grinder - Premium", price: 59.99 },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("Updating your information...");
    setMessageType("info");
    
    // Simulate API call
    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success) {
        setMessage("Profile updated successfully!");
        setMessageType("success");
      } else {
        setMessage("Failed to update profile. Please try again.");
        setMessageType("error");
      }
    }, 1000);
  };

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
          className={`profile-tab ${activeTab === "wishlist" ? "active" : ""}`}
          onClick={() => setActiveTab("wishlist")}
        >
          <FontAwesomeIcon icon={faHeart} /> Wishlist
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
                value={formData.name}
                onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="profile-field">
              <label htmlFor="phone">
                <FontAwesomeIcon icon={faPhone} className="field-icon" /> Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            
            <div className="profile-field">
              <label htmlFor="address">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="field-icon" /> Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            <div className="profile-field">
              <label htmlFor="paymentMethod">
                <FontAwesomeIcon icon={faCreditCard} className="field-icon" /> Payment Method
              </label>
              <input
                type="text"
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                readOnly
              />
            </div>
            
            <button type="submit" className="profile-submit">
              Save Changes
            </button>
          </form>
        )}
        
        {activeTab === "orders" && (
          <div className="order-history">
            <h2><FontAwesomeIcon icon={faShoppingBag} /> Your Orders</h2>
            {orderHistory.length > 0 ? (
              <div className="order-list">
                {orderHistory.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <span className="order-id">Order #{order.id}</span>
                      <span className="order-date">{order.date}</span>
                      <span className={`order-status status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-details">
                      <span className="order-total">${order.total.toFixed(2)}</span>
                      <button className="view-order-button">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FontAwesomeIcon icon={faCoffee} className="empty-icon" />
                <p>You haven't placed any orders yet.</p>
                <button className="shop-now-button">Shop Now</button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "wishlist" && (
          <div className="wishlist">
            <h2><FontAwesomeIcon icon={faHeart} /> Your Wishlist</h2>
            {wishlistItems.length > 0 ? (
              <div className="wishlist-items">
                {wishlistItems.map(item => (
                  <div key={item.id} className="wishlist-item">
                    <div className="item-info">
                      <h3>{item.name}</h3>
                      <p className="item-price">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="item-actions">
                      <button className="add-to-cart-button">Add to Cart</button>
                      <button className="remove-from-wishlist">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FontAwesomeIcon icon={faHeart} className="empty-icon" />
                <p>Your wishlist is empty.</p>
                <button className="shop-now-button">Discover Coffee</button>
              </div>
            )}
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
        
        {message && (
          <div className={`profile-message ${messageType}`}>{message}</div>
        )}
      </div>
    </div>
  );
}

export default Profile;