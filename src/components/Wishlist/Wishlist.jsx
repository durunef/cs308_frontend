import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTrash, 
  faCartPlus, 
  faHeart, 
  faArrowLeft 
} from "@fortawesome/free-solid-svg-icons";
import mockData from "../../data/mockData.json";
import "./Wishlist.css";

function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching wishlist data using mockData
    // In a real app, you would fetch the user's wishlist items
    // For demo purposes, we'll randomly select some items from mockData
    setTimeout(() => {
      // Select random items from mockData to simulate a wishlist
      // In a real app, this would come from your backend or local storage
      const randomItems = [...mockData]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      // Add inStock property based on stock value
      const wishlistData = randomItems.map(item => ({
        ...item,
        inStock: item.stock > 0
      }));
      
      setWishlistItems(wishlistData);
      setIsLoading(false);
    }, 600);
  }, []);

  const removeFromWishlist = (id) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== id));
  };

  const addToCart = (id) => {
    // In a real application, you would add this item to the cart
    console.log(`Added item ${id} to cart`);
    // Optionally, you could remove it from wishlist after adding to cart
    // removeFromWishlist(id);
  };

  if (isLoading) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-loading">
          <div className="loading-spinner"></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1><FontAwesomeIcon icon={faHeart} className="wishlist-icon" /> My Wishlist</h1>
        <Link to="/" className="back-to-shopping">
          <FontAwesomeIcon icon={faArrowLeft} /> Continue Shopping
        </Link>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <div className="empty-wishlist-icon">
            <FontAwesomeIcon icon={faHeart} />
          </div>
          <h2>Your wishlist is empty</h2>
          <p>Add items you love to your wishlist. Review them anytime and easily move them to the cart.</p>
          <Link to="/products" className="browse-products-btn">Browse Products</Link>
        </div>
      ) : (
        <>
          <div className="wishlist-count">
            {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} in your wishlist
          </div>
          
          <div className="wishlist-items">
            {wishlistItems.map((item) => (
              <div key={item.id} className="wishlist-item">
                <div className="wishlist-item-image">
                  <img src={item.image || "https://via.placeholder.com/150"} alt={item.name} />
                </div>
                <div className="wishlist-item-details">
                  <h3>{item.name}</h3>
                  <div className="wishlist-item-price">${item.price.toFixed(2)}</div>
                  <p className="wishlist-item-description">{item.description}</p>
                  <div className={`wishlist-item-stock ${item.inStock ? 'in-stock' : 'out-of-stock'}`}>
                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>
                <div className="wishlist-item-actions">
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(item.id)}
                    disabled={!item.inStock}
                  >
                    <FontAwesomeIcon icon={faCartPlus} />
                    <span>Add to Cart</span>
                  </button>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="wishlist-footer">
            <button className="clear-wishlist-btn" onClick={() => setWishlistItems([])}>
              Clear Wishlist
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Wishlist;