import axios from './axios';

// Get all products
export const getAllProducts = async () => {
  try {
    const response = await axios.get('/api/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get a single product by ID
export const getProductById = async (productId) => {
  try {
    const response = await axios.get(`/api/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product with ID ${productId}:`, error);
    throw error;
  }
};

// Create a new product
export const createProduct = async (productData) => {
  try {
    // Check if productData contains a file (image)
    if (productData.image && productData.image instanceof File) {
      // Create FormData and append all product data
      const formData = new FormData();
      
      // Append all product properties
      Object.keys(productData).forEach(key => {
        // Skip appending the image directly, it will be handled separately
        if (key !== 'image') {
          formData.append(key, productData[key]);
        }
      });
      
      // Append image file with the field name 'image'
      formData.append('image', productData.image);
      
      // Send as multipart/form-data
      const response = await axios.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } else {
      // Regular JSON request if no image
      const response = await axios.post('/api/products', productData);
      return response.data;
    }
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update an existing product
export const updateProduct = async (productId, productData) => {
  try {
    const response = await axios.put(`/api/products/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Error updating product with ID ${productId}:`, error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (productId) => {
  try {
    const response = await axios.delete(`/api/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting product with ID ${productId}:`, error);
    throw error;
  }
};

// Submit a review (rating and comment)
export const submitReview = async (productId, { rating, comment }) => {
  try {
    const { data } = await axios.post(
      `/api/v1/products/${productId}/reviews`,
      { rating, comment }
    )
    // data.data.review should be the new review
    return data.data.review
  } catch (err) {
    console.error('Error submitting review:', err)
    // re‐throw so the component can catch it
    throw err
  }
}

// Get reviews for a product
export const getProductReviews = async (productId) => {
  try {
    const response = await axios.get(`/api/products/${productId}/reviews`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews for product ${productId}:`, error);
    throw error;
  }
};

// Approve a review (manager only)
export const approveReview = async (reviewId) => {
  try {
    const response = await axios.post(`/api/reviews/${reviewId}/approve`);
    return response.data;
  } catch (error) {
    console.error(`Error approving review ${reviewId}:`, error);
    throw error;
  }
};

// Reject a review (manager only)
export const rejectReview = async (reviewId) => {
  try {
    const response = await axios.post(`/api/reviews/${reviewId}/reject`);
    return response.data;
  } catch (error) {
    console.error(`Error rejecting review ${reviewId}:`, error);
    throw error;
  }
};

// Search and filter products (client-side implementation)
export const searchProducts = (products, searchQuery, filters = {}) => {
  if (!products || !Array.isArray(products)) return [];
  
  let filteredProducts = [...products];
  
  // Text search (name or description)
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(query) || 
      (product.description && product.description.toLowerCase().includes(query))
    );
  }
  
  // Price range filter
  if (filters.minPrice) {
    filteredProducts = filteredProducts.filter(product => 
      product.price >= parseFloat(filters.minPrice)
    );
  }
  
  if (filters.maxPrice) {
    filteredProducts = filteredProducts.filter(product => 
      product.price <= parseFloat(filters.maxPrice)
    );
  }
  
  // Category filter
  if (filters.category) {
    filteredProducts = filteredProducts.filter(product => 
      product.category === filters.category
    );
  }
  
  return filteredProducts;
};

// Sort products by various criteria
export const sortProducts = (products, sortBy, order = 'asc') => {
  if (!products || !Array.isArray(products)) return [];
  
  const sortedProducts = [...products];
  
  switch (sortBy) {
    case 'price':
      if (order === 'asc') {
        sortedProducts.sort((a, b) => a.price - b.price);
      } else {
        sortedProducts.sort((a, b) => b.price - a.price);
      }
      break;
      
    case 'popularity':
      // Sort by number of reviews, assuming more reviews = more popular
      if (order === 'asc') {
        sortedProducts.sort((a, b) => (a.reviews?.length || 0) - (b.reviews?.length || 0));
      } else {
        sortedProducts.sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0));
      }
      break;
      
    case 'rating':
      // Sort by average rating
      if (order === 'asc') {
        sortedProducts.sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0));
      } else {
        sortedProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      }
      break;
      
    case 'name':
      if (order === 'asc') {
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
      }
      break;
      
    default:
      // No sorting
      break;
  }
  
  return sortedProducts;
}; 