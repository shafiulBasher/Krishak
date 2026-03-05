const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const { notifyDeliveryAssigned, notifyDeliveryPicked, notifyDeliveryInTransit, notifyOrderDelivered } = require('../utils/notificationHelper');
const { calculateStraightLineDistance } = require('../utils/distanceCalculator');

// @desc    Get available delivery jobs for transporter
// @route   GET /api/transporter/jobs
// @access  Private (Transporter only)
const getAvailableJobs = asyncHandler(async (req, res) => {
  const transporterId = req.user._id;

  // Get transporter's base location and service preferences
  const transporter = await User.findById(transporterId);
  const transporterLocation = transporter.baseLocation?.coordinates;
  const MAX_DISTANCE_KM = transporter.transporterProfile?.maxServiceRadius || 50;
  // Van: 30km cap on BOTH pickup range (transporter→farmer) AND delivery route (farmer→buyer)
  // Pickup/Truck: standard 50km pickup range, no delivery route cap
  const isVan = transporter.vehicleType === 'van';
  const VAN_MAX_KM = 30; // applies to both pickup range and delivery route for vans
  const EFFECTIVE_MAX_DISTANCE_KM = isVan ? VAN_MAX_KM : MAX_DISTANCE_KM;

  // Find orders that need delivery (confirmed orders without a transporter assigned)
  const query = {
    orderStatus: 'confirmed',
    deliveryStatus: 'not_assigned',
  };

  // Vehicle-type matching:
  // - Transporter with a known vehicle type sees ONLY jobs requesting that type
  //   OR jobs with NO vehicle type specified (untyped / legacy orders).
  // - Transporter with NO vehicle type set sees ONLY unspecified orders.
  // Query uses deliveryFeeDetails.vehicleType (plain String field, no Mongoose
  // nested-'type' keyword ambiguity like deliveryVehicle.type has).
  const knownVehicleTypes = ['van', 'pickup', 'truck'];
  const hasValidVehicleType = transporter.vehicleType && knownVehicleTypes.includes(transporter.vehicleType);

  if (hasValidVehicleType) {
    query.$or = [
      { 'deliveryFeeDetails.vehicleType': transporter.vehicleType }, // exact match
      { 'deliveryFeeDetails.vehicleType': { $exists: false } },      // legacy orders (no vehicle selected)
      { 'deliveryFeeDetails.vehicleType': null },                    // explicitly unspecified
    ];
  } else {
    // No vehicle type set — only show orders where no vehicle type was required
    query.$or = [
      { 'deliveryFeeDetails.vehicleType': { $exists: false } },
      { 'deliveryFeeDetails.vehicleType': null },
    ];
  }

  const availableJobs = await Order.find(query)
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone farmLocation')
    .populate('product', 'cropName photos location')
    .sort({ createdAt: -1 });

  // Calculate distances and annotate jobs
  const jobsWithDistance = availableJobs.map(job => {
    let farmerDistance = null;
    let buyerDistance = null;
    let deliveryDistance = null; // farmer→buyer route (actual delivery distance)
    let isWithinRange = true;
    let distanceWarning = null;

    // Calculate distance to farmer (pickup) — determines job availability for all vehicle types
    if (transporterLocation && job.farmer?.farmLocation?.coordinates) {
      farmerDistance = calculateStraightLineDistance(
        transporterLocation,
        job.farmer.farmLocation.coordinates
      );
      if (farmerDistance > EFFECTIVE_MAX_DISTANCE_KM) {
        isWithinRange = false;
        distanceWarning = isVan
          ? `Pickup location is ${farmerDistance.toFixed(1)}km away (van limit: ${VAN_MAX_KM}km)`
          : `Pickup location is ${farmerDistance.toFixed(1)}km away (limit: ${MAX_DISTANCE_KM}km)`;
      }
    }

    // Calculate transporter→buyer distance — informational
    if (transporterLocation && job.deliveryAddress?.coordinates) {
      buyerDistance = calculateStraightLineDistance(
        transporterLocation,
        job.deliveryAddress.coordinates
      );
    }

    // Calculate farmer→buyer delivery route distance
    if (job.farmer?.farmLocation?.coordinates && job.deliveryAddress?.coordinates) {
      deliveryDistance = calculateStraightLineDistance(
        job.farmer.farmLocation.coordinates,
        job.deliveryAddress.coordinates
      );
    }

    // Van drivers: enforce 50km cap on the farmer→buyer delivery route
    // Vans are small local-delivery vehicles; trucks handle long-distance inter-city deliveries
    if (isWithinRange && isVan && deliveryDistance !== null && deliveryDistance > VAN_MAX_KM) {
      isWithinRange = false;
      distanceWarning = `Delivery route is ${deliveryDistance.toFixed(1)}km (van limit: ${VAN_MAX_KM}km — use pickup or truck for longer routes)`;
    }

    return {
      ...job.toObject(),
      distances: {
        toFarmer: farmerDistance,
        toBuyer: buyerDistance,
        pickupDistance: farmerDistance,   // transporter→farmer
        deliveryDistance: deliveryDistance // farmer→buyer route
      },
      isWithinRange,
      distanceWarning
    };
  });

  // Sort: within range jobs first, then by pickup distance (transporter→farmer)
  jobsWithDistance.sort((a, b) => {
    if (a.isWithinRange && !b.isWithinRange) return -1;
    if (!a.isWithinRange && b.isWithinRange) return 1;
    return (a.distances.pickupDistance || 0) - (b.distances.pickupDistance || 0);
  });

  res.json({
    success: true,
    count: jobsWithDistance.length,
    data: jobsWithDistance,
    transporterLocation: transporterLocation || null,
    maxServiceRadius: EFFECTIVE_MAX_DISTANCE_KM,
    hasNoVehicleType: !hasValidVehicleType,
    vehicleType: transporter.vehicleType || null,
  });
});

