// src/components/navbar/navbar.jsx
import { Link, useNavigate } from "react-router-dom";
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
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getAllCategories } from "../../api/categoryService";
import "./navbar.css";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartTotalQuantity } = useCart();
  const [showCategories, setShowCategories] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await getAllCategories();
        if (response.status === 'success') {
          setCategories(response.data.categories || []);
        } else {
          // Use fallback static categories if API call fails
          console.log('Using fallback categories');
          setCategories([]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Group categories into chunks for display
  const renderCategoryGroups = () => {
    if (isLoading) {
      return <div className="category-group">Loading categories...</div>;
    }

    if (categories.length === 0) {
      return <div className="category-group">No categories available</div>;
    }

    // If we have categories, display them
    return (
      <div className="category-group">
        <h4 className="category-header">Coffee Categories</h4>
        {categories.map(category => (
          <Link 
            key={category._id} 
            to={`/category/${category._id}`} 
            className="dropdown-item"
          >
            {category.name} {category.description && `(${category.description})`}
          </Link>
        ))}
      </div>
    );
  };

  // For mobile version
  const renderMobileCategoryGroups = () => {
    if (isLoading) {
      return <div className="mobile-category-group">Loading categories...</div>;
    }

    if (categories.length === 0) {
      return <div className="mobile-category-group">No categories available</div>;
    }

    return (
      <div className="mobile-category-group">
        <h4 className="mobile-category-header">Coffee Categories</h4>
        {categories.map(category => (
          <Link 
            key={category._id} 
            to={`/category/${category._id}`} 
            className="mobile-dropdown-item"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {category.name}
          </Link>
        ))}
      </div>
    );
  };

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
                {renderCategoryGroups()}
                
                {/* Keep some of the original category groups as they might be useful */}
                <div className="category-group">
                  <h4 className="category-header">Roast Level</h4>
                  <Link to="/category/light-roast" className="dropdown-item">Light Roast (higher acidity, floral notes)</Link>
                  <Link to="/category/medium-roast" className="dropdown-item">Medium Roast (balanced flavor and aroma)</Link>
                  <Link to="/category/dark-roast" className="dropdown-item">Dark Roast (bold and rich with less acidity)</Link>
                </div>
                
                <div className="category-group">
                  <h4 className="category-header">Brewing Methods</h4>
                  <Link to="/category/espresso" className="dropdown-item">Espresso Beans</Link>
                  <Link to="/category/french-press" className="dropdown-item">French Press Coffee Beans</Link>
                  <Link to="/category/drip-coffee" className="dropdown-item">Drip Coffee Beans</Link>
                  <Link to="/category/cold-brew" className="dropdown-item">Cold Brew Coffee Beans</Link>
                  <Link to="/category/turkish" className="dropdown-item">Turkish Coffee Beans</Link>
                </div>
              </div>
            )}
          </div>
          <Link to="/cart" className="nav-link hover-effect cart-link">
            <FontAwesomeIcon icon={faShoppingCart} className="icon-margin-right" />
            Cart
            <span className="cart-count">{getCartTotalQuantity()}</span>
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/wishlist" className="nav-link hover-effect">
                <FontAwesomeIcon icon={faHeart} className="icon-margin-right" />
                Wishlist
              </Link>
              <Link to="/profile" className="nav-link hover-effect">
                <FontAwesomeIcon icon={faUser} className="icon-margin-right" />
                Profile
              </Link>
              <Link to="/add-product" className="nav-link hover-effect">
                Add Product
              </Link>
              <button onClick={handleLogout} className="nav-link hover-effect">
                <FontAwesomeIcon icon={faSignOutAlt} className="icon-margin-right" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link hover-effect">
                <FontAwesomeIcon icon={faUser} className="icon-margin-right" />
                Login
              </Link>
              <Link to="/register" className="nav-link hover-effect">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div className={`search-container ${isMobileMenuOpen ? 'hidden' : ''}`}>
          <input type="text" className="search-input" placeholder="Search products..." />
          <button className="search-button pulse-effect">
            <FontAwesomeIcon icon={faSearch} />
          </button>
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
                {renderMobileCategoryGroups()}
                
                {/* Keep some original categories */}
                <div className="mobile-category-group">
                  <h4 className="mobile-category-header">Roast Level</h4>
                  <Link to="/category/light-roast" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Light Roast</Link>
                  <Link to="/category/medium-roast" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Medium Roast</Link>
                  <Link to="/category/dark-roast" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Dark Roast</Link>
                </div>
                
                <div className="mobile-category-group">
                  <h4 className="mobile-category-header">Brewing Methods</h4>
                  <Link to="/category/espresso" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Espresso Beans</Link>
                  <Link to="/category/french-press" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>French Press</Link>
                  <Link to="/category/drip-coffee" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Drip Coffee</Link>
                  <Link to="/category/cold-brew" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Cold Brew</Link>
                  <Link to="/category/turkish" className="mobile-dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Turkish Coffee</Link>
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
                <span className="cart-count">{getCartTotalQuantity()}</span>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <FontAwesomeIcon icon={faUser} className="icon-margin-right" />
                    Profile
                  </Link>
                  <Link to="/add-product" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    Add Product
                  </Link>
                  <button 
                    className="mobile-nav-link mobile-logout"
                    onClick={handleLogout}
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