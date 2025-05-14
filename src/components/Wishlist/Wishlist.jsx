import React, { useEffect } from 'react';
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
import './Wishlist.css';

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  const handleRemoveFromWishlist = async (productId) => {
    const result = await removeFromWishlist(productId);
    if (result.success) {
      toast.success('Item removed from wishlist');
    } else {
      toast.error(result.error || 'Failed to remove item');
    }
  };

  const handleToggleNotification = async (productId, currentNotifyStatus) => {
    const result = await updateNotificationPreference(productId, !currentNotifyStatus);
    if (result.success) {
      toast.success(`Notifications ${!currentNotifyStatus ? 'enabled' : 'disabled'} for this item`);
    } else {
      toast.error(result.error || 'Failed to update notification preference');
    }
  };

  const handleAddToCart = async (product) => {
    const result = await addToCart(product._id, 1);
    if (result.success) {
      toast.success('Added to cart');
    } else {
      toast.error(result.error || 'Failed to add to cart');
    }
  };

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
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-error">
          <p>{error}</p>
          <button onClick={fetchWishlist} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!wishlistItems.length) {
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
          <div key={item._id} className="wishlist-item">
            <div className="wishlist-item-image">
              <img 
                src={item.product.image || 'https://via.placeholder.com/150x150?text=No+Image'} 
                alt={item.product.name} 
              />
            </div>
            
            <div className="wishlist-item-details">
              <h3>{item.product.name}</h3>
              <p className="wishlist-item-price">${item.product.price.toFixed(2)}</p>
              <p className="wishlist-item-description">{item.product.description}</p>
            </div>
            
            <div className="wishlist-item-actions">
              <button 
                className="add-to-cart-button"
                onClick={() => handleAddToCart(item.product)}
              >
                <FontAwesomeIcon icon={faShoppingCart} />
                Add to Cart
              </button>
              
              <button 
                className={`notification-button ${item.notifyOnDiscount ? 'active' : ''}`}
                onClick={() => handleToggleNotification(item.product._id, item.notifyOnDiscount)}
                title={item.notifyOnDiscount ? 'Disable notifications' : 'Enable notifications'}
              >
                <FontAwesomeIcon icon={item.notifyOnDiscount ? faBell : faBellSlash} />
                {item.notifyOnDiscount ? 'Notifications On' : 'Notifications Off'}
              </button>
              
              <button 
                className="remove-button"
                onClick={() => handleRemoveFromWishlist(item.product._id)}
              >
                <FontAwesomeIcon icon={faTrash} />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wishlist; 