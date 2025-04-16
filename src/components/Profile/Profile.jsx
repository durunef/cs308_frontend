import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt, 
  faCreditCard, 
  faHistory,
  faCog,
  faCoffee,
  faHome,
  faPlus,
  faEdit,
  faTrash,
  faShoppingBag
} from "@fortawesome/free-solid-svg-icons";
import "./profile.css";
// Import the mockData
import mockData from '../../data/mockData.json';

function Profile() {
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "555-123-4567",
    address: "123 Coffee St, Bean City, 90210",
    paymentMethod: "Visa ending in 4242",
  });
  
  // State for addresses
  const [addresses, setAddresses] = useState([]);
  
  // State for editing address
  const [editAddress, setEditAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    nickname: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    isDefault: false
  });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState(null);
  
  // State for order history
  const [orderHistory, setOrderHistory] = useState([]);
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Load mock data on component mount
  useEffect(() => {
    // Simulate API loading time
    setTimeout(() => {
      // Set addresses
      setAddresses([
        {
          id: 1,
          nickname: "Home",
          street: "123 Coffee St",
          city: "Bean City",
          state: "CA",
          zipCode: "90210",
          isDefault: true
        },
        {
          id: 2,
          nickname: "Work",
          street: "456 Latte Ave",
          city: "Espresso Hills",
          state: "CA",
          zipCode: "90211",
          isDefault: false
        }
      ]);
      
      // Generate order history from mockData
      const generatedOrders = [
        { 
          id: "ORD-001", 
          date: "2023-04-01", 
          total: calculateTotal([mockData[0], mockData[0], mockData[3]]), 
          status: "Delivered",
          items: [
            { name: mockData[0].name, quantity: 2 },
            { name: mockData[3].name, quantity: 1 }
          ] 
        },
        { 
          id: "ORD-002", 
          date: "2023-03-15", 
          total: calculateTotal([mockData[4], mockData[1]]), 
          status: "Delivered",
          items: [
            { name: mockData[4].name, quantity: 1 },
            { name: mockData[1].name, quantity: 1 }
          ] 
        },
        { 
          id: "ORD-003", 
          date: "2023-02-20", 
          total: calculateTotal([mockData[5]]), 
          status: "Delivered",
          items: [
            { name: mockData[5].name, quantity: 1 }
          ] 
        },
      ];
      
      setOrderHistory(generatedOrders);
      setIsLoading(false);
    }, 600);
  }, []);
  
  // Helper function to calculate total price
  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      if (typeof item.quantity === 'number') {
        return total + (item.price * item.quantity);
      }
      return total + item.price;
    }, 0);
  };
  
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");

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

  // Address form change handler
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === 'checkbox' ? checked : value;
    
    if (isAddingAddress) {
      setNewAddress({ ...newAddress, [name]: updatedValue });
    } else if (editAddress) {
      setEditAddress({ ...editAddress, [name]: updatedValue });
    }
  };

  // Add a new address
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setAddressMessage("Updating address...");
    
    // Simulate API call
    setTimeout(() => {
      if (isAddingAddress) {
        // Adding a new address
        const newId = Math.max(...addresses.map(a => a.id), 0) + 1;
        const addressToAdd = { ...newAddress, id: newId };
        
        // If this is set as default, update other addresses
        if (addressToAdd.isDefault) {
          setAddresses(addresses.map(addr => ({
            ...addr,
            isDefault: false
          })).concat(addressToAdd));
        } else {
          setAddresses([...addresses, addressToAdd]);
        }
        
        setNewAddress({
          nickname: "",
          street: "",
          city: "",
          state: "",
          zipCode: "",
          isDefault: false
        });
        setIsAddingAddress(false);
        
      } else if (editAddress) {
        // Editing an existing address
        let updatedAddresses;
        
        // If this is set as default, update other addresses
        if (editAddress.isDefault) {
          updatedAddresses = addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === editAddress.id
          }));
        } else {
          updatedAddresses = addresses.map(addr => 
            addr.id === editAddress.id ? editAddress : addr
          );
          
          // Make sure we still have a default address
          if (!updatedAddresses.some(addr => addr.isDefault)) {
            updatedAddresses[0].isDefault = true;
          }
        }
        
        setAddresses(updatedAddresses);
        setEditAddress(null);
      }
      
      setAddressMessage("Address updated successfully!");
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setAddressMessage(null);
      }, 3000);
      
    }, 1000);
  };

  // Delete an address
  const handleDeleteAddress = (id) => {
    setAddressMessage("Deleting address...");
    
    // Simulate API call
    setTimeout(() => {
      const addressToDelete = addresses.find(addr => addr.id === id);
      const wasDefault = addressToDelete.isDefault;
      
      let filteredAddresses = addresses.filter(addr => addr.id !== id);
      
      // If we deleted the default address, set a new default
      if (wasDefault && filteredAddresses.length > 0) {
        filteredAddresses[0].isDefault = true;
      }
      
      setAddresses(filteredAddresses);
      setAddressMessage("Address deleted successfully!");
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setAddressMessage(null);
      }, 3000);
    }, 1000);
  };

  // Set an address as default
  const setDefaultAddress = (id) => {
    setAddressMessage("Setting default address...");
    
    // Simulate API call
    setTimeout(() => {
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      })));
      
      setAddressMessage("Default address updated successfully!");
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setAddressMessage(null);
      }, 3000);
    }, 1000);
  };

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-loading">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
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
          className={`profile-tab ${activeTab === "addresses" ? "active" : ""}`}
          onClick={() => setActiveTab("addresses")}
        >
          <FontAwesomeIcon icon={faMapMarkerAlt} /> Addresses
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
            
            {message && (
              <div className={`profile-message ${messageType}`}>{message}</div>
            )}
          </form>
        )}
        
        {activeTab === "addresses" && (
          <div className="addresses-section">
            <h2>
              <FontAwesomeIcon icon={faHome} /> Your Delivery Addresses
            </h2>
            
            {/* Addresses list */}
            <div className="addresses-list">
              {addresses.map(address => (
                <div key={address.id} className={`address-card ${address.isDefault ? 'default-address' : ''}`}>
                  {address.isDefault && <div className="default-badge">Default</div>}
                  <div className="address-header">
                    <h3>{address.nickname}</h3>
                    <div className="address-actions">
                      <button 
                        className="edit-button" 
                        onClick={() => {
                          setEditAddress(address);
                          setIsAddingAddress(false);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className="delete-button" 
                        onClick={() => handleDeleteAddress(address.id)}
                        disabled={addresses.length === 1}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  <div className="address-details">
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                  </div>
                  {!address.isDefault && (
                    <button 
                      className="make-default-button"
                      onClick={() => setDefaultAddress(address.id)}
                    >
                      Make Default
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Add address button */}
            {!isAddingAddress && !editAddress && (
              <button 
                className="add-address-button"
                onClick={() => {
                  setIsAddingAddress(true);
                  setEditAddress(null);
                }}
              >
                <FontAwesomeIcon icon={faPlus} /> Add New Address
              </button>
            )}
            
            {/* Add/Edit address form */}
            {(isAddingAddress || editAddress) && (
              <div className="address-form-container">
                <h3>{isAddingAddress ? "Add New Address" : "Edit Address"}</h3>
                <form className="address-form" onSubmit={handleAddressSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nickname">Nickname (e.g., Home, Work)</label>
                      <input
                        type="text"
                        id="nickname"
                        name="nickname"
                        value={isAddingAddress ? newAddress.nickname : editAddress.nickname}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="street">Street Address</label>
                    <input
                      type="text"
                      id="street"
                      name="street"
                      value={isAddingAddress ? newAddress.street : editAddress.street}
                      onChange={handleAddressChange}
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
                        value={isAddingAddress ? newAddress.city : editAddress.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="state">State</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={isAddingAddress ? newAddress.state : editAddress.state}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="zipCode">ZIP Code</label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={isAddingAddress ? newAddress.zipCode : editAddress.zipCode}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={isAddingAddress ? newAddress.isDefault : editAddress.isDefault}
                      onChange={handleAddressChange}
                    />
                    <label htmlFor="isDefault">Set as default delivery address</label>
                  </div>
                  
                  <div className="form-buttons">
                    <button type="submit" className="save-address-button">
                      {isAddingAddress ? "Add Address" : "Save Changes"}
                    </button>
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => {
                        setIsAddingAddress(false);
                        setEditAddress(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Address action message */}
            {addressMessage && (
              <div className="address-message success">
                {addressMessage}
              </div>
            )}
          </div>
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
                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <span key={index} className="order-item-entry">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
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