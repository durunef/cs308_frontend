// src/components/manager/CommentsManager.jsx
import React, { useState, useEffect } from 'react'
import {
  fetchAllReviews,
  approveReview,
  rejectReview
} from '../../api/managerService'

export default function CommentsManager() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetchAllReviews()
      .then(data => setReviews(data))
      .catch(() => setError('Failed to load reviews.'))
      .finally(() => setLoading(false))
  }, [])

  const handle = async (id, action) => {
    try {
      if (action === 'approve') {
        await approveReview(id)
      } else {
        await rejectReview(id)
      }
      setReviews(rs => rs.filter(r => r._id !== id))
    } catch {
      alert('Could not update review.')
    }
  }

  if (loading) return <p>Loading reviews…</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>
  if (reviews.length === 0)
    return <p style={{ color: '#8B4513' }}>No reviews to moderate.</p>

  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #8B4513',
        borderRadius: 8,
        padding: 24,
        maxWidth: 1000,
        margin: '0 auto',
        fontFamily: 'Trebuchet MS, sans-serif'
      }}
    >
      <h2 style={{ color: '#8B4513', marginBottom: 16 }}>
        📝 Review Approvals
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}
      >
        {reviews.map(r => (
          <div
            key={r._id}
            style={{
              border: '1px solid #8B4513',
              borderRadius: 6,
              padding: 16,
              background: '#fdf8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <p><strong>Review ID:</strong> {r._id}</p>
            <p>
              <strong>Product:</strong>{' '}
              {r.product?.name || r.product?._id || 'Unknown'}
            </p>
            <p>
              <strong>User:</strong>{' '}
              {r.user?.name || r.user?._id || 'Unknown'}
            </p>
            <p><strong>Rating:</strong> {r.rating} ⭐</p>
            <p>
              <strong>Comment:</strong>
              <br />
              <em>{r.comment}</em>
            </p>
            <p>
              <strong>Order Status:</strong> delivered
            </p>
            <p>
              <strong>Approved:</strong>{' '}
              {r.approved ? '✅ yes' : '❌ no'}
            </p>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={() => handle(r._id, 'approve')}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Approve
              </button>
              <button
                onClick={() => handle(r._id, 'reject')}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: '#F44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
