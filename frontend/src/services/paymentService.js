import api from './api';

// NOTE: api.js response interceptor already returns response.data
// So we should NOT do response.data again - just return the response directly

/**
 * Calculate order total with delivery fee
 */
export const calculateOrderTotal = async (orderId, vehicleType) => {
  try {
    const data = await api.post('/payments/calculate-total', {
      orderId,
      vehicleType,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get available vehicle options for an order
 */
export const getVehicleOptions = async (orderId) => {
  try {
    const data = await api.get(`/payments/vehicle-options/${orderId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create payment intent
 */
export const createPaymentIntent = async (orderId, vehicleType) => {
  try {
    console.log('Creating payment intent for:', { orderId, vehicleType });
    const data = await api.post('/payments/create-intent', {
      orderId,
      vehicleType,
    });
    console.log('Payment intent response data:', data);
    return data;
  } catch (error) {
    console.error('Payment intent service error:', error);
    throw error;
  }
};

/**
 * Confirm payment
 */
export const confirmPayment = async (paymentIntentId) => {
  try {
    const data = await api.post('/payments/confirm', {
      paymentIntentId,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (orderId, reason) => {
  try {
    const data = await api.post(`/payments/refund/${orderId}`, {
      reason,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (page = 1, limit = 10) => {
  try {
    const data = await api.get('/payments/history', {
      params: { page, limit },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Transfer funds to farmer and transporter
 */
export const transferFunds = async (orderId) => {
  try {
    const data = await api.post(`/payments/transfer/${orderId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Stripe Connect functions

/**
 * Create Stripe Connect account and get onboarding URL
 */
export const createConnectAccount = async () => {
  try {
    const data = await api.post('/payments/connect/onboard');
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Stripe Connect account status
 */
export const getConnectStatus = async () => {
  try {
    const data = await api.get('/payments/connect/status');
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Stripe dashboard link
 */
export const getDashboardLink = async () => {
  try {
    const data = await api.get('/payments/connect/dashboard');
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get earnings summary
 */
export const getEarnings = async () => {
  try {
    const data = await api.get('/payments/connect/earnings');
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh onboarding link
 */
export const refreshOnboarding = async () => {
  try {
    const data = await api.post('/payments/connect/refresh-onboarding');
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistanceAPI = async (fromCoords, toCoords) => {
  try {
    const data = await api.post('/payments/calculate-distance', {
      fromCoords,
      toCoords,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const paymentService = {
  calculateOrderTotal,
  getVehicleOptions,
  createPaymentIntent,
  confirmPayment,
  refundPayment,
  getPaymentHistory,
  transferFunds,
  createConnectAccount,
  getConnectStatus,
  getDashboardLink,
  getEarnings,
  refreshOnboarding,
  calculateDistanceAPI,
};

export default paymentService;
