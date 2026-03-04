const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  verifyUser,
  deleteUser,
  getPendingProducts,
  getAllProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
  getStats,
  getAnalytics,
  getUserSummary
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id/summary', getUserSummary);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/verify', verifyUser);
router.delete('/users/:id', deleteUser);

// Analytics route
router.get('/analytics', getAnalytics);

// Product management routes
router.get('/products', getAllProducts);
router.get('/products/pending', getPendingProducts);
router.put('/products/:id/approve', approveProduct);
router.put('/products/:id/reject', rejectProduct);
router.delete('/products/:id', deleteProduct);

// Legacy stats route for product moderation
router.get('/stats', getStats);

module.exports = router;
