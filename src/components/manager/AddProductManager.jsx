// src/components/manager/AddProductManager.jsx
import React, { useState, useEffect } from 'react'
import { fetchAllCategories, createProduct } from '../../api/managerService'

export default function AddProductManager({ onSuccess }) {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    model: '',
    serialNumber: '',
    description: '',
    price: '',
    quantityInStock: '',
    currency: '₺',
    warrantyStatus: '',
    distributorInfo: '',
    type: '',
    subtype: '',
    category: ''
  })
  const [error, setError] = useState('')

  // Load categories once
  useEffect(() => {
    fetchAllCategories()
      .then(cats => setCategories(cats))
      .catch(() => setError('Cannot load categories'))
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      const data = new FormData()
      data.append('name', form.name)
      data.append('model', form.model)
      data.append('serialNumber', form.serialNumber)
      data.append('description', form.description)
      data.append('price', form.price)
      data.append('quantityInStock', form.quantityInStock)
      data.append('currency', form.currency)
      data.append('warrantyStatus', form.warrantyStatus)
      data.append('distributorInfo', form.distributorInfo)
      data.append('type', form.type)
      data.append('subtype', form.subtype)
      data.append('category', form.category)

      await createProduct(data)

      // reset form
      setForm({
        name: '',
        model: '',
        serialNumber: '',
        description: '',
        price: '',
        quantityInStock: '',
        currency: '₺',
        warrantyStatus: '',
        distributorInfo: '',
        type: '',
        subtype: '',
        category: ''
      })
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message || 'Error adding product'
      setError(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: 8 }}>
        <label>Name</label><br />
        <input name="name" value={form.name} onChange={handleChange} required />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Model</label><br />
        <input name="model" value={form.model} onChange={handleChange} required />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Serial Number</label><br />
        <input name="serialNumber" value={form.serialNumber} onChange={handleChange} required />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Description</label><br />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Price (₺)</label><br />
        <input
          name="price"
          type="number"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          required
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Stock</label><br />
        <input
          name="quantityInStock"
          type="number"
          value={form.quantityInStock}
          onChange={handleChange}
          required
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Currency</label><br />
        <input name="currency" value={form.currency} onChange={handleChange} required />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Warranty Status</label><br />
        <input name="warrantyStatus" value={form.warrantyStatus} onChange={handleChange} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Distributor Info</label><br />
        <input name="distributorInfo" value={form.distributorInfo} onChange={handleChange} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Type</label><br />
        <input name="type" value={form.type} onChange={handleChange} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Subtype</label><br />
        <input name="subtype" value={form.subtype} onChange={handleChange} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Category</label><br />
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        >
          <option value="">Choose</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        style={{
          background: '#8B4513',
          color: '#fff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        Add Product
      </button>
    </form>
  )
}
