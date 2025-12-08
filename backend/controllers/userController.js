const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { hashPassword } = require('../utils/passwordUtils');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  res.json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update allowed fields
  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  user.avatar = req.body.avatar || user.avatar;

  // Update role-specific fields
  if (user.role === 'farmer' && req.body.farmLocation) {
    user.farmLocation = req.body.farmLocation;
  }

  if (user.role === 'transporter') {
    user.vehicleType = req.body.vehicleType || user.vehicleType;
    user.vehicleNumber = req.body.vehicleNumber || user.vehicleNumber;
    user.licenseNumber = req.body.licenseNumber || user.licenseNumber;
  }

  // Update password if provided
  if (req.body.password) {
    user.password = await hashPassword(req.body.password);
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      farmLocation: updatedUser.farmLocation,
      vehicleType: updatedUser.vehicleType,
      vehicleNumber: updatedUser.vehicleNumber,
      licenseNumber: updatedUser.licenseNumber
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -googleId');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Delete user account
// @route   DELETE /api/users/profile
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Soft delete - deactivate account
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getUserById,
  deleteAccount
};
