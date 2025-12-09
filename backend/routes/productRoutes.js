const express = require('express');
const router = express.Router();

// Import the Controller functions
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
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Public routes
router.get('/', getProducts);

// Protected routes (require authentication)
router.use(protect);

// Farmer routes - specific routes MUST come before parameterized routes
router.get('/my/listings', authorize('farmer'), getMyListings);
router.post('/', authorize('farmer'), upload.array('photos', 5), createProduct);

// Parameterized routes come last
router.get('/:id', getProduct);
router.put('/:id', authorize('farmer', 'admin'), upload.array('photos', 5), updateProduct);
router.delete('/:id', authorize('farmer', 'admin'), deleteProduct);

module.exports = router;