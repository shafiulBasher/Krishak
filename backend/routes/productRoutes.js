const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyListings
} = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getProducts);

// Protected routes - specific named routes MUST come before parameterized routes
router.get('/my-listings', protect, getMyListings);

// Parameterized routes come last
router.post('/', protect, upload.array('photos'), createProduct);
router.get('/:id', getProduct);
router.put('/:id', protect, upload.array('photos'), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;