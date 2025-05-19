import React, { useState, useEffect } from 'react'
import { fetchAllInvoices } from '../../api/managerService'

export default function InvoicesManager() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetchAllInvoices()
      .then(data => setInvoices(data))
      .catch(() => setError('Failed to load invoices.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading invoices...</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>
  if (invoices.length === 0)
    return <p style={{ color: '#8B4513' }}>No invoices found.</p>

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
        📃 Invoice Management
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}
      >
        {invoices.map(inv => (
          <div
            key={inv._id}
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
            <p><strong>Invoice ID:</strong> {inv._id}</p>

            <p>
              <strong>Customer:</strong>{' '}
              {inv.user?.name
                ? `${inv.user.name} (${inv.user._id})`
                : inv.user?._id || 'Unknown'}
            </p>

            <div>
              <strong>Items:</strong>
              <ul style={{ paddingLeft: '1.2rem', margin: '4px 0' }}>
                {Array.isArray(inv.items) && inv.items.length > 0
                  ? inv.items.map((it, i) => (
                      <li key={i}>
                        {it.product?.name || it.product?._id || '—'} &times;{' '}
                        {it.quantity} @ {it.priceAtPurchase.toFixed(2)} ₺
                      </li>
                    ))
                  : <li>No items</li>}
              </ul>
            </div>

            <p>
              <strong>Total:</strong> {inv.total.toFixed(2)} ₺
            </p>

            <p>
              <strong>Shipping:</strong>{' '}
              {inv.shippingAddress
                ? `${inv.shippingAddress.street}, ${inv.shippingAddress.city}, ${inv.shippingAddress.postalCode}`
                : 'N/A'}
            </p>

            <p>
              <strong>Status:</strong> {inv.status || 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}