const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { notifyOrderPlaced, notifyOrderCancelled, notifyOrderCompleted } = require('../utils/notificationHelper');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Buyer only)
const createOrder = asyncHandler(async (req, res) => {
  const { productId, quantity, pricePerUnit, deliveryAddress, paymentMethod, isPreOrder, deliverySlot, notes, vehicleType, deliveryFee } = req.body;

  // Validate required fields
  if (!productId || !quantity || !pricePerUnit || !deliveryAddress) {
    res.status(400);
    throw new Error('Missing required fields: productId, quantity, pricePerUnit, deliveryAddress');
  }

  // Start a session for atomic transaction
  const session = await Product.startSession();
  session.startTransaction();

  try {
    // Find the product with lock to prevent race conditions
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if product is available
    if (product.status !== 'approved') {
      throw new Error(`Product is not available for ordering. Current status: ${product.status}`);
    }

    // For pre-orders, check if it's a pre-order product
    if (isPreOrder && !product.isPreOrder) {
      throw new Error('This product does not support pre-orders');
    }

    // Check quantity availability first
    if (quantity > product.quantity) {
      throw new Error(`Insufficient stock. Available: ${product.quantity} ${product.unit}, Requested: ${quantity} ${product.unit}`);
    }

    // Check minimum order quantity (MOQ) only if there's enough stock to meet MOQ
    // If remaining stock is less than MOQ, allow ordering whatever is available
    if (product.quantity >= product.moq && quantity < product.moq) {
      throw new Error(`Minimum order quantity is ${product.moq} ${product.unit}. You requested ${quantity} ${product.unit}`);
    }

    // Calculate total price
    const totalPrice = quantity * pricePerUnit;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Calculate estimated delivery date
    let estimatedDeliveryDate;
    if (deliverySlot?.estimatedDateTime) {
      estimatedDeliveryDate = new Date(deliverySlot.estimatedDateTime);
    } else if (deliverySlot?.date) {
      estimatedDeliveryDate = new Date(deliverySlot.date);
    } else {
      estimatedDeliveryDate = product.expectedHarvestDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week default
    }

    // Calculate actual delivery fee and platform fee
    const actualDeliveryFee = deliveryFee || totalPrice * 0.05;
    const platformFee = Math.round((totalPrice + actualDeliveryFee) * 0.05);
    const farmerEarnings = totalPrice - platformFee;

    // Create order
    const order = await Order.create([{
      orderNumber,
      buyer: req.user._id,
      farmer: product.farmer,
      product: productId,
      quantity,
      pricePerUnit,
      totalPrice,
      priceBreakdown: {
        farmerEarnings: farmerEarnings,
        platformFee: platformFee,
        transportFee: actualDeliveryFee
      },
      deliveryAddress,
      paymentMethod,
      orderStatus: 'confirmed', // Auto-confirm orders when placed
      isPreOrder: isPreOrder || false,
      estimatedDeliveryDate,
      // Add vehicle type if provided
      deliveryVehicle: vehicleType ? {
        type: vehicleType,
      } : undefined,
      // Add delivery fee details
      deliveryFeeDetails: vehicleType ? {
        vehicleType: vehicleType,
        totalFee: actualDeliveryFee,
        calculatedAt: new Date(),
      } : undefined,
      deliverySlot: deliverySlot ? {
        date: deliverySlot.date ? new Date(deliverySlot.date) : undefined,
        timeSlot: deliverySlot.timeSlot,
        estimatedDateTime: deliverySlot.estimatedDateTime ? new Date(deliverySlot.estimatedDateTime) : undefined
      } : undefined,
      notes: notes || undefined,
      statusHistory: [
        {
          status: 'confirmed',
          note: 'Order placed and confirmed automatically',
          timestamp: new Date()
        }
      ]
    }], { session });

    // Update product quantity (reserve for pre-order or reduce for regular)
    if (isPreOrder) {
      // For pre-orders, don't reduce quantity yet, just mark as reserved
      product.status = 'pending';
    } else {
      // Deduct ordered quantity from available stock
      const newQuantity = product.quantity - quantity;
      product.quantity = newQuantity;
      
      // Update product status based on remaining quantity
      if (newQuantity <= 0) {
        product.status = 'sold';
        console.log(`✅ Product ${product._id} marked as SOLD (quantity: ${newQuantity})`);
      } else {
        // Keep product as 'approved' even if below MOQ - buyers can still purchase remaining stock
        console.log(`✅ Product ${product._id} quantity updated: ${product.quantity + quantity} → ${newQuantity} ${product.unit}`);
      }
    }
    
    await product.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Send notifications
    await notifyOrderPlaced(order[0]);

    console.log(`✅ Order created & CONFIRMED: ${orderNumber} | Buyer: ${req.user._id} | Farmer: ${product.farmer} | Product: ${product.cropName} | Qty: ${quantity}${product.unit} | Total: ৳${totalPrice}`);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order[0]
    });

  } catch (error) {
    // Abort transaction only once if it's still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
});

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    $or: [{ buyer: req.user._id }, { farmer: req.user._id }]
  })
    .populate('product', 'cropName grade photos unit')
    .populate('buyer', 'name email phone')
    .populate('farmer', 'name email phone')
    .populate('transporter', 'name email phone vehicleDetails')
    .sort({ createdAt: -1 });

  // Format orders with deliveryInfo for frontend compatibility
  const formattedOrders = orders.map(order => {
    const orderObj = order.toObject();
    return {
      ...orderObj,
      deliveryInfo: {
        status: orderObj.deliveryStatus,
        transporter: orderObj.transporter,
        statusHistory: orderObj.statusHistory || [],
        pickupPhoto: orderObj.pickupPhoto || null,
        deliveryProofPhoto: orderObj.deliveryProofPhoto || null
      }
    };
  });

  res.json({
    success: true,
    count: formattedOrders.length,
    data: formattedOrders
  });
});

