import api from './api';

// Create a new product listing
export const createProduct = async (productData) => {
  // Check if productData is FormData (for file uploads)
  const config = productData instanceof FormData ? {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  } : {};
  
  const response = await api.post('/products', productData, config);
  return response;
};

// Get all products (with filters)
export const getProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/products?${params}`);
  return response;
};

// Get a single product by ID
export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response;
};

// Get farmer's own listings
export const getMyListings = async () => {
  const response = await api.get('/products/my-listings');
  return response;
};

// Update a product
export const updateProduct = async (id, productData) => {
  // Check if productData is FormData (for file uploads)
  const config = productData instanceof FormData ? {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  } : {};
  
  const response = await api.put(`/products/${id}`, productData, config);
  return response;
};

// Delete a product
export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response;
};