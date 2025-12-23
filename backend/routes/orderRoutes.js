const express = require('express');
const router = express.Router();

const {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  getOrder,
  updateOrderStatus,
  updateDeliveryStatus,
  cancelOrder,
  rateOrder,
  getDeliverySlots
} = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/delivery-slots', getDeliverySlots);

// Protected routes
router.use(protect);

// Buyer routes
router.post('/', authorize('buyer', 'admin'), createOrder);
router.get('/buyer', authorize('buyer', 'admin'), getBuyerOrders);

// Farmer routes
router.get('/farmer', authorize('farmer'), getFarmerOrders);

// Shared routes (single order)
router.get('/:id', getOrder);
router.put('/:id/status', authorize('farmer', 'admin'), updateOrderStatus);
router.put('/:id/delivery-status', authorize('transporter', 'admin'), updateDeliveryStatus);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/rate', rateOrder);

module.exports = router;
