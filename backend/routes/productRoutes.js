const express = require('express');
const router = express.Router();

// Import the Controller functions
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyListings
} = require('../controllers/productController');

// Import Middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getProducts);

// Protected routes (require authentication)
router.use(protect);

// Farmer routes - specific routes MUST come before parameterized routes
router.get('/my-listings', authorize('farmer'), getMyListings);
router.post('/', authorize('farmer'), upload.array('photos', 5), createProduct);

// Parameterized routes come last
router.get('/:id', getProduct);
router.put('/:id', authorize('farmer', 'admin'), upload.array('photos', 5), updateProduct);
router.delete('/:id', authorize('farmer', 'admin'), deleteProduct);

module.exports = router;