import axios from './axios'

// ─── Products ────────────────────────────────────────────────────────────────
export const fetchAllProducts = () =>
  axios
    .get('/api/v1/product-manager/products')
    .then(res => res.data.data.products)

export const createProduct = formData =>
  axios
    .post('/api/v1/product-manager/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(res => res.data.data.product)

export const deleteProduct = id =>
  axios.delete(`/api/v1/product-manager/products/${id}`)

export const updateStock = (id, quantityInStock) =>
  axios
    .patch(`/api/v1/product-manager/products/${id}/stock`, { quantityInStock })
    .then(res => res.data.data.product)


// ─── Categories ────────────────────────────────────────────────────────────
export const fetchAllCategories = () =>
  axios
    .get('/api/v1/product-manager/categories')
    .then(res => res.data.data.categories)

export const createCategory = name =>
  axios
    .post('/api/v1/product-manager/categories', { name })
    .then(res => res.data.data.category)

export const deleteCategory = id =>
  axios.delete(`/api/v1/product-manager/categories/${id}`)

/**
 * Update a category by ID
 * @param {string} categoryId
 * @param {string} newName
 */
export const updateCategory = (categoryId, newName) =>
  axios
    .patch(`/api/v1/product-manager/categories/${categoryId}`, { name: newName })
    .then(res => res.data.data.category)


// ─── Invoices ───────────────────────────────────────────────────────────────
export const fetchAllInvoices = () =>
  axios
    .get('/api/v1/product-manager/invoices')
    .then(res => res.data.data.orders)


// ─── Deliveries ────────────────────────────────────────────────────────────
// (we’ll re-use the invoices endpoint to get ALL orders as “deliveries”)
export const fetchAllDeliveries = () =>
  axios
    .get('/api/v1/product-manager/invoices')
    .then(res => res.data.data.orders)

export const updateDeliveryStatus = (id, status) =>
  axios
    .patch(`/api/v1/product-manager/deliveries/${id}`, { status })
    .then(res => res.data.data.order)


// ─── Reviews ────────────────────────────────────────────────────────────────
export const fetchAllReviews = () =>
  axios
    .get('/api/v1/product-manager/reviews')
    .then(res => res.data.data.reviews)

export const approveReview = reviewId =>
  axios
    .patch(`/api/v1/product-manager/reviews/${reviewId}/approve`)
    .then(res => res.data.data.review)

export const rejectReview = reviewId =>
  axios
    .patch(`/api/v1/product-manager/reviews/${reviewId}/reject`)
    .then(res => res.data.data.review)
