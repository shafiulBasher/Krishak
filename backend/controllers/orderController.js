const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const DeliverySlot = require('../models/DeliverySlot');

// @desc    Create order(s) from cart items
// @route   POST /api/orders
// @access  Private (Buyer)
const createOrder = asyncHandler(async (req, res) => {
  const { deliveryAddressId, mapLocation, deliverySlot, notes, paymentMethod } = req.body;

  // Get buyer's cart
  const cart = await Cart.findOne({ buyer: req.user._id }).populate('items.product');
  
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  // Validate delivery information
  if (!mapLocation && !deliveryAddressId) {
    res.status(400);
    throw new Error('Please provide a delivery address or map location');
  }

  // Get delivery address if using saved address
  let deliveryInfo = {};
  if (deliveryAddressId) {
    const user = await User.findById(req.user._id);
    const address = user.deliveryAddresses.find(addr => addr._id.toString() === deliveryAddressId);
    if (!address) {
      res.status(400);
      throw new Error('Delivery address not found');
    }
    deliveryInfo = {
      addressLine: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}`,
      thana: address.thana,
      district: address.district,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      coordinates: null
    };
  } else if (mapLocation) {
    deliveryInfo = {
      addressLine: mapLocation.address,
      thana: mapLocation.thana || '',
      district: mapLocation.district || '',
      coordinates: {
        lat: mapLocation.lat,
        lng: mapLocation.lng
      }
    };
  }

  // Create order(s) - one per farmer to ensure direct farmer-buyer relationship
  const farmerMap = {};
  
  // Group items by farmer
  cart.items.forEach(item => {
    const farmerId = item.farmer.toString();
    if (!farmerMap[farmerId]) {
      farmerMap[farmerId] = [];
    }
    farmerMap[farmerId].push(item);
  });

  const createdOrders = [];

  // Create individual order for each farmer
  for (const [farmerId, items] of Object.entries(farmerMap)) {
    let totalPrice = 0;
    let farmItems = [];

    // Validate stock and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product._id);
      if (!product || product.quantity < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product?.cropName || 'product'}`);
      }
      totalPrice += item.totalPrice;
      farmItems.push({
        product: item.product._id,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        totalPrice: item.totalPrice
      });
    }

    // Calculate fees
    const platformFee = Math.round(totalPrice * 0.05); // 5% platform fee
    const transportFee = deliverySlot ? 100 : 0; // Example transport fee

    // Generate unique order number
    const timestamp = Date.now().toString().slice(-8);
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const orderNumber = `KR${timestamp}${randomNum}`;

    console.log('Creating order with:', { orderNumber, farmerId, buyer: req.user._id });

    // Create order
    let order;
    try {
      order = await Order.create({
        orderNumber,
        buyer: req.user._id,
        farmer: farmerId,
        product: farmItems[0].product, // Primary product reference
        quantity: farmItems.reduce((sum, item) => sum + item.quantity, 0),
        pricePerUnit: farmItems[0].pricePerUnit,
        totalPrice,
        priceBreakdown: {
          farmerEarnings: totalPrice * 0.95, // 95% to farmer
          platformFee,
          transportFee
        },
        deliveryAddress: {
          ...deliveryInfo,
          isMapBased: !!mapLocation
        },
        paymentMethod: paymentMethod || 'cash_on_delivery',
        notes,
        orderStatus: 'pending',
        deliveryStatus: 'not_assigned',
        isPreOrder: false
      });
      console.log('Order created successfully:', order._id);
    } catch (orderError) {
      console.error('Order creation error:', orderError.message, orderError.errors);
      throw orderError;
    }

    // Reduce product quantity
    for (const item of farmItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
    }

    createdOrders.push(await order.populate('farmer', 'name phone avatar'));
  }

  // Clear cart after successful order creation
  cart.items = [];
  cart.deliveryPreferences = {};
  await cart.save();

  res.status(201).json({
    success: true,
    message: `${createdOrders.length} order(s) created successfully`,
    data: createdOrders
  });
});

