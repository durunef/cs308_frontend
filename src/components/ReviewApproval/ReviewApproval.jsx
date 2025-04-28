import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faSpinner, faCheckCircle, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './ReviewApproval.css';

function ReviewApproval() {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Fetch pending reviews on component mount
    fetchPendingReviews();
  }, [isAuthenticated, navigate]);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/v1/reviews/pending');
      if (response.data && response.data.status === 'success') {
        setPendingReviews(response.data.data.pendingReviews || []);
      }
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
      setError('Failed to load pending reviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      setSuccess(null);
      setError(null);
      const response = await axios.put(`/api/v1/reviews/${reviewId}/approve`);
      if (response.data && response.data.status === 'success') {
        // Remove the approved review from the list
        setPendingReviews(pendingReviews.filter(review => review._id !== reviewId));
        setSuccess('Review approved successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error approving review:', err);
      setError('Failed to approve review. Please try again.');
    }
  };

  // Function to render star ratings
  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} className="star-filled" />);
      } else {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} className="star-empty" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="review-approval-container loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading pending reviews...</p>
      </div>
    );
  }

  return (
    <div className="review-approval-container">
      <h1>Review Approval</h1>
      
      <p className="approval-description">
        Bu page normalde adminpage de olacak fakat demo için bütün userlara açık. Admin olarak giriş yapmayan kişiler onaylarken 403 forbidden errorü alıyor. 
      </p>
      
      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchPendingReviews}>Try Again</button>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <FontAwesomeIcon icon={faThumbsUp} /> {success}
        </div>
      )}
      
      {pendingReviews.length === 0 ? (
        <div className="no-pending-reviews">
          <h3>No Pending Reviews</h3>
          <p>There are currently no reviews waiting for approval.</p>
        </div>
      ) : (
        <div className="pending-reviews-list">
          {pendingReviews.map(review => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <h3>Product: {review.product?.name || 'Unknown Product'}</h3>
                <p className="review-user">Reviewed by: {review.user?.name || review.user?.email || 'Anonymous'}</p>
              </div>
              
              <div className="review-content">
                <div className="review-rating">
                  {renderStarRating(review.rating)}
                  <span className="rating-number">({review.rating}/5)</span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
              
              <div className="review-actions">
                <button 
                  className="approve-button"
                  onClick={() => handleApproveReview(review._id)}
                >
                  <FontAwesomeIcon icon={faCheckCircle} /> Approve Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewApproval; 