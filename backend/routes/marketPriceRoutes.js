const express = require('express');
const router = express.Router();
const {
  getCurrentPrices,
  getPriceHistory,
  addOrUpdatePrice,
  getActiveDistricts,
  getActiveCrops,
  deleteMarketPrice,
  getMarketStats
} = require('../controllers/marketPriceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getCurrentPrices);
router.get('/history/:cropName/:district', getPriceHistory);
router.get('/districts', getActiveDistricts);
router.get('/crops', getActiveCrops);
router.get('/stats', getMarketStats);

// Admin routes
router.post('/', protect, authorize('admin'), addOrUpdatePrice);
router.delete('/:id', protect, authorize('admin'), deleteMarketPrice);

module.exports = router;
