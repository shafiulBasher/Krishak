const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserById, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile)
  .delete(protect, deleteAccount);

router.get('/:id', getUserById);

module.exports = router;
