// src/api/orderService.js
import axios from './axios';

/**
 * Checkout: ödeme/kargo bilgilerini backend'e yollayıp
 * { status:'success', data:{ order, invoiceUrl } } döner
 */
export const checkout = async ({ paymentDetails, shippingDetails, cartItems }) => {
  const response = await axios.post('/api/orders/checkout', {
    payment: paymentDetails,
    shipping: shippingDetails,
    cart: cartItems
  });
  return response.data; // { status:'success', data:{ order, invoiceUrl } }
};

/**
 * Kullanıcının tüm sipariş geçmişini çeker.
 * Dönen yapı: { status:'success', data: [order1, order2, …] }
 */
export const getOrderHistory = async () => {
  const response = await axios.get('/api/orders');
  return response.data;
};

/**
 * Tek bir siparişin detaylarını alır.
 * Dönen yapı: { status:'success', data: {order} }
 */
export const getOrderDetails = async (orderId) => {
  const response = await axios.get(`/api/orders/${orderId}`);
  return response.data;
};

/**
 * Sipariş durumunu sorgular.
 * Dönen yapı: { status:'success', data:{ status: 'processing'|'in-transit'|'delivered' } }
 * Not: Bu endpoint 404 dönebilir, bu durumda mevcut sipariş durumunu kullanın.
 */
export const getOrderStatus = async (orderId) => {
  try {
    console.log(`Making status API call for order ${orderId}`);
    const response = await axios.get(`/api/orders/${orderId}/status`);
    console.log(`Status API success for order ${orderId}:`, response.data);
    return response.data;
  } catch (error) {
    console.log(`Status API error for order ${orderId}:`, error.message || 'Unknown error');
    
    // If we get a 404, return a formatted response with the order's existing status
    if (error.response && error.response.status === 404) {
      console.log('Status endpoint not available for this order, using fallback');
      
      // Try to get the main order to extract its status
      try {
        console.log(`Attempting to get main order data for ${orderId}`);
        const orderResponse = await axios.get(`/api/orders/${orderId}`);
        
        if (orderResponse.data && orderResponse.data.status === 'success' && 
            orderResponse.data.data && orderResponse.data.data.status) {
          console.log(`Got status from main order: ${orderResponse.data.data.status}`);
          return {
            status: 'success',
            data: {
              status: orderResponse.data.data.status
            }
          };
        }
      } catch (orderError) {
        console.log('Error getting main order:', orderError.message);
      }
      
      // If we couldn't get the order, use stored data from sessionStorage
      try {
        const savedOrderJSON = sessionStorage.getItem('currentOrderDetail');
        if (savedOrderJSON) {
          const savedOrder = JSON.parse(savedOrderJSON);
          if (savedOrder._id === orderId && savedOrder.status) {
            console.log(`Using status from sessionStorage: ${savedOrder.status}`);
            return {
              status: 'success',
              data: {
                status: savedOrder.status
              }
            };
          }
        }
      } catch (storageError) {
        console.log('Error reading from sessionStorage:', storageError.message);
      }
      
      // Default fallback if nothing else worked
      return {
        status: 'success',
        data: {
          status: 'processing' // Default fallback status
        }
      };
    }
    
    // Otherwise rethrow the error
    throw error;
  }
};

/**
 * Bir ürüne derecelendirme (1–5) gönderir.
 */
export const submitProductRating = async (productId, rating) => {
  const response = await axios.post(`/api/products/${productId}/rate`, { rating });
  return response.data;
};

/**
 * Bir ürüne yorum ve derecelendirme gönderir.
 * API, review oluşturup bir reviewId döndürür ve bu ID ile daha sonra onay yapılabilir.
 */
export const submitProductReview = async (productId, rating, comment) => {
  // The API endpoint expects /api/products/:productId/reviews
  const response = await axios.post(`/api/products/${productId}/reviews`, { 
    rating, 
    comment 
  });
  
  console.log('Review submission response:', response.data);
  return response.data;
};

/**
 * Bir ürüne sadece yorum gönderir (rating olmadan).
 * API, review oluşturup bir reviewId döndürür ve bu ID ile daha sonra onay yapılabilir.
 */
export const submitProductComment = async (productId, comment) => {
  // Similar to review but without rating
  const response = await axios.post(`/api/products/${productId}/reviews`, { 
    comment,
    rating: 0 // Send a rating of 0 to indicate this is just a comment
  });
  
  console.log('Comment submission response:', response.data);
  return response.data;
};

/**
 * Invoice PDF'ini indirir (blob).
 * Not: API henüz hazır değilse 404 hatası dönebilir, bu durumda HTML versiyonunu kullanabilirsiniz.
 */
export const downloadInvoice = async (orderId) => {
  try {
    // Check if we're in development mode (using localhost)
    const isDev = window.location.hostname === 'localhost';

    // Use the proper URL based on the environment
    const url = isDev 
      ? `http://localhost:3000/invoices/invoice-${orderId}.pdf` // Direct path to backend's static files
      : `/api/orders/${orderId}/invoice`; // Production API endpoint
      
    console.log(`Requesting invoice from: ${url}`);
    
    const response = await axios.get(url, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.log(`Invoice download error for order ${orderId}:`, error.message || 'Unknown error');
    
    // If we get a 404, that means the PDF isn't generated yet
    if (error.response && error.response.status === 404) {
      console.log('Invoice PDF not available yet for order:', orderId);
    }
    
    // Rethrow to let component handle it
    throw error;
  }
};

/**
 * Kullanıcıya e-posta olarak faturayı tekrar gönderir.
 */
export const emailInvoice = async (orderId) => {
  const response = await axios.post(`/api/orders/${orderId}/email-invoice`);
  return response.data;
};

/**
 * Cancels an order
 * @param {string} orderId - The ID of the order to cancel
 * @returns {Promise<Object>} The response data containing the cancelled order
 */
export const cancelOrder = async (orderId) => {
  const response = await axios.post(`/api/orders/${orderId}/cancel`);
  return response.data;
};

/**
 * Requests a refund for specific items in an order
 * @param {string} orderId - The ID of the order
 * @param {Array} items - Array of items to refund with productId, quantity, and reason
 * @returns {Promise<Object>} The response data containing the refund request details
 */
export const requestRefund = async (orderId, items) => {
  const response = await axios.post(`/api/orders/${orderId}/refund`, { items });
  return response.data;
};

/**
 * Gets the status of a refund request
 * @param {string} refundId - The ID of the refund request
 * @returns {Promise<Object>} The response data containing the refund status
 */
export const getRefundStatus = async (refundId) => {
  const response = await axios.get(`/api/orders/refund/${refundId}`);
  return response.data;
};