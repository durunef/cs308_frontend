import React, { useState, useEffect, useCallback } from 'react'
import {
  fetchAllProducts,
  deleteProduct,
  updateStock,
  fetchAllCategories
} from '../../api/managerService'
import AddProductManager from './AddProductManager'

export default function ProductsManager() {
  const [categories, setCategories]     = useState([])
  const [products, setProducts]         = useState([])
  const [selectedCategory, setCategory] = useState('')
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  const loadProducts = useCallback(async () => {
    try {
      const prods = await fetchAllProducts()
      setProducts(prods)
    } catch (err) {
      setError('Fetch products failed: ' + (err.message || err))
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        const [cats, prods] = await Promise.all([
          fetchAllCategories(),
          fetchAllProducts()
        ])
        setCategories(cats)
        setProducts(prods)
      } catch (err) {
        setError('Init failed: ' + (err.message || err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadProducts])

  const handleDelete = async id => {
    if (!window.confirm('Delete this product?')) return
    try {
      await deleteProduct(id)
      setProducts(ps => ps.filter(p => p._id !== id))
    } catch (err) {
      setError('Delete failed: ' + (err.message || err))
    }
  }

  const handleStockChange = async (id, newQty) => {
    try {
      await updateStock(id, newQty)
      setProducts(ps =>
        ps.map(p => (p._id === id ? { ...p, quantityInStock: newQty } : p))
      )
    } catch (err) {
      setError('Stock update failed: ' + (err.message || err))
    }
  }

  const displayed = selectedCategory
    ? products.filter(p => p.category?._id === selectedCategory)
    : []

  if (loading) return <p>Loading...</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>

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
        📦 Product Management
      </h2>

      {/* 1) Add Product Form */}
      <AddProductManager onSuccess={loadProducts} />

      {/* 2) Category Selector */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #8B4513',
          borderRadius: 6,
          padding: 16,
          marginBottom: 24
        }}
      >
        <label
          htmlFor="categorySelect"
          style={{ marginRight: 12, color: '#8B4513' }}
        >
          Select Category:
        </label>
        <select
          id="categorySelect"
          value={selectedCategory}
          onChange={e => setCategory(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '1px solid #8B4513',
            borderRadius: 4,
            fontWeight: selectedCategory ? 'normal' : 'bold'
          }}
        >
          <option value="">Choose</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3) Empty Message */}
      {selectedCategory && displayed.length === 0 && (
        <p
          style={{
            fontFamily: 'monospace',
            color: '#8B4513',
            marginLeft: 8
          }}
        >
          No products found in this category.
        </p>
      )}

      {/* 4) Product Cards Grid */}
      {displayed.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16
          }}
        >
          {displayed.map(p => (
            <div
              key={p._id}
              style={{
                border: '1px solid #8B4513',
                borderRadius: 6,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#8B4513' }}>
                  {p.name}
                </h3>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Price:</strong> {p.price.toFixed(2)} ₺
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ marginRight: 4 }}>Stock:</label>
                  <input
                    type="number"
                    value={p.quantityInStock}
                    onChange={e =>
                      handleStockChange(p._id, +e.target.value)
                    }
                    style={{
                      width: 60,
                      padding: 4,
                      border: '1px solid #ccc',
                      borderRadius: 4
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => handleDelete(p._id)}
                style={{
                  background: '#c0392b',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
