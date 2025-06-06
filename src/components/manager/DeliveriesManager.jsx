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

  if (loading) return <p>Loading deliveries…</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>
  if (deliveries.length === 0)
    return <p style={{ color: '#8B4513' }}>No deliveries found.</p>

  return (
    <div style={{
        background: '#fff',
        border: '2px solid #8B4513',
        borderRadius: 8,
        padding: 24,
        maxWidth: 1200,
        margin: '0 auto',
        fontFamily: 'Trebuchet MS, sans-serif'
      }}>
      <h2 style={{ color: '#8B4513', marginBottom: 16 }}>
        📦 Delivery Management
      </h2>

      <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}>
        {deliveries.map(d => (
          <div key={d._id} style={{
              border: '1px solid #8B4513',
              borderRadius: 6,
              padding: 16,
              background: '#fdf8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
            <p><strong>Delivery ID:</strong> {d._id}</p>
            <p><strong>Customer:</strong> {d.user?.name || 'Unknown'}</p>
            <p>
              <strong>Product:</strong>{' '}
              {d.items?.map(item => item.product?.name || 'Unknown').join(', ') || 'Unknown'}
            </p>
            <p>
              <strong>Quantities:</strong>{' '}
              {d.items?.map(item => `${item.quantity}`).join(', ') || '–'}
            </p>
            <p><strong>Total:</strong> {d.total.toFixed(2)} ₺</p>
            <p>
              <strong>Address:</strong>{' '}
              {d.shippingAddress
                ? `${d.shippingAddress.street}, ${d.shippingAddress.city}, ${d.shippingAddress.postalCode}`
                : 'N/A'}
            </p>
            <p><strong>Current Status:</strong> {d.status}</p>
            <p>
              <strong>Update Status:</strong>{' '}
              <select
                value={d.status}
                onChange={e => handleStatusChange(d._id, e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              >
                <option value="processing">processing</option>
                <option value="in-transit">in-transit</option>
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
