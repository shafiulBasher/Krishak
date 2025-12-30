const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get available delivery jobs for transporter
// @route   GET /api/transporter/jobs
// @access  Private (Transporter only)
const getAvailableJobs = asyncHandler(async (req, res) => {
  const { district } = req.query;
  const transporterId = req.user._id;

  // Get transporter's district from their profile
  const transporter = await User.findById(transporterId);
  const transporterDistrict = district || transporter.district || transporter.location?.district;

  // Find orders that need delivery (confirmed orders without a transporter assigned)
  const query = {
    orderStatus: 'confirmed',
    deliveryStatus: 'not_assigned',
    transporter: { $exists: false }
  };

  // Filter by district if available
  if (transporterDistrict) {
    query['deliveryAddress.district'] = new RegExp(transporterDistrict, 'i');
  }

  const availableJobs = await Order.find(query)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: availableJobs.length,
    data: availableJobs
  });
});

// @desc    Accept a delivery job
// @route   POST /api/transporter/jobs/:orderId/accept
// @access  Private (Transporter only)
const acceptJob = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const transporterId = req.user._id;

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.transporter) {
    res.status(400);
    throw new Error('This job has already been assigned to another transporter');
  }

  if (order.deliveryStatus !== 'not_assigned') {
    res.status(400);
    throw new Error('This job is no longer available');
  }

  // Assign the transporter
  order.transporter = transporterId;
  order.deliveryStatus = 'assigned';
  order.statusHistory.push({
    status: 'assigned',
    timestamp: new Date(),
    note: `Assigned to transporter: ${req.user.name}`
  });

  // Set estimated delivery date (e.g., 2 days from now)
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + 2);
  order.estimatedDeliveryDate = estimatedDate;

  await order.save();

  const populatedOrder = await Order.findById(order._id)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location');

  res.json({
    success: true,
    message: 'Job accepted successfully',
    data: populatedOrder
  });
});

// @desc    Update delivery status
// @route   PUT /api/transporter/jobs/:orderId/status
// @access  Private (Transporter only)
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, note, photo } = req.body;
  const transporterId = req.user._id;

  const validStatuses = ['picked', 'in_transit', 'delivered'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.transporter.toString() !== transporterId.toString()) {
    res.status(403);
    throw new Error('You are not assigned to this delivery');
  }

  // Validate status workflow
  const statusFlow = {
    'assigned': ['picked'],
    'picked': ['in_transit'],
    'in_transit': ['delivered']
  };

  if (!statusFlow[order.deliveryStatus]?.includes(status)) {
    res.status(400);
    throw new Error(`Cannot change status from '${order.deliveryStatus}' to '${status}'`);
  }

  // For 'picked' status, photo is mandatory
  if (status === 'picked' && !photo) {
    res.status(400);
    throw new Error('Pickup photo is mandatory when marking as picked. Please upload a photo of the product.');
  }

  // Update delivery status
  order.deliveryStatus = status;
  
  // Store pickup photo
  if (status === 'picked' && photo) {
    order.pickupPhoto = {
      url: photo,
      uploadedAt: new Date(),
      uploadedBy: transporterId
    };
  }

  // Store delivery proof photo (optional)
  if (status === 'delivered' && photo) {
    order.deliveryProofPhoto = {
      url: photo,
      uploadedAt: new Date(),
      uploadedBy: transporterId
    };
  }

  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Status updated to ${status}`,
    photo: photo || null
  });

  // If delivered, update order status and actual delivery date
  if (status === 'delivered') {
    order.orderStatus = 'completed';
    order.actualDeliveryDate = new Date();
  }

  await order.save();

  const populatedOrder = await Order.findById(order._id)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location')
    .populate('transporter', 'name phone');

  res.json({
    success: true,
    message: `Delivery status updated to ${status}`,
    data: populatedOrder
  });
});

// @desc    Get transporter's assigned deliveries
// @route   GET /api/transporter/my-deliveries
// @access  Private (Transporter only)
const getMyDeliveries = asyncHandler(async (req, res) => {
  const transporterId = req.user._id;
  const { status } = req.query;

  const query = { transporter: transporterId };
  
  if (status) {
    query.deliveryStatus = status;
  }

  const deliveries = await Order.find(query)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: deliveries.length,
    data: deliveries
  });
});

// @desc    Get transporter dashboard stats
// @route   GET /api/transporter/stats
// @access  Private (Transporter only)
const getTransporterStats = asyncHandler(async (req, res) => {
  const transporterId = req.user._id;

  // Get active deliveries (assigned, picked, in_transit)
  const activeDeliveries = await Order.countDocuments({
    transporter: transporterId,
    deliveryStatus: { $in: ['assigned', 'picked', 'in_transit'] }
  });

  // Get completed deliveries
  const completedDeliveries = await Order.countDocuments({
    transporter: transporterId,
    deliveryStatus: 'delivered'
  });

  // Calculate total earnings from completed deliveries
  const completedOrders = await Order.find({
    transporter: transporterId,
    deliveryStatus: 'delivered'
  });

  const totalEarnings = completedOrders.reduce((sum, order) => {
    return sum + (order.priceBreakdown?.transportFee || 0);
  }, 0);

  // Get pending jobs count (available in transporter's area)
  const transporter = await User.findById(transporterId);
  const transporterDistrict = transporter.district || transporter.location?.district;
  
  let pendingJobsQuery = {
    orderStatus: 'confirmed',
    deliveryStatus: 'not_assigned',
    transporter: { $exists: false }
  };
  
  if (transporterDistrict) {
    pendingJobsQuery['deliveryAddress.district'] = new RegExp(transporterDistrict, 'i');
  }
  
  const pendingJobs = await Order.countDocuments(pendingJobsQuery);

  // Calculate average rating
  const ratedOrders = await Order.find({
    transporter: transporterId,
    'transporterRating.rating': { $exists: true }
  });

  let averageRating = 0;
  if (ratedOrders.length > 0) {
    const totalRating = ratedOrders.reduce((sum, order) => {
      return sum + (order.transporterRating?.rating || 0);
    }, 0);
    averageRating = totalRating / ratedOrders.length;
  }

  res.json({
    success: true,
    data: {
      activeDeliveries,
      completedDeliveries,
      totalEarnings,
      pendingJobs,
      averageRating: averageRating.toFixed(1),
      totalRatings: ratedOrders.length
    }
  });
});

// @desc    Get single delivery details
// @route   GET /api/transporter/jobs/:orderId
// @access  Private (Transporter only)
const getDeliveryDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const transporterId = req.user._id;

  const order = await Order.findById(orderId)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location grade quantity')
    .populate('transporter', 'name phone');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if transporter has access (either assigned or it's an available job)
  const isAssigned = order.transporter && order.transporter._id.toString() === transporterId.toString();
  const isAvailable = order.deliveryStatus === 'not_assigned';

  if (!isAssigned && !isAvailable) {
    res.status(403);
    throw new Error('You do not have access to this delivery');
  }

  res.json({
    success: true,
    data: order
  });
});

module.exports = {
  getAvailableJobs,
  acceptJob,
  updateDeliveryStatus,
  getMyDeliveries,
  getTransporterStats,
  getDeliveryDetails
};
