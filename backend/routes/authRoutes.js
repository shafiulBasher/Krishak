const express = require('express');
const router = express.Router();
const { register, login, getMe, googleAuth, completeProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/complete-profile', protect, completeProfile);

module.exports = router;
