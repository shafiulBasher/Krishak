import api from './api';

// Create a new order
export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response;
};

// Get user's orders
export const getMyOrders = async () => {
  const response = await api.get('/orders/my-orders');
  return response;
};

// Get single order
export const getOrder = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response;
};

// Update order status (for farmers)
export const updateOrderStatus = async (id, statusData) => {
  const response = await api.put(`/orders/${id}/status`, statusData);
  return response;
};

// Get buyer dashboard stats
export const getBuyerStats = async () => {
  // Add timestamp to prevent caching
  const response = await api.get('/orders/stats/buyer', {
    params: { _t: Date.now() }
  });
  return response;
};

// Get transporter dashboard stats
export const getTransporterStats = async () => {
  const response = await api.get('/orders/stats/transporter');
  return response;
};