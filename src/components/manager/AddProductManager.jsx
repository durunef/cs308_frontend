// src/components/manager/AddProductManager.jsx
import React, { useState, useEffect } from 'react'
import { fetchAllCategories, createProduct } from '../../api/managerService'
import './AddProductManager.css'

export default function AddProductManager({ onSuccess }) {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    model: '',
    serialNumber: '',
    description: '',
    quantityInStock: '',
    currency: '₺',
    warrantyStatus: '',
    distributorInfo: '',
    type: '',
    subtype: '',
    category: ''
  })
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)

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

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
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
      data.append('quantityInStock', form.quantityInStock)
      data.append('currency', form.currency)
      data.append('warrantyStatus', form.warrantyStatus)
      data.append('distributorInfo', form.distributorInfo)
      data.append('type', form.type)
      data.append('subtype', form.subtype)
      data.append('category', form.category)
      data.append('published', 'false') // Ensure product is not published initially
      data.append('price', '') // Explicitly set price to empty
      data.append('cost', '') // Explicitly set cost to empty

      // Add image if selected
      if (selectedImage) {
        data.append('image', selectedImage)
      }

      await createProduct(data)

      // reset form
      setForm({
        name: '',
        model: '',
        serialNumber: '',
        description: '',
        quantityInStock: '',
        currency: '₺',
        warrantyStatus: '',
        distributorInfo: '',
        type: '',
        subtype: '',
        category: ''
      })
      setImagePreview(null)
      setSelectedImage(null)
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message || 'Error adding product'
      setError(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-product-form">
      {error && <p className="error-message">{error}</p>}

      <div className="form-group">
        <label>Name</label>
        <input name="name" value={form.name} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Model</label>
        <input name="model" value={form.model} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Serial Number</label>
        <input name="serialNumber" value={form.serialNumber} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
        />
      </div>

      <div className="form-group">
        <label>Product Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="image-input"
        />
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Product preview" />
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Stock</label>
        <input
          name="quantityInStock"
          type="number"
          value={form.quantityInStock}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Currency</label>
        <input name="currency" value={form.currency} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Warranty Status</label>
        <select name="warrantyStatus" value={form.warrantyStatus} onChange={handleChange}>
          <option value="valid">Valid</option>
          <option value="expired">Expired</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="form-group">
        <label>Distributor Info</label>
        <input name="distributorInfo" value={form.distributorInfo} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Type</label>
        <input name="type" value={form.type} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Subtype</label>
        <input name="subtype" value={form.subtype} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Category</label>
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

      <button type="submit" className="submit-button">
        Add Product
      </button>
    </form>
  )
}
