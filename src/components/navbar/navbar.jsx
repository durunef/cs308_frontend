// src/components/navbar/navbar.jsx
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faShoppingCart, 
  faUser, 
  faSignOutAlt,
  faHome,
  faList,
  faSearch,
  faBars,
  faTimes,
  faHeart
} from "@fortawesome/free-solid-svg-icons";
import "./navbar.css";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategories(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Mobile menu toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
        </button>

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Coffee Shop</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={`navbar-links desktop-links ${isMobileMenuOpen ? 'hidden' : ''}`}>
          <Link to="/" className="nav-link hover-effect">
            <FontAwesomeIcon icon={faHome} className="icon-margin-right" />
            Home
          </Link>
          <div className="dropdown" ref={dropdownRef}>
            <button 
              className="nav-link dropdown-toggle hover-effect"
              onClick={() => setShowCategories(!showCategories)}
            >
              <FontAwesomeIcon icon={faList} className="icon-margin-right" />
              Categories
            </button>
            {showCategories && (
              <div className="dropdown-menu" style={{position: 'absolute', zIndex: 1000}}>
                <div className="category-group">
                  <h4 className="category-header">Coffee Bean Types</h4>
                  <Link to="/category/arabica" className="dropdown-item">Arabica (smooth and flavorful)</Link>
                  <Link to="/category/robusta" className="dropdown-item">Robusta (strong and bold)</Link>
                  <Link to="/category/liberica" className="dropdown-item">Liberica (fruity and smoky)</Link>
                  <Link to="/category/excelsa" className="dropdown-item">Excelsa (tart and complex)</Link>
                </div>
                
                <div className="category-group">
                  <h4 className="category-header">Roast Level</h4>
                  <Link to="/category/light-roast" className="dropdown-item">Light Roast (higher acidity, floral notes)</Link>
                  <Link to="/category/medium-roast" className="dropdown-item">Medium Roast (balanced flavor and aroma)</Link>
                  <Link to="/category/dark-roast" className="dropdown-item">Dark Roast (bold and rich with less acidity)</Link>
                </div>
                
                <div className="category-group">
                  <h4 className="category-header">Coffee Origin</h4>
                  <Link to="/category/single-origin" className="dropdown-item">Single-Origin (from a specific region or farm)</Link>
                  <Link to="/category/blends" className="dropdown-item">Blends (mix of beans for unique flavors)</Link>
                  <Link to="/category/geographical" className="dropdown-item">Geographical regions</Link>
                </div>
                
                <div className="category-group">
                  <h4 className="category-header">Grind Type</h4>
                  <Link to="/category/whole-beans" className="dropdown-item">Whole Beans</Link>
                  <Link to="/category/coarse-grind" className="dropdown-item">Coarse Grind</Link>
                  <Link to="/category/medium-grind" className="dropdown-item">Medium Grind</Link>
                  <Link to="/category/fine-grind" className="dropdown-item">Fine Grind</Link>
                </div>
                
                <div className="category-group">
                  <h4 className="category-header">Brewing Methods</h4>
                  <Link to="/category/espresso" className="dropdown-item">Espresso Beans</Link>
                  <Link to="/category/french-press" className="dropdown-item">French Press Coffee Beans</Link>
                  <Link to="/category/drip-coffee" className="dropdown-item">Drip Coffee Beans</Link>
                  <Link to="/category/cold-brew" className="dropdown-item">Cold Brew Coffee Beans</Link>
                  <Link to="/category/turkish" className="dropdown-item">Turkish Coffee Beans</Link>
                </div>
                
                <div className="category-group">
                  <h4 className="category-header">Organic and Special Varieties</h4>
                  <Link to="/category/organic" className="dropdown-item">Organic Coffee</Link>
                  <Link to="/category/fair-trade" className="dropdown-item">Fair Trade Coffee</Link>
                  <Link to="/category/decaf" className="dropdown-item">Decaf Coffee</Link>
                  <Link to="/category/flavored" className="dropdown-item">Flavored Coffee</Link>
                  <Link to="/category/specialty" className="dropdown-item">Specialty Coffee</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className={`search-container ${isMobileMenuOpen ? 'hidden' : ''}`}>
          <input type="text" className="search-input" placeholder="Search products..." />
          <button className="search-button pulse-effect">
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>

        {/* User Actions */}
        <div className={`navbar-right ${isMobileMenuOpen ? 'hidden' : ''}`}>
          <Link to="/wishlist" className="nav-icon bounce-on-hover">
            <FontAwesomeIcon icon={faHeart} />
          </Link>
          <Link to="/cart" className="nav-icon cart-icon bounce-on-hover">
            <FontAwesomeIcon icon={faShoppingCart} />
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/profile" className="nav-icon bounce-on-hover">
                <FontAwesomeIcon icon={faUser} />
              </Link>
              <button 
                className="navbar-link logout-link"
                onClick={() => setIsLoggedIn(false)}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="icon-margin-right" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link login-link">
                Login
              </Link>
              <Link to="/register" className="navbar-link register-link">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Side Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <button 
              className="close-menu-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="mobile-menu-content">
            <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faHome} className="icon-margin-right" />
              Home
            </Link>
            <button 
              className="mobile-nav-link mobile-dropdown-toggle"
              onClick={() => setShowCategories(!showCategories)}
            >
              <FontAwesomeIcon icon={faList} className="icon-margin-right" />
              Categories
              <span className="dropdown-arrow">{showCategories ? '▲' : '▼'}</span>
            </button>
            {showCategories && (
              <div className="mobile-dropdown-menu">
                <div className="mobile-category-group">
                  <h4 className="mobile-category-header">Coffee Bean Types</h4>
                  <Link to="/category/arabica" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Arabica</Link>
                  <Link to="/category/robusta" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Robusta</Link>
                  <Link to="/category/liberica" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Liberica</Link>
                  <Link to="/category/excelsa" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Excelsa</Link>
                </div>
                
                <div className="mobile-category-group">
                  <h4 className="mobile-category-header">Roast Level</h4>
                  <Link to="/category/light-roast" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Light Roast</Link>
                  <Link to="/category/medium-roast" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Medium Roast</Link>
                  <Link to="/category/dark-roast" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Dark Roast</Link>
                </div>
                
                <div className="mobile-category-group">
                  <h4 className="mobile-category-header">Coffee Origin</h4>
                  <Link to="/category/single-origin" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Single-Origin</Link>
                  <Link to="/category/blends" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Blends</Link>
                  <Link to="/category/geographical" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Geographical regions</Link>
                </div>
                
                <div className="mobile-category-group">
                  <h4 className="mobile-category-header">Grind Type</h4>
                  <Link to="/category/whole-beans" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Whole Beans</Link>
                  <Link to="/category/coarse-grind" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Coarse Grind</Link>
                  <Link to="/category/medium-grind" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Medium Grind</Link>
                  <Link to="/category/fine-grind" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Fine Grind</Link>
                </div>
                
                <div className="mobile-category-group">
                  <h4 className="mobile-category-header">Brewing Methods</h4>
                  <Link to="/category/espresso" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Espresso Beans</Link>
                  <Link to="/category/french-press" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>French Press</Link>
                  <Link to="/category/drip-coffee" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Drip Coffee</Link>
                  <Link to="/category/cold-brew" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Cold Brew</Link>
                  <Link to="/category/turkish" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Turkish Coffee</Link>
                </div>
                
                <div className="mobile-category-group">
                  <h4 className="mobile-category-header">Organic & Special</h4>
                  <Link to="/category/organic" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Organic Coffee</Link>
                  <Link to="/category/fair-trade" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Fair Trade</Link>
                  <Link to="/category/decaf" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Decaf Coffee</Link>
                  <Link to="/category/flavored" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Flavored Coffee</Link>
                  <Link to="/category/specialty" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Specialty Coffee</Link>
                </div>
              </div>
            )}
            <Link to="/wishlist" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              Wishlist
            </Link>
            <div className="mobile-search">
              <input type="text" className="mobile-search-input" placeholder="Search products..." />
              <button className="mobile-search-button">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
            <div className="mobile-user-actions">
              <Link to="/cart" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <FontAwesomeIcon icon={faShoppingCart} className="icon-margin-right" />
                Cart
              </Link>
              {isLoggedIn ? (
                <>
                  <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <FontAwesomeIcon icon={faUser} className="icon-margin-right" />
                    Profile
                  </Link>
                  <button 
                    className="mobile-nav-link mobile-logout"
                    onClick={() => {
                      setIsLoggedIn(false);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="icon-margin-right" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <FontAwesomeIcon icon={faUser} className="icon-margin-right" />
                    Login
                  </Link>
                  <Link to="/register" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <FontAwesomeIcon icon={faUser} className="icon-margin-right" />
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;