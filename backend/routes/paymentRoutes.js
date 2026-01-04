const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');
const stripeConnectController = require('../controllers/stripeConnectController');

// Payment routes
router.post('/calculate-total', protect, paymentController.calculateOrderTotal);
router.post('/calculate-distance', protect, paymentController.calculateDistance);
router.get('/vehicle-options/:orderId', protect, paymentController.getVehicleOptions);
router.post('/create-intent', protect, paymentController.createPaymentIntent);
router.post('/confirm', protect, paymentController.confirmPayment);
router.post('/refund/:orderId', protect, paymentController.refundPayment);
router.get('/history', protect, paymentController.getPaymentHistory);
router.post('/transfer/:orderId', protect, paymentController.transferFunds);

// Stripe Connect routes
router.post('/connect/onboard', protect, stripeConnectController.createConnectAccount);
router.get('/connect/status', protect, stripeConnectController.getConnectStatus);
router.get('/connect/dashboard', protect, stripeConnectController.getDashboardLink);
router.get('/connect/earnings', protect, stripeConnectController.getEarnings);
router.post('/connect/refresh-onboarding', protect, stripeConnectController.refreshOnboarding);

module.exports = router;
