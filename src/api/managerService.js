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


// ─── Invoices ───────────────────────────────────────────────────────────────
export const fetchAllInvoices = () =>
  axios
    .get('/api/v1/product-manager/invoices')
    .then(res => res.data.data.orders)


// ─── Deliveries ────────────────────────────────────────────────────────────
export const fetchAllDeliveries = () =>
  axios
    .get('/api/v1/product-manager/deliveries')
    .then(res => res.data.data.deliveries)

export const updateDeliveryStatus = (id, status) =>
  axios
    .patch(`/api/v1/product-manager/deliveries/${id}`, { status })
    .then(res => res.data.data.delivery)


// ─── Reviews ────────────────────────────────────────────────────────────────
// fetch all reviews (already populated with product.name and user.name on the backend)
export const fetchAllReviews = () =>
  axios
    .get('/api/v1/product-manager/reviews')
    .then(res => res.data.data.reviews)

// approve a review
export const approveReview = reviewId =>
  axios
    .patch(`/api/v1/product-manager/reviews/${reviewId}/approve`)
    .then(res => res.data.data.review)

// reject a review
export const rejectReview = reviewId =>
  axios
    .patch(`/api/v1/product-manager/reviews/${reviewId}/reject`)
    .then(res => res.data.data.review)