// @desc    Accept a delivery job
// @route   POST /api/transporter/jobs/:orderId/accept
// @access  Private (Transporter only)
const acceptJob = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const transporterId = req.user._id;

  const order = await Order.findById(orderId)
    .populate('farmer', 'farmLocation')
    .populate('buyer', 'name');

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

  // Verify distance is within service radius
  const transporter = await User.findById(transporterId);
  const transporterLocation = transporter.baseLocation?.coordinates;
  const MAX_DISTANCE_KM = transporter.transporterProfile?.maxServiceRadius || 50;

  // Vehicle type check: use deliveryFeeDetails.vehicleType (reliable plain String)
  // Fall back to deliveryVehicle.type for orders created before this was standardised
  const orderVehicleType = order.deliveryFeeDetails?.vehicleType || order.deliveryVehicle?.type;
  if (orderVehicleType && transporter.vehicleType && orderVehicleType !== transporter.vehicleType) {
    res.status(400);
    throw new Error(`This delivery job requires a ${orderVehicleType}. Your registered vehicle type is ${transporter.vehicleType}.`);
  }

  const isVan = transporter.vehicleType === 'van';
  const EFFECTIVE_MAX_DISTANCE_KM = isVan ? 30 : MAX_DISTANCE_KM;

  if (transporterLocation) {
    // Check pickup distance — vans use 30km cap, others use their configured service radius
    if (order.farmer?.farmLocation?.coordinates) {
      const farmerDistance = calculateStraightLineDistance(
        transporterLocation,
        order.farmer.farmLocation.coordinates
      );
      if (farmerDistance > EFFECTIVE_MAX_DISTANCE_KM) {
        res.status(400);
        throw new Error(
          isVan
            ? `This job is outside van range. Pickup is ${farmerDistance.toFixed(1)}km away (van limit: 30km).`
            : `This job is outside your service radius. Pickup location is ${farmerDistance.toFixed(1)}km away (your limit: ${MAX_DISTANCE_KM}km)`
        );
      }
    }
  }

  // Van drivers: enforce 30km cap on farmer→buyer delivery route
  if (isVan && order.farmer?.farmLocation?.coordinates && order.deliveryAddress?.coordinates) {
    const deliveryDistance = calculateStraightLineDistance(
      order.farmer.farmLocation.coordinates,
      order.deliveryAddress.coordinates
    );
    if (deliveryDistance > 30) {
      res.status(400);
      throw new Error(`This delivery route is ${deliveryDistance.toFixed(1)}km, which exceeds the 30km limit for van vehicles. Use a pickup or truck for longer routes.`);
    }
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

  // Send notification
  await notifyDeliveryAssigned(order, transporterId);

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
    console.log('✅ Pickup photo saved to order:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      photoUrl: photo
    });
  }

  // Store delivery proof photo (optional)
  if (status === 'delivered' && photo) {
    order.deliveryProofPhoto = {
      url: photo,
      uploadedAt: new Date(),
      uploadedBy: transporterId
    };
    console.log('✅ Delivery photo saved to order:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      photoUrl: photo
    });
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
    // Auto-mark cash-on-delivery as paid — transporter collected cash at door
    if (order.paymentMethod === 'cash_on_delivery') {
      order.paymentStatus = 'paid';
    }
  }

  await order.save();

  // Send notifications based on status
  if (status === 'picked') {
    console.log('📧 Sending picked notification for order:', order.orderNumber);
    await notifyDeliveryPicked(order);
  } else if (status === 'in_transit') {
    console.log('📧 Sending in_transit notification for order:', order.orderNumber);
    await notifyDeliveryInTransit(order);
  } else if (status === 'delivered') {
    console.log('📧 Sending delivered notification for order:', order.orderNumber);
    await notifyOrderDelivered(order);
    console.log('✅ Delivered notification completed for order:', order.orderNumber);
  }

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

  // Get pending jobs count — same filters as getAvailableJobs:
  // 1. vehicle-type match  2. within 50km (or 30km for van) pickup range
  const transporter = await User.findById(transporterId);
  const transporterLocation = transporter.baseLocation?.coordinates;
  const isVan = transporter.vehicleType === 'van';
  const MAX_DISTANCE_KM = transporter.transporterProfile?.maxServiceRadius || 50;
  const EFFECTIVE_MAX_KM = isVan ? 30 : MAX_DISTANCE_KM;

  const knownVehicleTypes = ['van', 'pickup', 'truck'];
  const hasValidVehicleType = transporter.vehicleType && knownVehicleTypes.includes(transporter.vehicleType);

  let pendingJobsQuery = {
    orderStatus: 'confirmed',
    deliveryStatus: 'not_assigned',
  };

  if (hasValidVehicleType) {
    pendingJobsQuery.$or = [
      { 'deliveryFeeDetails.vehicleType': transporter.vehicleType },
      { 'deliveryFeeDetails.vehicleType': { $exists: false } },
      { 'deliveryFeeDetails.vehicleType': null },
    ];
  } else {
    pendingJobsQuery.$or = [
      { 'deliveryFeeDetails.vehicleType': { $exists: false } },
      { 'deliveryFeeDetails.vehicleType': null },
    ];
  }

  // Fetch candidate orders and filter by pickup distance
  const candidateOrders = await Order.find(pendingJobsQuery)
    .populate('farmer', 'farmLocation');

  let pendingJobs = candidateOrders.length; // fallback if transporter has no GPS location

  if (transporterLocation?.lat && transporterLocation?.lng) {
    const withinRange = candidateOrders.filter(order => {
      const farmerCoords = order.farmer?.farmLocation?.coordinates;
      if (!farmerCoords?.lat || !farmerCoords?.lng) return true; // no coords → don't exclude
      const dist = calculateStraightLineDistance(transporterLocation, farmerCoords);
      // Van: also check delivery route distance
      if (isVan && order.deliveryAddress?.coordinates?.lat) {
        const deliveryDist = calculateStraightLineDistance(
          farmerCoords,
          order.deliveryAddress.coordinates
        );
        if (deliveryDist > 30) return false;
      }
      return dist <= EFFECTIVE_MAX_KM;
    });
    pendingJobs = withinRange.length;
  }

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

