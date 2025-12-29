const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Buyer only)
const createOrder = asyncHandler(async (req, res) => {
  const { productId, quantity, pricePerUnit, deliveryAddress, paymentMethod, isPreOrder } = req.body;

  // Find the product
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if product is available
  if (product.status !== 'approved') {
    res.status(400);
    throw new Error('Product is not available for ordering');
  }

  // For pre-orders, check if it's a pre-order product
  if (isPreOrder && !product.isPreOrder) {
    res.status(400);
    throw new Error('This product does not support pre-orders');
  }

  // Check quantity availability
  if (quantity > product.quantity) {
    res.status(400);
    throw new Error('Requested quantity exceeds available stock');
  }

  // Calculate total price
  const totalPrice = quantity * pricePerUnit;

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  // Create order
  const order = await Order.create({
    orderNumber,
    buyer: req.user._id,
    farmer: product.farmer,
    product: productId,
    quantity,
    pricePerUnit,
    totalPrice,
    priceBreakdown: {
      farmerEarnings: totalPrice * 0.9, // 90% to farmer
      platformFee: totalPrice * 0.05,   // 5% platform
      transportFee: totalPrice * 0.05    // 5% transport
    },
    deliveryAddress,
    paymentMethod,
    isPreOrder: isPreOrder || false,
    estimatedDeliveryDate: product.expectedHarvestDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week default
  });

  // Update product quantity (reserve for pre-order or reduce for regular)
  if (isPreOrder) {
    // For pre-orders, don't reduce quantity yet, just mark as reserved
    product.status = 'pending'; // Or add a reserved status
  } else {
    product.quantity -= quantity;
    if (product.quantity <= 0) {
      product.status = 'sold';
    }
  }
  await product.save();

  res.status(201).json({
    success: true,
    data: order
  });
});

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    $or: [{ buyer: req.user._id }, { farmer: req.user._id }]
  })
    .populate('product', 'cropName grade photos')
    .populate('buyer', 'name email phone')
    .populate('farmer', 'name email phone')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('product')
    .populate('buyer', 'name email phone')
    .populate('farmer', 'name email phone')
    .populate('transporter', 'name email phone');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is buyer, farmer, or transporter
  if (order.buyer.toString() !== req.user._id.toString() &&
      order.farmer.toString() !== req.user._id.toString() &&
      order.transporter?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Farmer/Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check permissions
  if (req.user.role !== 'admin' && order.farmer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  order.orderStatus = status;
  order.statusHistory.push({
    status,
    note
  });

  await order.save();

  res.json({
    success: true,
    data: order
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus
};