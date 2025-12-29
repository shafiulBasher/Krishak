const express = require('express');
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  updateDeliveryPreferences,
  clearCart
} = require('../controllers/cartController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All cart routes require authentication and buyer or admin role
router.use(protect, authorize('buyer', 'admin'));

// Cart routes
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.put('/preferences/delivery', updateDeliveryPreferences);
router.delete('/', clearCart);

module.exports = router;
