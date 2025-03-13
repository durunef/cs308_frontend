import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faShoppingCart, 
  faHeart, 
  faUser, 
  faSignOutAlt,
  faHome,
  faList,
  faSearch,
  faBars,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import "./navbar.css";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when window is resized to desktop size
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
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
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
          <span className="logo-text">Store</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={`navbar-links desktop-links ${isMobileMenuOpen ? 'hidden' : ''}`}>
          <Link to="/" className="nav-link hover-effect">
            <FontAwesomeIcon icon={faHome} className="icon-margin-right" />
            Home
          </Link>
          <div className="dropdown">
            <button 
              className="nav-link dropdown-toggle hover-effect"
              onClick={() => setShowCategories(!showCategories)}
            >
              <FontAwesomeIcon icon={faList} className="icon-margin-right" />
              Categories
            </button>
            {showCategories && (
              <div className="dropdown-menu">
                <Link to="/category/electronics" className="dropdown-item">Electronics</Link>
                <Link to="/category/clothing" className="dropdown-item">Clothing</Link>
                <Link to="/category/books" className="dropdown-item">Books</Link>
                <Link to="/category/home" className="dropdown-item">Home & Kitchen</Link>
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
          <Link to="/cart" className="nav-icon cart-icon bounce-on-hover">
            <FontAwesomeIcon icon={faShoppingCart} />
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/wishlist" className="nav-icon bounce-on-hover">
                <FontAwesomeIcon icon={faHeart} />
              </Link>
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
                <Link to="/category/electronics" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Electronics</Link>
                <Link to="/category/clothing" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Clothing</Link>
                <Link to="/category/books" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Books</Link>
                <Link to="/category/home" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Home & Kitchen</Link>
              </div>
            )}
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
                  <Link to="/wishlist" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <FontAwesomeIcon icon={faHeart} className="icon-margin-right" />
                    Wishlist
                  </Link>
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
