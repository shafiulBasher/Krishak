import api from './api';

// Get transporter dashboard stats
export const getTransporterStats = async () => {
  const response = await api.get('/transporter/stats');
  return response;
};

// Get available delivery jobs
export const getAvailableJobs = async (district = '') => {
  const params = district ? `?district=${district}` : '';
  const response = await api.get(`/transporter/jobs${params}`);
  return response;
};

// Get single delivery details
export const getDeliveryDetails = async (orderId) => {
  const response = await api.get(`/transporter/jobs/${orderId}`);
  return response;
};

// Accept a delivery job
export const acceptJob = async (orderId) => {
  const response = await api.post(`/transporter/jobs/${orderId}/accept`);
  return response;
};

// Update delivery status
export const updateDeliveryStatus = async (orderId, statusData) => {
  const response = await api.put(`/transporter/jobs/${orderId}/status`, statusData);
  return response;
};

// Get my assigned deliveries
export const getMyDeliveries = async (status = '') => {
  const params = status ? `?status=${status}` : '';
  const response = await api.get(`/transporter/my-deliveries${params}`);
  return response;
};

// Upload delivery proof photo
export const uploadDeliveryPhoto = async (orderId, photoFile) => {
  const formData = new FormData();
  formData.append('photo', photoFile);
  
  const response = await api.post(`/transporter/jobs/${orderId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response;
};
