const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Extract base URL without /api
const BASE_URL = API_URL.replace('/api', '');

/**
 * Get full image URL from relative path
 * @param {string} imagePath - Relative image path (e.g., /uploads/products/image.jpg)
 * @returns {string} - Full URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If path starts with /, remove it to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${BASE_URL}${cleanPath}`;
};

/**
 * Get full URL for pickup/delivery photos
 * @param {object} photoObject - Photo object with url property
 * @returns {string} - Full URL to the photo
 */
export const getPhotoUrl = (photoObject) => {
  if (!photoObject || !photoObject.url) return '';
  return getImageUrl(photoObject.url);
};

export default { getImageUrl, getPhotoUrl };
