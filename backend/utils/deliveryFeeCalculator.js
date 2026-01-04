/**
 * Delivery Fee Calculator for Krishak Marketplace
 * 
 * Vehicle Rates:
 * - Van: ৳300 base + ৳50/km
 * - Pickup: ৳400 base + ৳75/km  
 * - Truck: ৳500 base + ৳100/km
 */

const VEHICLE_RATES = {
  van: {
    name: 'Van',
    baseRate: 300,
    perKmRate: 50,
    capacity: 'Up to 500kg',
    description: 'Best for small to medium orders',
    icon: '🚐',
  },
  pickup: {
    name: 'Pickup',
    baseRate: 400,
    perKmRate: 75,
    capacity: 'Up to 1000kg',
    description: 'Ideal for medium to large orders',
    icon: '🛻',
  },
  truck: {
    name: 'Truck',
    baseRate: 500,
    perKmRate: 100,
    capacity: 'Up to 2000kg',
    description: 'For bulk orders and heavy items',
    icon: '🚛',
  },
};

/**
 * Calculate delivery fee based on vehicle type and distance
 * @param {string} vehicleType - 'van', 'pickup', or 'truck'
 * @param {number} distanceKm - Distance in kilometers
 * @returns {object} - Fee breakdown
 */
const calculateDeliveryFee = (vehicleType, distanceKm) => {
  const vehicle = VEHICLE_RATES[vehicleType];
  
  if (!vehicle) {
    throw new Error(`Invalid vehicle type: ${vehicleType}. Must be one of: van, pickup, truck`);
  }
  
  if (typeof distanceKm !== 'number' || distanceKm < 0) {
    throw new Error('Distance must be a positive number');
  }
  
  // Round distance to 1 decimal place
  const roundedDistance = Math.round(distanceKm * 10) / 10;
  
  // Calculate total fee
  const distanceCharge = vehicle.perKmRate * roundedDistance;
  const totalFee = vehicle.baseRate + distanceCharge;
  
  return {
    vehicleType,
    vehicleName: vehicle.name,
    baseRate: vehicle.baseRate,
    perKmRate: vehicle.perKmRate,
    distance: roundedDistance,
    distanceCharge: Math.round(distanceCharge),
    totalFee: Math.round(totalFee),
    capacity: vehicle.capacity,
    description: vehicle.description,
    icon: vehicle.icon,
    calculatedAt: new Date(),
  };
};

/**
 * Get all available vehicle options with estimated fees
 * @param {number} distanceKm - Distance in kilometers
 * @returns {array} - Array of vehicle options with estimated fees
 */
const getAllVehicleOptions = (distanceKm) => {
  return Object.keys(VEHICLE_RATES).map(vehicleType => {
    return calculateDeliveryFee(vehicleType, distanceKm);
  });
};

/**
 * Calculate platform fee
 * @param {number} productAmount - Product total in BDT
 * @param {number} deliveryFee - Delivery fee in BDT
 * @param {number} platformFeePercent - Platform fee percentage (default 5%)
 * @returns {object} - Fee breakdown
 */
const calculatePlatformFee = (productAmount, deliveryFee, platformFeePercent = 5) => {
  const subtotal = productAmount + deliveryFee;
  const platformFee = Math.round(subtotal * (platformFeePercent / 100));
  const totalAmount = subtotal + platformFee;
  
  return {
    productAmount,
    deliveryFee,
    subtotal,
    platformFeePercent,
    platformFee,
    totalAmount,
  };
};

/**
 * Convert BDT to USD cents for Stripe
 * @param {number} amountBDT - Amount in BDT
 * @param {number} exchangeRate - USD to BDT rate (default 110)
 * @returns {number} - Amount in USD cents
 */
const bdtToUsdCents = (amountBDT, exchangeRate = 110) => {
  // Convert BDT to USD, then to cents
  const usdAmount = amountBDT / exchangeRate;
  return Math.ceil(usdAmount * 100); // Round up to avoid fractional cents
};

/**
 * Convert USD cents to BDT
 * @param {number} cents - Amount in USD cents
 * @param {number} exchangeRate - USD to BDT rate (default 110)
 * @returns {number} - Amount in BDT
 */
const usdCentsToBdt = (cents, exchangeRate = 110) => {
  const usdAmount = cents / 100;
  return Math.round(usdAmount * exchangeRate);
};

module.exports = {
  VEHICLE_RATES,
  calculateDeliveryFee,
  getAllVehicleOptions,
  calculatePlatformFee,
  bdtToUsdCents,
  usdCentsToBdt,
};
