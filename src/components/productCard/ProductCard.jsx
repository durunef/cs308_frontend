import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart, 
  faCheck, 
  faEye,
  faHeart,
  faSpinner,
  faTag
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { API_URL } from '../../config';
import './ProductCard.css';

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  
  // Get the stock quantity from either field name convention
  const stockQuantity = 
    typeof product.quantityInStock === 'number' ? product.quantityInStock : 
    typeof product.quantity_in_stocks === 'number' ? product.quantity_in_stocks : 0;
  
  const isOutOfStock = stockQuantity <= 0;
  const isInWishlistState = isInWishlist(product._id);

  // Check if product is discounted - updated to match backend schema
  const hasDiscount = 
    (product.discount && product.discount > 0) ||
    (product.discountedPrice && product.discountedPrice < product.price);
  
  // Calculate discount percentage
  let discountPercentage = 0;
  if (hasDiscount) {
    if (product.discount) {
      // If discount percentage is directly available from backend
      discountPercentage = product.discount;
    } else if (product.discountedPrice && product.price) {
      // Calculate from price and discounted price
      discountPercentage = Math.round(((product.price - product.discountedPrice) / product.price) * 100);
    }
  }

  // Get discounted price (either from backend or calculate it)
  const discountedPrice = product.discountedPrice || 
    (hasDiscount ? product.price * (1 - product.discount / 100) : null);

  // Log stock info for debugging
  console.log('Product Card Stock:', {
    id: product._id,
    name: product.name,
    quantityInStock: product.quantityInStock,
    quantity_in_stocks: product.quantity_in_stocks,
    calculated: stockQuantity,
    isOutOfStock,
    hasDiscount,
    discountPercentage,
    discountedPrice
  });

  const navigateToProductInfo = () => {
    navigate(`/product/${product._id}`);
  };
  
  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Prevent navigation when clicking the button
    
    // Skip if out of stock, already in the process of adding, or already added
    if (isOutOfStock || isAddingToCart || addedToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      const result = await addToCart(product._id, 1);
      
      if (result.success) {
        setAddedToCart(true);
        
        // Reset the button after 2 seconds
        setTimeout(() => {
          setAddedToCart(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  const handleQuickView = (e) => {
    e.stopPropagation(); // Redundant but kept for clarity
    navigateToProductInfo();
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.info('Please login to manage your wishlist');
      navigate('/login');
      return;
    }

    setIsWishlistLoading(true);
    try {
      if (isInWishlistState) {
        const result = await removeFromWishlist(product._id);
        if (result.success) {
          toast.success('Removed from wishlist');
        } else {
          toast.error(result.error || 'Failed to remove from wishlist');
        }
      } else {
        const result = await addToWishlist(product._id);
        if (result.success) {
          toast.success('Added to wishlist');
        } else {
          toast.error(result.error || 'Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('An error occurred');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  return (
    <div className={`product-card ${hasDiscount ? 'discounted' : ''}`} onClick={navigateToProductInfo}>
      <div className="product-card-image-container">
        <img 
          src={product.image 
              ? (product.image.startsWith('/uploads') || product.image.startsWith('/images')
                 ? `${API_URL}${product.image}`
                 : product.image)
              : 'https://via.placeholder.com/300x300?text=No+Image'} 
          alt={product.name} 
          className="product-image"
        />
        
        {/* Stock Badge */}
        <div className="product-card-badge stock-badge">
          {isOutOfStock ? (
            <span className="out-of-stock-badge">Out of Stock</span>
          ) : (
            <span className="in-stock-badge">In Stock {stockQuantity > 0 && `(${stockQuantity})`}</span>
          )}
        </div>
        
        {/* Discount Badge - only show if product has discount */}
        {hasDiscount && discountPercentage > 0 && (
          <div className="discount-badge">
            <FontAwesomeIcon icon={faTag} />
            <span className="sale-text">SALE</span>
            <span>{discountPercentage}% OFF</span>
          </div>
        )}
        
        <div className="product-card-overlay">
          <button 
            className="quick-view-button"
            onClick={handleQuickView}
            aria-label="Quick view"
          >
            <FontAwesomeIcon icon={faEye} />
            <span>Quick View</span>
          </button>
        </div>
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-card-footer">
          {/* Price Display - show original and discounted price if available */}
          <div className="product-price-container">
            {hasDiscount && product.price ? (
              <>
                <span className="original-price">${product.price.toFixed(2)}</span>
                <span className="discount-price">${discountedPrice.toFixed(2)}</span>
              </>
            ) : product.price ? (
              <p className="product-price">${product.price.toFixed(2)}</p>
            ) : (
              <p className="product-price">Price not set</p>
            )}
          </div>
          
          <div className="product-card-actions">
            <button 
              className={`wishlist-button ${isInWishlistState ? 'in-wishlist' : ''}`}
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
              aria-label={isInWishlistState ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlistLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faHeart} />
              )}
            </button>

            <button 
              className={`add-to-cart-button ${addedToCart ? 'added' : ''} ${isOutOfStock ? 'disabled' : ''}`} 
              onClick={handleAddToCart}
              disabled={isAddingToCart || isOutOfStock}
            >
              {isAddingToCart ? (
                <span className="loading-spinner-small"></span>
              ) : addedToCart ? (
                <>
                  <FontAwesomeIcon icon={faCheck} />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faShoppingCart} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;