import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoffee, faArrowRight, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import './WelcomeScreen.css';

function WelcomeScreen() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <FontAwesomeIcon icon={faCoffee} className="welcome-icon" />
        <h1 className="welcome-title">Welcome to Our Coffee Shop</h1>
        <p className="welcome-subtitle">Discover the finest coffee beans and blends.</p>
        
        {isAuthenticated ? (
          <div className="auth-buttons">
            <div className="user-welcome">
              <FontAwesomeIcon icon={faUser} className="user-icon" />
              <span className="welcome-message">
                <span className="username">{user?.name || 'User'}</span>
              </span>
            </div>
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
