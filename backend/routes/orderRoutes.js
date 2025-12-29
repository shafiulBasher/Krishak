const express = require('express');
const router = express.Router();

// Import the Controller functions
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getBuyerStats,
  getTransporterStats
} = require('../controllers/orderController');

// Import Middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Buyer routes
router.post('/', authorize('buyer'), createOrder);

// Stats routes (must be before /:id route to avoid route conflicts)
// IMPORTANT: These routes must come before /:id to prevent Express from matching "stats" as an ID
router.get('/stats/buyer', authorize('buyer'), getBuyerStats);
router.get('/stats/transporter', authorize('transporter'), getTransporterStats);

// Common routes
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);

// Farmer/Admin routes
router.put('/:id/status', authorize('farmer', 'admin'), updateOrderStatus);

module.exports = router;