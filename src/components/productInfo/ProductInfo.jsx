import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faHeart, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import './ProductInfo.css';

function ProductInfo({ products }) {
  const { productId } = useParams();
  const product = products.find(p => p.id === parseInt(productId));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleCommentSubmit = () => {
    console.log('Comment submitted:', comment);
  };

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="product-info-page">
      {/* Hero Section */}
      <div className="hero-section">
        <img src={product.image} alt={product.name} className="product-image" />
        <div className="product-details">
          <h1 className="product-title">{product.name}</h1>
          <p className="product-type">{product.type} - {product.subtype}</p>
          <p className="product-description">{product.description}</p>
          <p className="product-price">${product.price.toFixed(2)}</p>
          <p className="product-stock">
            {product.stock > 0 ? (
              <span className="in-stock">In Stock</span>
            ) : (
              <span className="out-of-stock">Out of Stock</span>
            )}
          </p>
          <p className="product-warranty">
            Warranty: {product.warrantyStatus} <br />
            Distributor: {product.distributorInfo}
          </p>
          <button className="add-to-cart-button">
            <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="cart-shopping" className="svg-inline--fa fa-cart-shopping" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path fill="currentColor" d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"></path>
            </svg> Add to Cart
          </button>
        </div>
      </div>

      {/* Product Specifications Section */}
      <div className="product-specs-section">
        <h3>Product Specifications</h3>
        <table className="specs-table">
          <tbody>
            <tr>
              <td>Model</td>
              <td>{product.model}</td>
            </tr>
            <tr>
              <td>Serial Number</td>
              <td>{product.serialNumber}</td>
            </tr>
            <tr>
              <td>Type</td>
              <td>{product.type}</td>
            </tr>
            <tr>
              <td>Subtype</td>
              <td>{product.subtype}</td>
            </tr>
            {/* Add more specifications as needed */}
          </tbody>
        </table>
      </div>

      {/* User Ratings & Reviews Section */}
      <div className="ratings-reviews-section">
        <div className="rating-summary">
          <h3>Average Rating: 4.5</h3>
          <div className="rating-bars">
            {/* Example bar chart */}
            <div className="rating-bar">
              <span>5 stars</span>
              <div className="bar" style={{ width: '60%' }}></div>
            </div>
            <div className="rating-bar">
              <span>4 stars</span>
              <div className="bar" style={{ width: '30%' }}></div>
            </div>
          </div>
        </div>
        <div className="user-reviews">
          <h3>User Reviews</h3>
          {/* Example review */}
          <div className="review">
            <img src="/path/to/profile.jpg" alt="User" className="user-profile" />
            <div className="review-content">
              <h4>User Name</h4>
              <div className="user-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <FontAwesomeIcon key={star} icon={faStar} className="star-icon filled" />
                ))}
              </div>
              <p className="review-text">This is a great product!</p>
              <p className="review-date">Purchased on: 2023-01-01</p>
            </div>
          </div>
          <button className="leave-review-button" disabled>
            Leave a Review
          </button>
        </div>
      </div>

      {/* Similar Products Section */}
      <div className="similar-products-section">
        <h3>Similar Products</h3>
        <div className="product-carousel">
          {/* Example product card */}
          <div className="similar-product-card">
            <img src="/path/to/similar-product.jpg" alt="Similar Product" />
            <p>Product Name</p>
            <p>$19.99</p>
            <button className="quick-add-to-cart-button">
              <FontAwesomeIcon icon={faShoppingCart} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductInfo;
