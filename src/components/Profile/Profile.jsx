import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faEnvelope, 
  faMapMarkerAlt, 
  faHistory,
  faCog,
  faCoffee,
  faShoppingBag,
  faEye,
  faSpinner,
  faExclamationTriangle,
  faEdit,
  faSearch,
  faClipboardList,
  faAddressCard,
  faCheck,
  faSort
} from "@fortawesome/free-solid-svg-icons";
import "./profile.css";
import { useAuth } from "../../context/AuthContext";
import { getOrderHistory } from "../../api/orderService";
import OrderHistory from "../OrderHistory/OrderHistory";

function Profile() {
  const location = useLocation();
  const { user, token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [address, setAddress] = useState({ street: "", city: "", postalCode: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Use URL query parameter to set active tab
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    
    if (tabParam && ['personal', 'orders', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
      console.log(`Setting active tab from URL: ${tabParam}`);
    }
  }, [location.search]);

  // Fetch profile information
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const { data, status } = await res.json();
        if (status === "success" && data.user) {
          setAddress({
            street: data.user.address.street || "",
            city: data.user.address.city || "",
            postalCode: data.user.address.postalCode || ""
          });
        }
      } catch (err) {
        console.error(err);
        setMessage("Failed to load profile information.");
        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleAddressChange = e => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async e => {
    e.preventDefault();
    if (!token) {
      setMessage("You must be logged in.");
      setMessageType("error");
      return;
    }
    if (!address.street || !address.city || !address.postalCode) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/user/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(address)
      });
      const { status } = await res.json();
      if (status === "success") {
        setMessage("Address updated successfully.");
        setMessageType("success");
        setIsEditing(false);
      } else {
        throw new Error("Failed to update address");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to update address.");
      setMessageType("error");
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container loading-container">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Profile Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="profile-container auth-required">
        <div className="auth-message">
          <FontAwesomeIcon icon={faUser} />
          <h2>Login Required</h2>
          <p>Please login to view this page.</p>
          <Link to="/login" className="auth-button">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1 className="profile-heading">
        <FontAwesomeIcon icon={faCoffee} className="coffee-icon" /> My Profile
      </h1>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === "personal" ? "active" : ""}`}
          onClick={() => setActiveTab("personal")}
        >
          <FontAwesomeIcon icon={faUser} /> Personal Information
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
          <FontAwesomeIcon icon={faCog} /> Settings
        </button>
      </div>

      <div className="profile-content">
        {activeTab === "personal" && (
          <div className="personal-info-section">
            <div className="profile-card">
              <div className="profile-card-header">
                <h2><FontAwesomeIcon icon={faUser} className="field-icon" /> Personal Information</h2>
                {!isEditing && (
                  <button 
                    className="edit-profile-button" 
                    onClick={() => setIsEditing(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                )}
              </div>
              
              <div className="profile-card-content">
                <div className="profile-details">
                  <div className="profile-detail-item">
                    <FontAwesomeIcon icon={faUser} className="field-icon" />
                    <div>
                      <label>Name</label>
                      <p>{user.name}</p>
                    </div>
                  </div>
                  
                  <div className="profile-detail-item">
                    <FontAwesomeIcon icon={faEnvelope} className="field-icon" />
                    <div>
                      <label>Email</label>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="profile-detail-item">
                    <FontAwesomeIcon icon={faAddressCard} className="field-icon" />
                    <div>
                      <label>Address</label>
                      {!isEditing ? (
                        <p>
                          {address.street && address.city && address.postalCode ? (
                            <>
                              {address.street}, {address.city}, {address.postalCode}
                            </>
                          ) : (
                            <span className="empty-address">No address information found</span>
                          )}
                        </p>
                      ) : (
                        <form className="profile-form" onSubmit={handleAddressSubmit}>
                          <div className="profile-field">
                            <label><FontAwesomeIcon icon={faMapMarkerAlt} className="field-icon" /> Street</label>
                            <input
                              name="street"
                              value={address.street}
                              onChange={handleAddressChange}
                              placeholder="Enter street name"
                            />
                          </div>
                          <div className="profile-field">
                            <label><FontAwesomeIcon icon={faMapMarkerAlt} className="field-icon" /> City</label>
                            <input
                              name="city"
                              value={address.city}
                              onChange={handleAddressChange}
                              placeholder="Enter city name"
                            />
                          </div>
                          <div className="profile-field">
                            <label><FontAwesomeIcon icon={faMapMarkerAlt} className="field-icon" /> Postal Code</label>
                            <input
                              name="postalCode"
                              value={address.postalCode}
                              onChange={handleAddressChange}
                              placeholder="Enter postal code"
                            />
                          </div>

                          {message && (
                            <div className={`profile-message ${messageType}`}>{message}</div>
                          )}
                          
                          <div className="form-buttons">
                            <button type="submit" className="profile-submit">
                              <FontAwesomeIcon icon={faCheck} /> Save
                            </button>
                            <button 
                              type="button" 
                              className="cancel-button"
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <OrderHistory />
        )}

        {activeTab === "settings" && (
          <div className="account-settings">
            <div className="settings-section">
              <h3>Change Password</h3>
              <p>Please regularly update your password for account security.</p>
              <button className="change-password-button">
                <FontAwesomeIcon icon={faEdit} /> Change Password
              </button>
            </div>
            
            <div className="settings-section">
              <h3>Notification Settings</h3>
              <div className="preference-option">
                <input type="checkbox" id="email-notifications" defaultChecked />
                <label htmlFor="email-notifications">Email Notifications</label>
              </div>
              <div className="preference-option">
                <input type="checkbox" id="order-updates" defaultChecked />
                <label htmlFor="order-updates">Order Updates</label>
              </div>
              <div className="preference-option">
                <input type="checkbox" id="promotions" defaultChecked />
                <label htmlFor="promotions">Promotions and Discounts</label>
              </div>
            </div>
            
            <div className="settings-section danger-zone">
              <h3>Account Deletion</h3>
              <p>This action is irreversible, and all your data will be deleted.</p>
              <button className="delete-account-button">
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
