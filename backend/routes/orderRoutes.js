const express = require('express');
const router = express.Router();

// Import the Controller functions
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus
} = require('../controllers/orderController');

// Import Middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Buyer routes
router.post('/', authorize('buyer'), createOrder);

// Common routes
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);

// Farmer/Admin routes
router.put('/:id/status', authorize('farmer', 'admin'), updateOrderStatus);

module.exports = router;