// @desc    Confirm cash collected for COD order
// @route   PUT /api/transporter/jobs/:orderId/collect-cash
// @access  Private (Transporter only)
const confirmCashCollected = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const transporterId = req.user._id;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.transporter || order.transporter.toString() !== transporterId.toString()) {
    res.status(403);
    throw new Error('Not authorised — this is not your delivery');
  }

  if (order.paymentMethod !== 'cash_on_delivery') {
    res.status(400);
    throw new Error('This order is not a cash-on-delivery order');
  }

  if (order.deliveryStatus !== 'delivered') {
    res.status(400);
    throw new Error('Order must be marked as delivered before confirming cash collection');
  }

  if (order.paymentStatus === 'paid') {
    return res.json({ success: true, message: 'Payment already marked as paid', data: order });
  }

  order.paymentStatus = 'paid';
  order.statusHistory.push({
    status: 'payment_collected',
    timestamp: new Date(),
    note: 'Cash collected by transporter'
  });
  await order.save();

  res.json({
    success: true,
    message: 'Cash payment confirmed',
    data: order
  });
});

module.exports = {
  getAvailableJobs,
  acceptJob,
  updateDeliveryStatus,
  getMyDeliveries,
  getTransporterStats,
  getDeliveryDetails,
  confirmCashCollected
};
