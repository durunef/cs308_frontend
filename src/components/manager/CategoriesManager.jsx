// src/components/manager/CategoriesManager.jsx
import React, { useState, useEffect } from 'react'
import {
  fetchAllCategories,
  createCategory,
  deleteCategory
} from '../../api/managerService'

export default function CategoriesManager() {
  const [cats, setCats] = useState([])
  const [newName, setNewName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // 1) Kategorileri yükle
  const loadCategories = async () => {
    try {
      setLoading(true)
      const list = await fetchAllCategories()
      setCats(list)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // 2) Yeni kategori ekleme
  const handleAdd = async e => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await createCategory(newName)
      setNewName('')
      loadCategories()
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating category')
    }
  }

  // 3) Kategori silme
  const handleDelete = async id => {
    if (!window.confirm('Delete this category?')) return
    try {
      await deleteCategory(id)
      loadCategories()
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting category')
    }
  }

  if (loading) return <p>Loading categories…</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #8B4513',
        borderRadius: 8,
        padding: 24,
        maxWidth: 600,
        margin: '0 auto',
        fontFamily: 'Trebuchet MS, sans-serif'
      }}
    >
      <h2 style={{ color: '#8B4513', marginBottom: 16 }}>
        📁 Category Management
      </h2>

      {/* Yeni kategori formu */}
      <form onSubmit={handleAdd} style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{
            padding: '6px 8px',
            border: '1px solid #8B4513',
            borderRadius: 4,
            marginRight: 8
          }}
          required
        />
        <button
          type="submit"
          style={{
            background: '#8B4513',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Add Category
        </button>
      </form>

      {/* Kategori listesi */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {cats.map(c => (
          <li
            key={c._id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #ddd'
            }}
          >
            <span>{c.name}</span>
            <button
              onClick={() => handleDelete(c._id)}
              style={{
                background: '#c0392b',
                color: '#fff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
