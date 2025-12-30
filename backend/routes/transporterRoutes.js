const express = require('express');
const router = express.Router();

const {
  getAvailableJobs,
  acceptJob,
  updateDeliveryStatus,
  getMyDeliveries,
  getTransporterStats,
  getDeliveryDetails
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

    // Return the photo URL
    const photoUrl = `/uploads/deliveries/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        photoUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
