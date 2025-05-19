// src/components/manager/DeliveriesManager.jsx
import React, { useState, useEffect } from 'react'
import {
  fetchAllDeliveries,
  updateDeliveryStatus
} from '../../api/managerService'

export default function DeliveriesManager() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    fetchAllDeliveries()
      .then(setDeliveries)
      .catch(() => setError('Failed to load deliveries.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDeliveryStatus(id, newStatus)
      setDeliveries(ds =>
        ds.map(d => (d._id === id ? { ...d, status: newStatus } : d))
      )
    } catch {
      alert('Could not update delivery status.')
    }
  }

  if (loading) return <p>Loading deliveries...</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>
  if (deliveries.length === 0)
    return <p style={{ color: '#8B4513' }}>No deliveries found.</p>

  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #8B4513',
        borderRadius: 8,
        padding: 24,
        maxWidth: 1200,
        margin: '0 auto',
        fontFamily: 'Trebuchet MS, sans-serif'
      }}
    >
      <h2 style={{ color: '#8B4513', marginBottom: 16 }}>
        📦 Delivery Management
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}
      >
        {deliveries.map(d => (
          <div
            key={d._id}
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
            <p><strong>Delivery ID:</strong> {d._id}</p>
            <p><strong>Customer ID:</strong> {d.user?._id || 'Unknown'}</p>
            <p><strong>Product ID:</strong> {d.product?._id || 'Unknown'}</p>
            <p><strong>Quantity:</strong> {d.quantity}</p>
            <p>
              <strong>Total:</strong>{' '}
              {d.total.toFixed(2)} ₺
            </p>
            <p>
              <strong>Address:</strong>{' '}
              {d.address
                ? `${d.address.street}, ${d.address.city}, ${d.address.postalCode}`
                : 'N/A'}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <select
                value={d.status}
                onChange={e => handleStatusChange(d._id, e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              >
                <option value="pending">pending</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
