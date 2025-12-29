const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  getUserById, 
  deleteAccount,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile)
  .delete(protect, deleteAccount);

// Delivery address routes (must come before /:id route)
router.route('/addresses')
  .get(protect, getAddresses)
  .post(protect, addAddress);

router.route('/addresses/:addressId')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// This route must come last as :id is a wildcard
router.get('/:id', getUserById);

module.exports = router;
