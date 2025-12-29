const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const farmerCount = await User.countDocuments({ role: 'farmer' });
  const buyerCount = await User.countDocuments({ role: 'buyer' });
  const transporterCount = await User.countDocuments({ role: 'transporter' });

  const totalListings = await Product.countDocuments();
  const pendingListings = await Product.countDocuments({ status: 'pending' });
  const approvedListings = await Product.countDocuments({ status: 'approved' });
  const rejectedListings = await Product.countDocuments({ status: 'rejected' });

  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
  const completedOrders = await Order.countDocuments({ orderStatus: 'completed' });

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        farmers: farmerCount,
        buyers: buyerCount,
        transporters: transporterCount,
      },
      listings: {
        total: totalListings,
        pending: pendingListings,
        approved: approvedListings,
        rejected: rejectedListings,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
      },
    },
  });
});

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, isVerified, search } = req.query;

  const query = {};

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (isVerified !== undefined) query.isVerified = isVerified === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: user,
  });
});

// @desc    Verify/Unverify user
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
const verifyUser = asyncHandler(async (req, res) => {
  const { isVerified } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isVerified = isVerified;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
    data: user,
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot delete admin users');
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// @desc    Get all pending products for moderation
// @route   GET /api/admin/products/pending
// @access  Private (Admin only)
const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: 'pending' })
    .populate('farmer', 'name email phone farmLocation')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Approve product
// @route   PUT /api/admin/products/:id/approve
// @access  Private (Admin only)
const approveProduct = asyncHandler(async (req, res) => {
  const { moderationNote } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  product.status = 'approved';
  product.moderationNote = moderationNote || '';
  product.moderatedBy = req.user._id;
  product.moderatedAt = Date.now();

  await product.save();

  res.json({
    success: true,
    data: product,
    message: 'Product approved successfully'
  });
});

// @desc    Reject product
// @route   PUT /api/admin/products/:id/reject
// @access  Private (Admin only)
const rejectProduct = asyncHandler(async (req, res) => {
  const { moderationNote } = req.body;

  if (!moderationNote) {
    res.status(400);
    throw new Error('Please provide a reason for rejection');
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  product.status = 'rejected';
  product.moderationNote = moderationNote;
  product.moderatedBy = req.user._id;
  product.moderatedAt = Date.now();

  await product.save();

  res.json({
    success: true,
    data: product,
    message: 'Product rejected'
  });
});

// @desc    Get all products with filters
// @route   GET /api/admin/products
// @access  Private/Admin
const getAllProducts = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  const query = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  const products = await Product.find(query)
    .populate('farmer', 'name email phone farmLocation')
    .populate('moderatedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// @desc    Get moderation statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getStats = asyncHandler(async (req, res) => {
  const pending = await Product.countDocuments({ status: 'pending' });
  const approved = await Product.countDocuments({ status: 'approved' });
  const rejected = await Product.countDocuments({ status: 'rejected' });
  const total = await Product.countDocuments();

  res.json({
    success: true,
    data: {
      pending,
      approved,
      rejected,
      total
    }
  });
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  verifyUser,
  deleteUser,
  getPendingProducts,
  getAllProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
  getStats
};
