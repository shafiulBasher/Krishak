const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const TransporterAssignment = require('../models/TransporterAssignment');

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
  console.log('📋 getAllUsers API called');
  console.log('Query params:', req.query);
  const { role, isActive, isVerified, search } = req.query;

  const query = {};

  if (role && role !== '') query.role = role;
  if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';
  if (isVerified !== undefined && isVerified !== '') query.isVerified = isVerified === 'true';
  if (search && search !== '') {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  console.log('MongoDB query:', query);
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 });

  console.log(`✅ Found ${users.length} users`);
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

// @desc    Get platform-wide analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Run all aggregations in parallel for performance
  const [
    usersByRole,
    ordersByStatus,
    revenueStats,
    ordersOverTime,
    listingsByStatus,
    topCrops,
    districtActivity,
    moderationActivity,
    totalOrders,
    completedOrders,
    totalUsers,
    activeListings,
  ] = await Promise.all([
    // Users grouped by role
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),

    // Orders grouped by status
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),

    // Revenue from confirmed transactions
    Transaction.aggregate([
      { $match: { status: { $in: ['captured', 'transferred'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount.totalAmount' },
          platformFees: { $sum: '$amount.platformFee' },
          deliveryFees: { $sum: '$amount.deliveryFee' },
          productRevenue: { $sum: '$amount.productAmount' },
          count: { $sum: 1 },
        },
      },
    ]),

    // Orders per day over last 30 days
    Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Products grouped by status
    Product.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

    // Top 10 crops by quantity traded in confirmed/completed orders
    Order.aggregate([
      { $match: { orderStatus: { $in: ['confirmed', 'completed'] } } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.cropName',
          totalQuantity: { $sum: '$quantity' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]),

    // Top 10 districts by number of product listings
    Product.aggregate([
      {
        $group: {
          _id: '$location.district',
          listings: { $sum: 1 },
          activeFarmers: { $addToSet: '$farmer' },
        },
      },
      {
        $project: {
          district: '$_id',
          listings: 1,
          farmerCount: { $size: '$activeFarmers' },
        },
      },
      { $sort: { listings: -1 } },
      { $limit: 10 },
    ]),

    // Moderation actions (approve/reject) in last 30 days with avg response time
    Product.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'rejected'] },
          moderatedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgTime: { $avg: { $subtract: ['$moderatedAt', '$createdAt'] } },
        },
      },
    ]),

    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'completed' }),
    User.countDocuments(),
    Product.countDocuments({ status: 'approved' }),
  ]);

  const completionRate =
    totalOrders > 0 ? parseFloat(((completedOrders / totalOrders) * 100).toFixed(1)) : 0;

  res.status(200).json({
    success: true,
    data: {
      kpis: {
        totalUsers,
        totalOrders,
        completionRate,
        activeListings,
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          platformFees: 0,
          deliveryFees: 0,
          productRevenue: 0,
          count: 0,
        },
      },
      usersByRole,
      ordersByStatus,
      ordersOverTime,
      listingsByStatus,
      topCrops,
      districtActivity,
      moderationActivity,
    },
  });
});

// @desc    Get a non-sensitive summary of a single user (counts only)
// @route   GET /api/admin/users/:id/summary
// @access  Private/Admin
const getUserSummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name role isActive isVerified createdAt farmLocation baseLocation vehicleType'
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let activitySummary = {};

  if (user.role === 'farmer') {
    const [listings, orderCount] = await Promise.all([
      Product.aggregate([
        { $match: { farmer: user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ farmer: user._id }),
    ]);
    activitySummary = { listings, orderCount };
  } else if (user.role === 'buyer') {
    const orders = await Order.aggregate([
      { $match: { buyer: user._id } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);
    activitySummary = { orders };
  } else if (user.role === 'transporter') {
    const deliveries = await TransporterAssignment.aggregate([
      { $match: { transporter: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    activitySummary = { deliveries };
  }

  res.status(200).json({
    success: true,
    data: {
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      joinedAt: user.createdAt,
      location:
        user.role === 'farmer'
          ? user.farmLocation?.district || null
          : user.role === 'transporter'
          ? user.baseLocation?.district || null
          : null,
      vehicleType: user.role === 'transporter' ? user.vehicleType : undefined,
      activitySummary,
    },
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
  getStats,
  getAnalytics,
  getUserSummary
};
