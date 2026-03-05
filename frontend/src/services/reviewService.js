import api from './api';

export const reviewService = {
  // Create a review
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Get reviews for a product
  getProductReviews: async (productId, params = {}) => {
    const response = await api.get(`/reviews/product/${productId}`, { params });
    return response.data;
  },

  // Get reviews by a buyer
  getBuyerReviews: async (buyerId, params = {}) => {
    const response = await api.get(`/reviews/buyer/${buyerId}`, { params });
    return response.data;
  },

  // Check if buyer can review an order
  checkCanReview: async (orderId) => {
    const response = await api.get(`/reviews/check/${orderId}`);
    return response;  // api interceptor already returns response.data
  }
};

