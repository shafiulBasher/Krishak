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
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Route for /api/products
router.route('/')
  .get(getProducts)
  .post(protect, upload.array('photos'), createProduct);

// Route for /api/products/my-listings
router.get('/my-listings', protect, getMyListings);

// Route for /api/products/:id
router.route('/:id')
  .get(getProduct)
  .put(protect, upload.array('photos'), updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;