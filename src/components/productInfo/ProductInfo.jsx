import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faHeart, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import axios from '../../api/axios';
import './ProductInfo.css';

function ProductInfo() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      console.log('Fetching product with ID:', productId);

      if (!productId) {
        console.error('No product ID provided');
        setError('Product ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Making API request to:', `/api/products/${productId}`);
        const response = await axios.get(`/api/products/${productId}`);
        
        console.log('API Response:', response.data);
        
        if (response.data.status === 'success') {
          setProduct(response.data.data.product);
        } else {
          throw new Error('Product not found');
        }
      } catch (err) {
        console.error('Error details:', {
          message: err.message,
          response: err.response,
          request: err.request
        });
        setError('Failed to load product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleCommentSubmit = () => {
    console.log('Comment submitted:', comment);
  };

  if (loading) {
    return (
      <div className="product-info-page">
        <div className="loading-spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-info-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-info-page">
        <div className="error-message">Product not found</div>
      </div>
    );
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
          <p className="product-price">${product.price.toFixed(2)} {product.currency}</p>
          <p className="product-stock">
            {product.quantityInStock > 0 ? (
              <span className="in-stock">In Stock ({product.quantityInStock} available)</span>
            ) : (
              <span className="out-of-stock">Out of Stock</span>
            )}
          </p>
          <p className="product-warranty">
            Warranty Status: {product.warrantyStatus} <br />
            Distributor: {product.distributorInfo}
          </p>
          <button className="add-to-cart-button">
            <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
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
            <tr>
              <td>Category ID</td>
              <td>{product.category}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* User Ratings & Reviews Section */}
      <div className="ratings-reviews-section">
        <div className="rating-summary">
          <h3>Average Rating: 4.5</h3>
          <div className="rating-bars">
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
          <div className="review">
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
    </div>
  );
}

export default ProductInfo;
