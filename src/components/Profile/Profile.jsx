import React, { useState } from "react";
import "./profile.css";

function Profile() {
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
  });

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      const success = Math.random() > 0.3;
      if (success) {
        setMessage("Profile updated successfully!");
        setMessageType("success");
      } else {
        setMessage("Failed to update profile.");
        setMessageType("error");
      }
    }, 1000);
  };

  return (
    <div className="profile-container">
      <h1 className="profile-heading">Your Profile</h1>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-field">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div className="profile-field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="profile-submit">
          Save Changes
        </button>
        {message && (
          <div className={`profile-message ${messageType}`}>{message}</div>
        )}
      </form>
    </div>
  );
}

export default Profile;
