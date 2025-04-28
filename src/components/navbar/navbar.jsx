import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faUser,
  faSignOutAlt,
  faHome,
  faBars,
  faTimes,
  faHeart,
  faCheckSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "./navbar.css";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartTotalQuantity } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
        </button>

        <Link to="/" className="navbar-logo">
          <span className="logo-text">Coffee Shop</span>
        </Link>

        <div className={`navbar-links desktop-links ${isMobileMenuOpen ? 'hidden' : ''}`}>
          <Link to="/" className="nav-link hover-effect">
            <FontAwesomeIcon icon={faHome} className="icon-margin-right" />
            Home
          </Link>

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

        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="mobile-menu-content">
            <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faHome} className="icon-margin-right" />
              Home
            </Link>
            <Link to="/cart" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              <FontAwesomeIcon icon={faShoppingCart} className="icon-margin-right" />
              Cart
              <span className="cart-count">{getCartTotalQuantity()}</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/wishlist" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Wishlist
                </Link>
                <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Profile
                </Link>
                <Link to="/add-product" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Add Product
                </Link>
                <button
                  className="mobile-nav-link mobile-logout"
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
