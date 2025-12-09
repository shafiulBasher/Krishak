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

// @desc    Get all delivery addresses
// @route   GET /api/users/addresses
// @access  Private (Buyer only)
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('deliveryAddresses');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user.deliveryAddresses || []
  });
});

// @desc    Add a new delivery address
// @route   POST /api/users/addresses
// @access  Private (Buyer only)
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role !== 'buyer') {
    res.status(403);
    throw new Error('Only buyers can manage delivery addresses');
  }

  const { label, recipientName, recipientPhone, addressLine1, addressLine2, village, thana, district, postalCode, isDefault } = req.body;

  // Validate required fields
  if (!label || !recipientName || !recipientPhone || !addressLine1 || !thana || !district) {
    res.status(400);
    throw new Error('Please provide all required address fields');
  }

  // If this is set as default, unset all other defaults
  if (isDefault) {
    user.deliveryAddresses.forEach(addr => {
      addr.isDefault = false;
    });
  }

  // Add the new address
  const newAddress = {
    label,
    recipientName,
    recipientPhone,
    addressLine1,
    addressLine2,
    village,
    thana,
    district,
    postalCode,
    isDefault: isDefault || user.deliveryAddresses.length === 0 // First address is default
  };

  user.deliveryAddresses.push(newAddress);
  await user.save();

  res.status(201).json({
    success: true,
    data: user.deliveryAddresses[user.deliveryAddresses.length - 1],
    message: 'Address added successfully'
  });
});

// @desc    Update a delivery address
// @route   PUT /api/users/addresses/:addressId
// @access  Private (Buyer only)
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role !== 'buyer') {
    res.status(403);
    throw new Error('Only buyers can manage delivery addresses');
  }

  const address = user.deliveryAddresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  const { label, recipientName, recipientPhone, addressLine1, addressLine2, village, thana, district, postalCode, isDefault } = req.body;

  // Update fields
  if (label) address.label = label;
  if (recipientName) address.recipientName = recipientName;
  if (recipientPhone) address.recipientPhone = recipientPhone;
  if (addressLine1) address.addressLine1 = addressLine1;
  if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
  if (village !== undefined) address.village = village;
  if (thana) address.thana = thana;
  if (district) address.district = district;
  if (postalCode !== undefined) address.postalCode = postalCode;

  // If setting as default, unset all other defaults
  if (isDefault) {
    user.deliveryAddresses.forEach(addr => {
      addr.isDefault = false;
    });
    address.isDefault = true;
  }

  await user.save();

  res.json({
    success: true,
    data: address,
    message: 'Address updated successfully'
  });
});

// @desc    Delete a delivery address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private (Buyer only)
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role !== 'buyer') {
    res.status(403);
    throw new Error('Only buyers can manage delivery addresses');
  }

  const address = user.deliveryAddresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  // If deleted address was default, make first remaining address default
  if (wasDefault && user.deliveryAddresses.length > 0) {
    user.deliveryAddresses[0].isDefault = true;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Address deleted successfully'
  });
});

// @desc    Set default delivery address
// @route   PUT /api/users/addresses/:addressId/default
// @access  Private (Buyer only)
const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role !== 'buyer') {
    res.status(403);
    throw new Error('Only buyers can manage delivery addresses');
  }

  const address = user.deliveryAddresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  // Unset all other defaults
  user.deliveryAddresses.forEach(addr => {
    addr.isDefault = false;
  });

  address.isDefault = true;
  await user.save();

  res.json({
    success: true,
    data: address,
    message: 'Default address updated successfully'
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getUserById,
  deleteAccount,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
