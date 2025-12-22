import api from './api';

// Get current market prices with optional filters
export const getCurrentPrices = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.district) params.append('district', filters.district);
  if (filters.category) params.append('category', filters.category);
  if (filters.cropName) params.append('cropName', filters.cropName);
  if (filters.limit) params.append('limit', filters.limit);
  
  // Note: api interceptor already returns response.data
  const response = await api.get(`/market-prices?${params.toString()}`);
  return response;
};

// Get price history for specific crop in specific district
export const getPriceHistory = async (cropName, district, days = 30) => {
  const response = await api.get(`/market-prices/history/${cropName}/${district}?days=${days}`);
  return response;
};

// Add or update market price (admin only)
export const addOrUpdatePrice = async (priceData) => {
  console.log('🚀 Sending price data:', priceData);
  const response = await api.post('/market-prices', priceData);
  console.log('✅ Price added/updated:', response);
  return response;
};

// Get list of active districts with price data
export const getActiveDistricts = async () => {
  const response = await api.get('/market-prices/districts');
  return response;
};

// Get list of active crops with price data
export const getActiveCrops = async (district = null) => {
  const params = district ? `?district=${district}` : '';
  const response = await api.get(`/market-prices/crops${params}`);
  return response;
};

// Get market statistics
export const getMarketStats = async () => {
  const response = await api.get('/market-prices/stats');
  return response;
};

// Delete market price entry (admin only)
export const deleteMarketPrice = async (id) => {
  const response = await api.delete(`/market-prices/${id}`);
  return response;
};

export default {
  getCurrentPrices,
  getPriceHistory,
  addOrUpdatePrice,
  getActiveDistricts,
  getActiveCrops,
  getMarketStats,
  deleteMarketPrice
};
