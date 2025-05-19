import React, { useState, useEffect } from 'react';
import {
  fetchAllCategories,
  createCategory,
  deleteCategory,
  updateCategory
} from '../../api/managerService';

export default function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchAllCategories();
      setCategories(data);
    } catch {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await createCategory(newName.trim());
      setNewName('');
      loadCategories();
    } catch {
      alert('Could not add category.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
      setCategories(cs => cs.filter(c => c._id !== id));
    } catch {
      alert('Could not delete category.');
    }
  };

  // --- Yeni eklenen edit modu state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;
    try {
      await updateCategory(id, editingName.trim());
      setCategories(cs =>
        cs.map(c => (c._id === id ? { ...c, name: editingName.trim() } : c))
      );
      cancelEdit();
    } catch {
      alert('Could not update category.');
    }
  };

  if (loading) return <p>Loading categories…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{
      background: '#fff',
      border: '2px solid #8B4513',
      borderRadius: 8,
      padding: 24,
      maxWidth: 600,
      margin: '0 auto'
    }}>
      <h2 style={{ color: '#8B4513' }}>📁 Category Management</h2>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: '8px 16px',
            background: '#8B4513',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Add
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {categories.map(cat => (
          <li
            key={cat._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #eee'
            }}
          >
            {editingId === cat._id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
                />
                <button
                  onClick={() => saveEdit(cat._id)}
                  style={{
                    marginLeft: 8,
                    padding: '6px 10px',
                    background: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    marginLeft: 4,
                    padding: '6px 10px',
                    background: '#F44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span>{cat.name}</span>
                <div>
                  <button
                    onClick={() => startEdit(cat)}
                    style={{
                      marginRight: 8,
                      padding: '6px 10px',
                      background: '#2196F3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    style={{
                      padding: '6px 10px',
                      background: '#F44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
