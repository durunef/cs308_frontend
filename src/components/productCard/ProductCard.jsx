import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };
  
  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    // Skip if already in the process of adding
    if (isAddingToCart || addedToCart) return;
    
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

  return (
    <div className="product-card" onClick={handleCardClick}>
      <img src={product.image} alt={product.name} className="product-image" />
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-card-footer">
          <p className="product-price">${product.price.toFixed(2)}</p>
          <button 
            className={`add-to-cart-button ${addedToCart ? 'added' : ''}`} 
            onClick={handleAddToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <span className="loading-spinner-small"></span>
            ) : addedToCart ? (
              <FontAwesomeIcon icon={faCheck} />
            ) : (
              <FontAwesomeIcon icon={faShoppingCart} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
