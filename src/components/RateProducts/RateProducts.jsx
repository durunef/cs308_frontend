import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faStarHalfAlt,
  faSpinner, 
  faExclamationTriangle, 
  faArrowLeft,
  faCheck,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { getOrderDetails, submitProductRating, submitProductComment } from '../../api/orderService';
import './RateProducts.css';

function RateProducts() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productRatings, setProductRatings] = useState({});
  const [productComments, setProductComments] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [success, setSuccess] = useState({});
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await getOrderDetails(orderId);
        
        if (response.status === 'success') {
          // Only allow rating products from delivered orders
          if (response.data.status !== 'delivered') {
            setError('You can only rate products from delivered orders.');
            setLoading(false);
            return;
          }
          
          setOrder(response.data);
          
          // Initialize ratings and comments
          const initialRatings = {};
          const initialComments = {};
          response.data.items.forEach(item => {
            initialRatings[item.product._id] = 0;
            initialComments[item.product._id] = '';
          });
          
          setProductRatings(initialRatings);
          setProductComments(initialComments);
        } else {
          throw new Error('Failed to fetch order details');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('We could not find your order. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);
  
  const handleRatingChange = (productId, rating) => {
    setProductRatings(prev => ({
      ...prev,
      [productId]: rating
    }));
  };
  
  const handleCommentChange = (productId, comment) => {
    setProductComments(prev => ({
      ...prev,
      [productId]: comment
    }));
  };
  
  const submitRating = async (productId) => {
    try {
      setSubmitting(prev => ({ ...prev, [productId]: true }));
      
      const rating = productRatings[productId];
      if (rating <= 0) {
        alert('Please select a rating before submitting.');
        setSubmitting(prev => ({ ...prev, [productId]: false }));
        return;
      }
      
      const response = await submitProductRating(productId, rating);
      
      if (response.status === 'success') {
        setSuccess(prev => ({ 
          ...prev, 
          [productId]: {
            ...prev[productId],
            rating: true
          } 
        }));
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(prev => ({ ...prev, [productId]: false }));
    }
  };
  
  const submitComment = async (productId) => {
    try {
      setSubmitting(prev => ({ ...prev, [productId]: true }));
      
      const comment = productComments[productId];
      if (!comment.trim()) {
        alert('Please enter a comment before submitting.');
        setSubmitting(prev => ({ ...prev, [productId]: false }));
        return;
      }
      
      const response = await submitProductComment(productId, comment);
      
      if (response.status === 'success') {
        setSuccess(prev => ({ 
          ...prev, 
          [productId]: {
            ...prev[productId],
            comment: true
          } 
        }));
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(prev => ({ ...prev, [productId]: false }));
    }
  };
  
  const renderStarRating = (productId) => {
    const rating = productRatings[productId];
    
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star-button ${star <= rating ? 'active' : ''}`}
            onClick={() => handleRatingChange(productId, star)}
            aria-label={`Rate ${star} out of 5 stars`}
          >
            <FontAwesomeIcon 
              icon={star <= rating ? faStar : farStar} 
              className="star-icon"
            />
          </button>
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="rate-products-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
          <p>Loading your order details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="rate-products-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>{error || 'Order Not Found'}</h2>
          <p>We could not retrieve your order information.</p>
          <Link to="/order-history" className="back-button">
            <FontAwesomeIcon icon={faArrowLeft} /> Return to Order History
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rate-products-container">
      <div className="rate-products-header">
        <h1>Rate Your Purchase</h1>
        <p>Order #{order.orderNumber || orderId}</p>
      </div>
      
      <div className="rate-products-instructions">
        <p>Please rate the products you purchased and let us know your thoughts. Your feedback helps other customers make informed decisions.</p>
        <div className="instructions-notes">
          <div className="instruction-note">
            <FontAwesomeIcon icon={faStar} className="note-icon" />
            <p>Ratings are visible immediately on the product page.</p>
          </div>
          <div className="instruction-note">
            <FontAwesomeIcon icon={faComment} className="note-icon" />
            <p>Comments will be reviewed by our team before being published.</p>
          </div>
        </div>
      </div>
      
      <div className="product-rating-list">
        {order.items.map((item) => (
          <div key={item.product._id} className="product-rating-card">
            <div className="product-info">
              <div className="product-image-container">
                <img 
                  src={item.product.imageUrl || '/img/product-placeholder.jpg'} 
                  alt={item.product.name} 
                  className="product-image" 
                />
              </div>
              <div className="product-details">
                <h3>{item.product.name}</h3>
                <p className="product-description">{item.product.description || 'No description available.'}</p>
                <p className="purchase-details">Purchased: {item.quantity} item(s)</p>
              </div>
            </div>
            
            <div className="rating-section">
              <div className="rating-container">
                <h4>Rate this product</h4>
                {renderStarRating(item.product._id)}
                <button 
                  className="submit-rating-button"
                  onClick={() => submitRating(item.product._id)}
                  disabled={submitting[item.product._id] || success[item.product._id]?.rating}
                >
                  {submitting[item.product._id] ? (
                    <><FontAwesomeIcon icon={faSpinner} spin /> Submitting...</>
                  ) : success[item.product._id]?.rating ? (
                    <><FontAwesomeIcon icon={faCheck} /> Rating Submitted</>
                  ) : (
                    'Submit Rating'
                  )}
                </button>
              </div>
              
              <div className="comment-container">
                <h4>Share your experience</h4>
                <textarea
                  placeholder="Write your comment here (optional)"
                  value={productComments[item.product._id]}
                  onChange={(e) => handleCommentChange(item.product._id, e.target.value)}
                  disabled={success[item.product._id]?.comment}
                  className="comment-textarea"
                ></textarea>
                <div className="comment-note">
                  <p>Your comment will be reviewed before it appears on the site.</p>
                </div>
                <button 
                  className="submit-comment-button"
                  onClick={() => submitComment(item.product._id)}
                  disabled={submitting[item.product._id] || success[item.product._id]?.comment}
                >
                  {submitting[item.product._id] ? (
                    <><FontAwesomeIcon icon={faSpinner} spin /> Submitting...</>
                  ) : success[item.product._id]?.comment ? (
                    <><FontAwesomeIcon icon={faCheck} /> Comment Submitted</>
                  ) : (
                    'Submit Comment'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="rating-actions">
        <Link to={`/order-confirmation/${orderId}`} className="back-to-order-button">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Order
        </Link>
      </div>
    </div>
  );
}

export default RateProducts; 