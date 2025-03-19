import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoffee, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import './WelcomeScreen.css';

function WelcomeScreen() {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <FontAwesomeIcon icon={faCoffee} className="welcome-icon" />
        <h1 className="welcome-title">Welcome to Our Coffee Shop</h1>
        <p className="welcome-subtitle">Discover the finest coffee beans and blends.</p>
        <button className="welcome-button">
          Explore Now <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
