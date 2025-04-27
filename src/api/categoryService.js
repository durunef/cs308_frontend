import axios from './axios';

// Get all categories
export const getAllCategories = async () => {
  try {
    const response = await axios.get('/api/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      status: 'error',
      data: {
        categories: []
      }
    };
  }
};

// Get products by category
export const getProductsByCategory = async (categoryId) => {
  try {
    const response = await axios.get(`/api/categories/${categoryId}/products`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Create a new category (if needed for admin features)
export const createCategory = async (categoryData) => {
  try {
    const response = await axios.post('/api/categories', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}; 