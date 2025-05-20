import React, { useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faBell, 
  faBellSlash,
  faShoppingCart,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { API_URL } from '../../config';
import './Wishlist.css';

// Memoized WishlistItem component
const WishlistItem = memo(({ item, onRemove, onToggleNotification, onAddToCart, onProductClick }) => {
  // Check if we have the necessary product data
  if (!item?.productId) {
    console.warn('Invalid wishlist item:', item);
    return null;
  }

  const product = item.productId; // The product data is nested in productId

  return (
    <div className="wishlist-item">
      <div className="wishlist-item-image">
        <img 
          src={product.image ? `${API_URL}${product.image}` : 'https://via.placeholder.com/150x150?text=No+Image'} 
          alt={product.name || 'Product'} 
          onClick={() => onProductClick(product._id)}
          style={{ cursor: 'pointer' }}
        />
      </div>
      
      <div className="wishlist-item-details">
        <h3 
          onClick={() => onProductClick(product._id)}
          style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
          className="product-name-link"
        >
          {product.name || 'Unnamed Product'}
        </h3>
        <p className="wishlist-item-price">
          ${(product.price || 0).toFixed(2)}
        </p>
        <p className="wishlist-item-description">
          {product.description || 'No description available'}
        </p>
      </div>
      
      <div className="wishlist-item-actions">
        <button 
          className="add-to-cart-button"
          onClick={() => onAddToCart(product)}
        >
          <FontAwesomeIcon icon={faShoppingCart} />
          Add to Cart
        </button>
        
        <button 
          className={`notification-button ${item.notifyOnDiscount ? 'active' : ''}`}
          onClick={() => onToggleNotification(product._id, item.notifyOnDiscount)}
          title={item.notifyOnDiscount ? 'Disable notifications' : 'Enable notifications'}
        >
          <FontAwesomeIcon icon={item.notifyOnDiscount ? faBell : faBellSlash} />
          {item.notifyOnDiscount ? 'Notifications On' : 'Notifications Off'}
        </button>
        
        <button 
          className="remove-button"
          onClick={() => onRemove(product._id)}
        >
          <FontAwesomeIcon icon={faTrash} />
          Remove
        </button>
      </div>
    </div>
  );
});

function Wishlist() {
  const navigate = useNavigate();
  const { 
    wishlistItems, 
    isLoading, 
    error, 
    fetchWishlist, 
    removeFromWishlist,
    updateNotificationPreference 
  } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Memoize the fetch callback
  const fetchWishlistData = useCallback(() => {
    if (isAuthenticated) {
      fetchWishlist(true);
    }
  }, [isAuthenticated, fetchWishlist]);

  // Fetch on mount and when authentication changes
  useEffect(() => {
    fetchWishlistData();
  }, [fetchWishlistData, isAuthenticated]);

  // Add a debug effect to monitor wishlist items
  useEffect(() => {
    console.log('Wishlist items updated:', wishlistItems);
  }, [wishlistItems]);

  const handleRemoveFromWishlist = useCallback(async (productId) => {
    const result = await removeFromWishlist(productId);
    if (result.success) {
      toast.success('Item removed from wishlist');
      // Force a refresh of the wishlist
      fetchWishlistData();
    } else {
      toast.error(result.error || 'Failed to remove item');
    }
  }, [removeFromWishlist, fetchWishlistData]);

  const handleToggleNotification = useCallback(async (productId, currentNotifyStatus) => {
    const result = await updateNotificationPreference(productId, !currentNotifyStatus);
    if (result.success) {
      toast.success(`Notifications ${!currentNotifyStatus ? 'enabled' : 'disabled'} for this item`);
      // Force a refresh of the wishlist
      fetchWishlistData();
    } else {
      toast.error(result.error || 'Failed to update notification preference');
    }
  }, [updateNotificationPreference, fetchWishlistData]);

  const handleAddToCart = useCallback(async (product) => {
    const result = await addToCart(product._id, 1);
    if (result.success) {
      toast.success('Added to cart');
    } else {
      toast.error(result.error || 'Failed to add to cart');
    }
  }, [addToCart]);

  const handleProductClick = useCallback((productId) => {
    navigate(`/product/${productId}`);
  }, [navigate]);

  if (!isAuthenticated) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-empty">
          <h2>Please log in to view your wishlist</h2>
          <button onClick={() => navigate('/login')} className="login-button">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-loading">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-error">
          <p>Error: {error}</p>
          <button onClick={fetchWishlistData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-empty">
          <h2>Your wishlist is empty</h2>
          <p>Start adding items to your wishlist to see them here!</p>
          <button onClick={() => navigate('/')} className="continue-shopping-button">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <h1>My Wishlist</h1>
      <div className="wishlist-items">
        {wishlistItems.map((item) => (
          <WishlistItem
            key={item._id}
            item={item}
            onRemove={handleRemoveFromWishlist}
            onToggleNotification={handleToggleNotification}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClick}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(Wishlist); 