// @desc    Get buyer's orders
// @route   GET /api/orders/buyer
// @access  Private (Buyer)
const getBuyerOrders = asyncHandler(async (req, res) => {
  const { status, deliveryStatus, sortBy } = req.query;

  const query = { buyer: req.user._id };
  
  if (status) query.orderStatus = status;
  if (deliveryStatus) query.deliveryStatus = deliveryStatus;

  const orders = await Order.find(query)
    .populate('product', 'cropName grade photos')
    .populate('farmer', 'name phone avatar')
    .sort(sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Get farmer's orders
// @route   GET /api/orders/farmer
// @access  Private (Farmer)
const getFarmerOrders = asyncHandler(async (req, res) => {
  const { status, deliveryStatus, sortBy } = req.query;

  const query = { farmer: req.user._id };
  
  if (status) query.orderStatus = status;
  if (deliveryStatus) query.deliveryStatus = deliveryStatus;

  const orders = await Order.find(query)
    .populate('buyer', 'name phone avatar')
    .populate('product', 'cropName grade photos')
    .sort(sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 });

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
    .populate('buyer', 'name phone avatar deliveryAddresses')
    .populate('farmer', 'name phone avatar farmLocation')
    .populate('product', 'cropName grade photos')
    .populate('transporter', 'name phone vehicleNumber');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check authorization
  if (order.buyer._id.toString() !== req.user._id.toString() &&
      order.farmer._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Update order status (Farmer)
// @route   PUT /api/orders/:id/status
// @access  Private (Farmer, Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, photo } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check authorization
  if (order.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  // Validate status transition
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  order.orderStatus = status;
  
  // Add status history
  order.statusHistory.push({
    status,
    note,
    photo
  });

  if (status === 'completed') {
    order.actualDeliveryDate = new Date();
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order status updated',
    data: order
  });
});

// @desc    Update delivery status (Transporter)
// @route   PUT /api/orders/:id/delivery-status
// @access  Private (Transporter, Admin)
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { deliveryStatus, note, photo } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check authorization
  if (order.transporter && order.transporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  // Validate status
  const validStatuses = ['not_assigned', 'assigned', 'picked', 'in_transit', 'delivered'];
  if (!validStatuses.includes(deliveryStatus)) {
    res.status(400);
    throw new Error('Invalid delivery status');
  }

  order.deliveryStatus = deliveryStatus;
  
  // Add to status history
  order.statusHistory.push({
    status: `delivery_${deliveryStatus}`,
    note,
    photo
  });

  if (deliveryStatus === 'delivered') {
    order.actualDeliveryDate = new Date();
  }

  await order.save();

  res.json({
    success: true,
    message: 'Delivery status updated',
    data: order
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Buyer, Farmer)
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check authorization
  if (order.buyer.toString() !== req.user._id.toString() && 
      order.farmer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Cannot cancel if already completed or in transit
  if (['completed', 'in_transit', 'picked'].includes(order.deliveryStatus)) {
    res.status(400);
    throw new Error('Cannot cancel order that is already in transit or completed');
  }

  // Restore product quantity
  await Product.findByIdAndUpdate(
    order.product,
    { $inc: { quantity: order.quantity } },
    { new: true }
  );

  order.orderStatus = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    note: reason || 'Order cancelled'
  });

  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// @desc    Rate order
// @route   PUT /api/orders/:id/rate
// @access  Private
const rateOrder = asyncHandler(async (req, res) => {
  const { rating, review, rateType } = req.body; // rateType: 'buyer', 'farmer', 'transporter'

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Buyer rates farmer
  if (req.user._id.toString() === order.buyer.toString() && rateType === 'farmer') {
    order.farmerRating = {
      rating,
      review,
      createdAt: new Date()
    };
    
    // Update farmer's rating
    const farmer = await User.findById(order.farmer);
    farmer.rating.count += 1;
    farmer.rating.average = (farmer.rating.average * (farmer.rating.count - 1) + rating) / farmer.rating.count;
    await farmer.save();
  }

  // Buyer rates transporter
  else if (req.user._id.toString() === order.buyer.toString() && rateType === 'transporter' && order.transporter) {
    order.transporterRating = {
      rating,
      review,
      createdAt: new Date()
    };

    const transporter = await User.findById(order.transporter);
    transporter.rating.count += 1;
    transporter.rating.average = (transporter.rating.average * (transporter.rating.count - 1) + rating) / transporter.rating.count;
    await transporter.save();
  }

  // Farmer rates buyer
  else if (req.user._id.toString() === order.farmer.toString() && rateType === 'buyer') {
    order.buyerRating = {
      rating,
      review,
      createdAt: new Date()
    };

    const buyer = await User.findById(order.buyer);
    buyer.rating.count += 1;
    buyer.rating.average = (buyer.rating.average * (buyer.rating.count - 1) + rating) / buyer.rating.count;
    await buyer.save();
  }

  else {
    res.status(403);
    throw new Error('Not authorized to rate this order');
  }

  await order.save();

  res.json({
    success: true,
    message: 'Rating submitted successfully',
    data: order
  });
});

// @desc    Get available delivery slots for a district
// @route   GET /api/orders/delivery-slots
// @access  Public
const getDeliverySlots = asyncHandler(async (req, res) => {
  const { district, thana } = req.query;

  const query = { isActive: true };
  if (district) query['coverage.district'] = district;
  if (thana) query['coverage.thana'] = thana;

  const slots = await DeliverySlot.find(query);

  res.json({
    success: true,
    count: slots.length,
    data: slots
  });
});

module.exports = {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  getOrder,
  updateOrderStatus,
  updateDeliveryStatus,
  cancelOrder,
  rateOrder,
  getDeliverySlots
};
