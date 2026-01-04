/**
 * Distance Calculation Utility for Krishak Marketplace
 * 
 * Uses OpenRouteService API for road distance calculation
 * Fallback to Haversine formula for straight-line distance
 */

const axios = require('axios');

// OpenRouteService API (Free tier: 2000 requests/day)
// Sign up at: https://openrouteservice.org/
const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

/**
 * Calculate road distance using OpenRouteService API
 * @param {object} fromCoords - { lat, lng }
 * @param {object} toCoords - { lat, lng }
 * @returns {Promise<number>} - Distance in kilometers
 */
const calculateRoadDistance = async (fromCoords, toCoords) => {
  // Validate coordinates
  if (!fromCoords?.lat || !fromCoords?.lng || !toCoords?.lat || !toCoords?.lng) {
    console.warn('Invalid coordinates provided, using straight-line distance');
    return calculateStraightLineDistance(fromCoords, toCoords);
  }
  
  // If no API key, use fallback
  if (!ORS_API_KEY) {
    console.warn('ORS_API_KEY not set, using straight-line distance with 1.3x multiplier');
    const straightLine = calculateStraightLineDistance(fromCoords, toCoords);
    // Multiply by 1.3 to approximate road distance
    return Math.round(straightLine * 1.3 * 10) / 10;
  }
  
  try {
    const response = await axios.get(ORS_BASE_URL, {
      params: {
        api_key: ORS_API_KEY,
        start: `${fromCoords.lng},${fromCoords.lat}`,
        end: `${toCoords.lng},${toCoords.lat}`,
      },
      timeout: 10000, // 10 second timeout
    });
    
    // Distance is in meters, convert to km
    const distanceMeters = response.data.features[0].properties.segments[0].distance;
    const distanceKm = distanceMeters / 1000;
    
    return Math.round(distanceKm * 10) / 10; // Round to 1 decimal
  } catch (error) {
    console.error('OpenRouteService API error:', error.message);
    // Fallback to straight-line distance with multiplier
    const straightLine = calculateStraightLineDistance(fromCoords, toCoords);
    return Math.round(straightLine * 1.3 * 10) / 10;
  }
};

/**
 * Calculate straight-line distance using Haversine formula
 * @param {object} coord1 - { lat, lng }
 * @param {object} coord2 - { lat, lng }
 * @returns {number} - Distance in kilometers
 */
const calculateStraightLineDistance = (coord1, coord2) => {
  if (!coord1?.lat || !coord1?.lng || !coord2?.lat || !coord2?.lng) {
    return 0;
  }
  
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
};

/**
 * Convert degrees to radians
 */
const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Validate if delivery is within same district
 * @param {string} buyerDistrict 
 * @param {string} farmerDistrict 
 * @returns {object} - { sameDistrict, warning }
 */
const validateDistrictDelivery = (buyerDistrict, farmerDistrict) => {
  const normalizedBuyer = (buyerDistrict || '').toLowerCase().trim();
  const normalizedFarmer = (farmerDistrict || '').toLowerCase().trim();
  
  const sameDistrict = normalizedBuyer === normalizedFarmer;
  
  return {
    sameDistrict,
    buyerDistrict: buyerDistrict || 'Unknown',
    farmerDistrict: farmerDistrict || 'Unknown',
    crossDistrict: !sameDistrict,
    warning: !sameDistrict 
      ? 'Cross-district delivery - may not be available or may take longer'
      : null,
  };
};

/**
 * Get estimated delivery time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {object} - Estimated time info
 */
const getEstimatedDeliveryTime = (distanceKm) => {
  // Assume average speed of 30 km/h for rural roads
  const avgSpeedKmH = 30;
  const drivingHours = distanceKm / avgSpeedKmH;
  
  // Add 1 hour for loading/unloading
  const totalHours = drivingHours + 1;
  
  let estimate;
  if (totalHours < 2) {
    estimate = 'Same day delivery (2-4 hours)';
  } else if (totalHours < 4) {
    estimate = 'Same day delivery (4-6 hours)';
  } else if (totalHours < 8) {
    estimate = 'Same day delivery (6-8 hours)';
  } else {
    estimate = 'Next day delivery';
  }
  
  return {
    distanceKm,
    estimatedHours: Math.round(totalHours * 10) / 10,
    estimate,
  };
};

module.exports = {
  calculateRoadDistance,
  calculateStraightLineDistance,
  validateDistrictDelivery,
  getEstimatedDeliveryTime,
};
