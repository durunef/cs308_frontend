// src/components/ProductReview/ProductReview.jsx
import React, { useState } from 'react'
import {
  faStar as fasStar,
  faInfoCircle,
  faExclamationCircle,
  faCheckCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons'
import { submitReview } from '../../api/productService'
import './ProductReview.css'

export default function ProductReview({ productId, orderStatus, onReviewSubmitted }) {
  const [rating, setRating]       = useState(0)
  const [hoverRating, setHover]   = useState(0)
  const [comment, setComment]     = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError]         = useState(null)
  const [success, setSuccess]     = useState(false)

  // Only allow reviews if order has been delivered
  const canReview = orderStatus?.toLowerCase() === 'delivered'

  const handleSubmit = async e => {
    e.preventDefault()
    if (rating < 1) {
      setError('Please select a rating.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // POST to backend
      const newReview = await submitReview(productId, { rating, comment })

      setSuccess(true)
      onReviewSubmitted?.(newReview)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to submit review. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!canReview) {
    return (
      <div className="review-notice">
        <FontAwesomeIcon icon={faInfoCircle} />
        <span>Products can only be reviewed after delivery.</span>
      </div>
    )
  }

  if (success) {
    return (
      <div className="review-success">
        <FontAwesomeIcon icon={faCheckCircle} />
        <span>Thank you! Your review has been submitted.</span>
      </div>
    )
  }

  return (
    <form className="product-review" onSubmit={handleSubmit}>
      <div
        className="star-rating"
        onMouseLeave={() => setHover(0)}
      >
        {[1,2,3,4,5].map(v => (
          <span
            key={v}
            onMouseEnter={() => setHover(v)}
            onClick={() => setRating(v)}
          >
            <FontAwesomeIcon
              icon={(hoverRating||rating) >= v ? fasStar : farStar}
              className={(hoverRating||rating) >= v ? 'filled' : 'empty'}
            />
          </span>
        ))}
        <small>{rating ? `${rating}/5` : 'Select rating'}</small>
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Your comment (optional)"
      />

      {error && (
        <div className="review-error">
          <FontAwesomeIcon icon={faExclamationCircle} />
          <span>{error}</span>
        </div>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? <><FontAwesomeIcon icon={faSpinner} spin /> Submitting…</>
          : 'Submit Review'}
      </button>
    </form>
  )
}
