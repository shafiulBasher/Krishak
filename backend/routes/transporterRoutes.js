const express = require('express');
const router = express.Router();

const {
  getAvailableJobs,
  acceptJob,
  updateDeliveryStatus,
  getMyDeliveries,
  getTransporterStats,
  getDeliveryDetails,
  confirmCashCollected
} = require('../controllers/transporterController');

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication and transporter role
router.use(protect);
router.use(authorize('transporter'));

// Stats route
router.get('/stats', getTransporterStats);

// Delivery jobs routes
router.get('/jobs', getAvailableJobs);
router.get('/jobs/:orderId', getDeliveryDetails);
router.post('/jobs/:orderId/accept', acceptJob);
router.put('/jobs/:orderId/status', updateDeliveryStatus);
router.put('/jobs/:orderId/collect-cash', confirmCashCollected);

// My deliveries
router.get('/my-deliveries', getMyDeliveries);

// Photo upload for delivery proof
router.post('/jobs/:orderId/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a photo'
      });
    }

    // Log file details for debugging
    console.log('📸 Photo uploaded:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      filename: req.file.filename,
      size: req.file.size
    });

    // Return the photo URL using the actual saved filename
    const photoUrl = `/uploads/deliveries/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        photoUrl
      }
    });
  } catch (error) {
    console.error('❌ Photo upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
