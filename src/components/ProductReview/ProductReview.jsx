// src/components/ProductReview/ProductReview.jsx
import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faStar as fasStar,
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons'

import { submitProductReview } from '../../api/orderService'
import './ProductReview.css'

export default function ProductReview({ product, orderStatus, onReviewSubmitted }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [reviewId, setReviewId] = useState(null)

  // Only allow reviews once delivered
  const canReview = orderStatus?.toLowerCase() === 'delivered'

  const handleRatingClick = value => setRating(value)
  const handleRatingHover = value => setHoverRating(value)
  const handleRatingLeave = () => setHoverRating(0)
  const handleCommentChange = e => setComment(e.target.value)

  const handleSubmit = async e => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating before submitting.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await submitProductReview(product._id, rating, comment)
      console.log('Review submission response:', response)

      if (response.status === 'success') {
        const newReview = response.data.review || response.data
        setReviewId(newReview._id)
        setSuccess(true)
        setShowForm(false)
        onReviewSubmitted?.(product._id, rating, comment, newReview._id)
      } else {
        throw new Error(response.message || 'Failed to submit review.')
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleForm = () => {
    setShowForm(show => !show)
    if (!showForm) {
      // reset when opening
      setRating(0)
      setComment('')
      setError(null)
      setSuccess(false)
    }
  }

  if (success) {
    return (
      <div className="review-success-message">
        <FontAwesomeIcon icon={faCheckCircle} />
        <p>
          Thank you for your review! Your rating has been
          submitted{comment ? ', and your comment will be visible after approval.' : '.'}
        </p>
        {reviewId && (
          <p className="review-id-info">
            <small>Review ID: {reviewId}</small>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="product-review-container">
      {!canReview && (
        <div className="review-notice">
          <FontAwesomeIcon icon={faInfoCircle} />
          <p>Products can only be reviewed after they have been delivered.</p>
        </div>
      )}

      {canReview && !showForm && (
        <button onClick={toggleForm} className="review-button">
          Rate & Review
        </button>
      )}

      {canReview && showForm && (
        <div className="review-form">
          <h4>Rate this product</h4>
          <div className="star-rating" onMouseLeave={handleRatingLeave}>
            {[1, 2, 3, 4, 5].map(value => (
              <span
                key={value}
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => handleRatingHover(value)}
                className="star-container"
              >
                <FontAwesomeIcon
                  icon={(hoverRating || rating) >= value ? fasStar : farStar}
                  className={(hoverRating || rating) >= value ? 'filled' : 'empty'}
                />
              </span>
            ))}
            <span className="rating-text">
              {rating > 0 ? `${rating} out of 5 stars` : 'Select a rating'}
            </span>
          </div>

          <div className="review-comment">
            <label htmlFor="comment">Your Review (optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={handleCommentChange}
              placeholder="Share your experience with this product..."
              rows={4}
            />
            <div className="review-notes">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>
                Ratings are submitted immediately. Comments will be visible after approval.
              </span>
            </div>
          </div>

          {error && (
            <div className="review-error">
              <FontAwesomeIcon icon={faExclamationCircle} />
              <span>{error}</span>
            </div>
          )}

          <div className="review-actions">
            <button
              type="button"
              onClick={handleSubmit}
              className="submit-review"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </button>
            <button type="button" onClick={toggleForm} className="cancel-review">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