// @desc    Get buyer dashboard stats
// @route   GET /api/orders/stats/buyer
// @access  Private (Buyer only)
const getBuyerStats = asyncHandler(async (req, res) => {
  console.log('✅ getBuyerStats endpoint called for buyer:', req.user._id);
  const buyerId = req.user._id;

  // Get all buyer's orders
  const allOrders = await Order.find({ buyer: buyerId });

  // Calculate stats
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(order => order.orderStatus === 'pending').length;
  const confirmedOrders = allOrders.filter(order => order.orderStatus === 'confirmed').length;
  const completedOrders = allOrders.filter(order => order.orderStatus === 'completed').length;
  const cancelledOrders = allOrders.filter(order => order.orderStatus === 'cancelled').length;

  // Calculate total spent (from all orders regardless of status)
  const totalSpent = allOrders.reduce((sum, order) => {
    return sum + (order.totalPrice || 0);
  }, 0);

  // Calculate total spent on completed orders only
  const totalSpentCompleted = allOrders
    .filter(order => order.orderStatus === 'completed')
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      completedOrders,
      cancelledOrders,
      totalSpent,
      totalSpentCompleted
    }
  });
});

// @desc    Get transporter dashboard stats
// @route   GET /api/orders/stats/transporter
// @access  Private (Transporter only)
const getTransporterStats = asyncHandler(async (req, res) => {
  const transporterId = req.user._id;

  // Get all orders assigned to this transporter
  const allOrders = await Order.find({ transporter: transporterId });

  // Calculate stats
  const totalDeliveries = allOrders.length;
  const activeDeliveries = allOrders.filter(order => 
    order.deliveryStatus === 'assigned' || 
    order.deliveryStatus === 'picked' || 
    order.deliveryStatus === 'in_transit'
  ).length;
  const completedTrips = allOrders.filter(order => 
    order.deliveryStatus === 'delivered' || 
    order.orderStatus === 'completed'
  ).length;
  const pendingAssignments = allOrders.filter(order => 
    order.deliveryStatus === 'not_assigned'
  ).length;

  // Calculate total earnings from completed deliveries
  const completedDeliveries = allOrders.filter(order => 
    order.deliveryStatus === 'delivered' || 
    order.orderStatus === 'completed'
  );
  
  const totalEarnings = completedDeliveries.reduce((sum, order) => {
    return sum + (order.priceBreakdown?.transportFee || 0);
  }, 0);

  res.json({
    success: true,
    data: {
      totalDeliveries,
      activeDeliveries,
      completedTrips,
      pendingAssignments,
      totalEarnings
    }
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
    .populate('transporter', 'name email phone vehicleDetails');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is buyer, farmer, transporter, or admin
  const isBuyer = order.buyer._id.toString() === req.user._id.toString();
  const isFarmer = order.farmer._id.toString() === req.user._id.toString();
  const isTransporter = order.transporter?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isBuyer && !isFarmer && !isTransporter && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  // Format deliveryInfo for frontend compatibility
  const formattedOrder = {
    ...order.toObject(),
    deliveryInfo: {
      status: order.deliveryStatus,
      transporter: order.transporter,
      statusHistory: order.statusHistory || [],
      pickupPhoto: order.pickupPhoto || null,
      deliveryProofPhoto: order.deliveryProofPhoto || null
    }
  };

  res.json({
    success: true,
    data: formattedOrder
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Farmer/Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  // Validate status
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await Order.findById(req.params.id).populate('product');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check permissions
  if (req.user.role !== 'admin' && 
      order.farmer.toString() !== req.user._id.toString() && 
      order.buyer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  // Get the old status before updating
  const oldStatus = order.orderStatus;

  // If order is being cancelled, restore product quantity
  if (status === 'cancelled' && oldStatus !== 'cancelled') {
    const product = await Product.findById(order.product._id);
    
    if (product && !order.isPreOrder) {
      // Restore the quantity back to the product
      const restoredQuantity = product.quantity + order.quantity;
      product.quantity = restoredQuantity;
      
      // If product was marked as 'sold', change it back to 'approved'
      if (product.status === 'sold') {
        product.status = 'approved';
        console.log(`✅ Product ${product._id} restored to APPROVED (quantity restored: ${restoredQuantity} ${product.unit})`);
      } else {
        console.log(`✅ Product ${product._id} quantity restored: ${product.quantity - order.quantity} → ${restoredQuantity} ${product.unit}`);
      }
      
      await product.save();
    }

    // Send cancellation notification
    await notifyOrderCancelled(order, req.user._id);

    console.log(`⚠️ Order ${order.orderNumber} cancelled | Quantity restored: ${order.quantity} ${order.product.unit}`);
  }

  // Update order status
  order.orderStatus = status;
  order.statusHistory.push({
    status,
    note: note || `Status updated to ${status}`,
    timestamp: new Date()
  });

  await order.save();

  // Send completion notification
  if (status === 'completed' && oldStatus !== 'completed') {
    await notifyOrderCompleted(order);
  }

  res.json({
    success: true,
    message: `Order status updated to ${status}`,
    data: order
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getBuyerStats,
  getTransporterStats
};