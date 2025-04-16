import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoffee, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import './WelcomeScreen.css';

function WelcomeScreen() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <FontAwesomeIcon icon={faCoffee} className="welcome-icon" />
        <h1 className="welcome-title">Welcome to Our Coffee Shop</h1>
        <p className="welcome-subtitle">Discover the finest coffee beans and blends.</p>
        
        {isAuthenticated ? (
          <div className="auth-buttons">
            <span className="welcome-message">
              Welcome back, {user?.name || 'User'}!
            </span>
            <button onClick={logout} className="welcome-button logout">
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="welcome-button">
              Login
            </Link>
            <Link to="/register" className="welcome-button">
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default WelcomeScreen;
