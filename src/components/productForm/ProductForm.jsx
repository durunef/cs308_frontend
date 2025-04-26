import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../../api/productService';
import { getAllCategories } from '../../api/categoryService';
import './ProductForm.css';

function ProductForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serialNumber: '',
    description: '',
    quantityInStock: 1,
    price: 0,
    type: 'coffee',
    subtype: '',
    warrantyStatus: 'valid',
    distributorInfo: '',
    category: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Load categories for dropdown selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllCategories();
        if (response.status === 'success') {
          setCategories(response.data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Convert numeric strings to numbers for certain fields
    if (name === 'quantityInStock' || name === 'price') {
      processedValue = parseFloat(value) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await createProduct(formData);
      
      if (response.status === 'success') {
        setSuccess('Product created successfully!');
        // Clear form after successful submission
        setFormData({
          name: '',
          model: '',
          serialNumber: '',
          description: '',
          quantityInStock: 1,
          price: 0,
          type: 'coffee',
          subtype: '',
          warrantyStatus: 'valid',
          distributorInfo: '',
          category: ''
        });
      } else {
        throw new Error('Failed to create product');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'An error occurred while creating the product');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="product-form-container">
      <h1>Add New Product</h1>
      <p>Progress demo için bir admin page yapmadık, projenin devamında bu sayfada admin page den ulaşılabilecek sadece, zaten user olarak login yapıldığında product eklemeyi kabul etmiyor user tokenı olduğu için.</p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">Product Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="model">Model*</label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="serialNumber">Serial Number*</label>
          <input
            type="text"
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="price">Price*</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div className="form-group half">
            <label htmlFor="quantityInStock">Quantity In Stock*</label>
            <input
              type="number"
              id="quantityInStock"
              name="quantityInStock"
              value={formData.quantityInStock}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="type">Type*</label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group half">
            <label htmlFor="subtype">Subtype</label>
            <input
              type="text"
              id="subtype"
              name="subtype"
              value={formData.subtype}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="distributorInfo">Distributor Info</label>
          <input
            type="text"
            id="distributorInfo"
            name="distributorInfo"
            value={formData.distributorInfo}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="warrantyStatus">Warranty Status</label>
            <select
              id="warrantyStatus"
              name="warrantyStatus"
              value={formData.warrantyStatus}
              onChange={handleChange}
            >
              <option value="valid">Valid</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
              <option value="none">None</option>
            </select>
          </div>
          
          <div className="form-group half">
            <label htmlFor="category">Category*</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-buttons">
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm; 