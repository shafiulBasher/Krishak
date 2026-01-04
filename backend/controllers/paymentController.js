const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { calculateRoadDistance } = require('../utils/distanceCalculator');
const { calculateDeliveryFee, calculatePlatformFee, getAllVehicleOptions } = require('../utils/deliveryFeeCalculator');
const { createNotification } = require('../utils/notificationHelper');

// Initialize Stripe lazily to ensure env vars are loaded
let stripe;
const getStripe = () => {
  if (!stripe) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * Calculate order total with delivery fee
 * POST /api/payments/calculate-total
 */
exports.calculateOrderTotal = async (req, res) => {
  try {
    const { orderId, vehicleType } = req.body;
    
    if (!orderId || !vehicleType) {
      return res.status(400).json({ message: 'Order ID and vehicle type are required' });
    }
    
    const order = await Order.findById(orderId)
      .populate('farmer', 'farmLocation deliveryAddresses district coordinates')
      .populate('buyer', 'deliveryAddresses coordinates')
      .populate('product', 'name price');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get coordinates
    const farmerCoords = order.farmer.farmLocation?.coordinates || order.farmer.coordinates;
    const buyerCoords = order.deliveryAddress?.coordinates || order.buyer.coordinates;
    
    if (!farmerCoords || !buyerCoords) {
      return res.status(400).json({ 
        message: 'Location coordinates missing for farmer or buyer' 
      });
    }
    
    // Calculate distance
    const distance = await calculateRoadDistance(farmerCoords, buyerCoords);
    
    // Calculate delivery fee
    const deliveryFeeData = calculateDeliveryFee(vehicleType, distance);
    
    // Calculate platform fee
    const productAmount = order.totalPrice || (order.quantity * order.pricePerUnit);
    const feeBreakdown = calculatePlatformFee(productAmount, deliveryFeeData.totalFee);
    
    // Check district validation
    const farmerDistrict = order.farmer.farmLocation?.district || order.farmer.deliveryAddresses?.[0]?.district;
    const buyerDistrict = order.deliveryAddress?.district || order.buyer.deliveryAddresses?.[0]?.district;
    const crossDistrict = farmerDistrict !== buyerDistrict;
    
    res.json({
      success: true,
      orderId: order._id,
      breakdown: {
        ...feeBreakdown,
        deliveryFee: deliveryFeeData,
      },
      distance,
      crossDistrict,
      districtInfo: {
        farmerDistrict,
        buyerDistrict,
      },
      districtWarning: crossDistrict ? 'Cross-district delivery may take longer' : null,
    });
  } catch (error) {
    console.error('Calculate order total error:', error);
    res.status(500).json({ 
      message: 'Failed to calculate order total',
      error: error.message 
    });
  }
};

/**
 * Get available vehicle options for an order
 * GET /api/payments/vehicle-options/:orderId
 */
exports.getVehicleOptions = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('farmer', 'farmLocation coordinates')
      .populate('buyer', 'deliveryAddresses coordinates');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get coordinates
    const farmerCoords = order.farmer.farmLocation?.coordinates || order.farmer.coordinates;
    const buyerCoords = order.deliveryAddress?.coordinates || order.buyer.coordinates;
    
    if (!farmerCoords || !buyerCoords) {
      return res.status(400).json({ 
        message: 'Location coordinates missing' 
      });
    }
    
    // Calculate distance
    const distance = await calculateRoadDistance(farmerCoords, buyerCoords);
    
    // Get all vehicle options
    const vehicleOptions = getAllVehicleOptions(distance);
    
    res.json({
      success: true,
      distance,
      vehicleOptions,
    });
  } catch (error) {
    console.error('Get vehicle options error:', error);
    res.status(500).json({ 
      message: 'Failed to get vehicle options',
      error: error.message 
    });
  }
};

/**
 * Create payment intent for order
 * POST /api/payments/create-intent
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId, vehicleType } = req.body;
    const userId = req.user._id;
    
    if (!orderId || !vehicleType) {
      return res.status(400).json({ message: 'Order ID and vehicle type are required' });
    }
    
    const order = await Order.findById(orderId)
      .populate('farmer', 'farmLocation coordinates stripeConnectAccountId district')
      .populate('buyer', 'deliveryAddresses coordinates stripeCustomerId district');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.buyer._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Check if payment intent already exists
    if (order.paymentIntentId) {
      const existingIntent = await getStripe().paymentIntents.retrieve(order.paymentIntentId);
      if (existingIntent.status !== 'canceled') {
        return res.json({
          success: true,
          clientSecret: existingIntent.client_secret,
          paymentIntentId: existingIntent.id,
          message: 'Using existing payment intent',
        });
      }
    }
    
    // Get coordinates
    const farmerCoords = order.farmer.farmLocation?.coordinates || order.farmer.coordinates;
    const buyerCoords = order.deliveryAddress?.coordinates || order.buyer.coordinates;
    
    console.log('Payment Intent Creation - Coordinates check:', {
      farmerCoords,
      buyerCoords,
      hasFarmerLocation: !!order.farmer.farmLocation,
      hasBuyerCoords: !!order.buyer.coordinates,
      deliveryAddress: order.deliveryAddress
    });
    
    // If coordinates are missing, use default distance
    let distance = 10; // default 10km
    if (farmerCoords && buyerCoords) {
      try {
        distance = await calculateRoadDistance(farmerCoords, buyerCoords);
      } catch (distError) {
        console.warn('Distance calculation failed, using default 10km:', distError.message);
      }
    } else {
      console.warn('Missing coordinates for distance calculation, using default 10km');
    }
    
    const deliveryFeeData = calculateDeliveryFee(vehicleType, distance);
    
    const productAmount = order.totalPrice || (order.quantity * order.pricePerUnit);
    const feeBreakdown = calculatePlatformFee(productAmount, deliveryFeeData.totalFee);
    
    // Convert BDT to USD for Stripe (Stripe doesn't support BDT)
    const exchangeRate = parseFloat(process.env.USD_TO_BDT_RATE) || 110;
    const usdAmount = Math.ceil((feeBreakdown.totalAmount / exchangeRate) * 100); // in cents
    
    // Create or get Stripe customer
    let customerId = order.buyer.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: order.buyer.email,
        name: order.buyer.name,
        metadata: {
          userId: order.buyer._id.toString(),
        },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(order.buyer._id, { stripeCustomerId: customerId });
    }
    
    // Create payment intent
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: usdAmount,
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        vehicleType,
        distance: distance.toString(),
        productAmountBDT: productAmount.toString(),
        deliveryFeeBDT: deliveryFeeData.totalFee.toString(),
        platformFeeBDT: feeBreakdown.platformFee.toString(),
        totalAmountBDT: feeBreakdown.totalAmount.toString(),
        exchangeRate: exchangeRate.toString(),
      },
      description: `Order ${order.orderNumber} - Krishak Marketplace`,
    });
    
    // Create transaction record
    const transaction = await Transaction.create({
      orderId: order._id,
      paymentIntentId: paymentIntent.id,
      amount: {
        productAmount,
        deliveryFee: deliveryFeeData.totalFee,
        platformFee: feeBreakdown.platformFee,
        totalAmount: feeBreakdown.totalAmount,
      },
      currency: 'usd',
      amountInCents: usdAmount,
      exchangeRate,
      status: 'pending',
      metadata: {
        deliveryVehicle: vehicleType,
        distance,
        buyerDistrict: order.deliveryAddress?.district,
        farmerDistrict: order.farmer.farmLocation?.district,
        crossDistrict: order.deliveryAddress?.district !== order.farmer.farmLocation?.district,
      },
    });
    
    // Update order
    await Order.findByIdAndUpdate(orderId, {
      deliveryVehicle: {
        type: vehicleType,
        baseRate: deliveryFeeData.baseRate,
        perKmRate: deliveryFeeData.perKmRate,
        capacity: deliveryFeeData.capacity,
      },
      deliveryFeeDetails: {
        ...deliveryFeeData,
        calculatedAt: new Date(),
      },
      districtInfo: {
        buyerDistrict: order.deliveryAddress?.district,
        farmerDistrict: order.farmer.farmLocation?.district,
        crossDistrict: order.deliveryAddress?.district !== order.farmer.farmLocation?.district,
      },
      paymentIntentId: paymentIntent.id,
      stripeTransactionId: transaction._id,
      paymentMethod: 'stripe',
    });
    
    const responseData = {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transactionId: transaction._id,
      breakdown: {
        ...feeBreakdown,
        deliveryFee: deliveryFeeData,
      },
    };
    
    console.log('✅ Payment intent created successfully:', {
      paymentIntentId: paymentIntent.id,
      hasClientSecret: !!paymentIntent.client_secret,
      orderId
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('Create payment intent error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create payment intent',
      error: error.message,
      details: error.toString()
    });
  }
};

/**
 * Confirm payment
 * POST /api/payments/confirm
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }
    
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const orderId = paymentIntent.metadata.orderId;
      
      // Get order with buyer and product info for notification
      const order = await Order.findById(orderId)
        .populate('buyer', 'name')
        .populate('product', 'cropName')
        .populate('farmer', '_id name');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Update order status
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        paymentMethod: 'stripe',
        statusHistory: [
          ...(order.statusHistory || []),
          {
            status: 'paid',
            note: 'Payment received via Stripe',
            timestamp: new Date()
          }
        ]
      });
      
      // Update transaction status
      await Transaction.findOneAndUpdate(
        { paymentIntentId },
        { 
          status: 'captured',
          chargeId: paymentIntent.charges?.data[0]?.id,
        }
      );
      
      // Send notification to farmer/seller
      try {
        const totalAmount = paymentIntent.metadata.totalAmountBDT || order.totalPrice;
        await createNotification({
          userId: order.farmer._id,
          type: 'payment_received',
          title: '💰 Payment Received!',
          message: `You have received ৳${Number(totalAmount).toLocaleString()} for order #${order.orderNumber}. ${order.buyer?.name || 'A buyer'} purchased ${order.quantity}kg of ${order.product?.cropName || 'your product'}.`,
          relatedOrder: order._id,
          relatedProduct: order.product?._id,
          metadata: {
            orderNumber: order.orderNumber,
            amount: totalAmount,
            buyerName: order.buyer?.name,
            paymentMethod: 'stripe',
          },
        });
        console.log(`✅ Payment notification sent to farmer ${order.farmer._id}`);
      } catch (notificationError) {
        console.error('Failed to send payment notification:', notificationError);
        // Don't fail the payment confirmation if notification fails
      }
      
      res.json({ 
        success: true, 
        message: 'Payment confirmed successfully',
        orderId,
        orderNumber: order.orderNumber,
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Payment not completed',
        status: paymentIntent.status,
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ 
      message: 'Failed to confirm payment',
      error: error.message 
    });
  }
};

/**
 * Refund payment
 * POST /api/payments/refund/:orderId
 */
exports.refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Order payment not completed' });
    }
    
    const transaction = await Transaction.findOne({ paymentIntentId: order.paymentIntentId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Create refund in Stripe
    const refund = await getStripe().refunds.create({
      payment_intent: order.paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        orderId: orderId.toString(),
        reason: reason || 'Order cancelled',
      },
    });
    
    // Update order
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'refunded',
      orderStatus: 'cancelled',
    });
    
    // Update transaction
    await Transaction.findOneAndUpdate(
      { paymentIntentId: order.paymentIntentId },
      {
        status: 'refunded',
        'refund.refundId': refund.id,
        'refund.amount': refund.amount / 100, // Convert cents to dollars
        'refund.reason': reason,
        'refund.refundedAt': new Date(),
      }
    );
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundId: refund.id,
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ 
      message: 'Failed to process refund',
      error: error.message 
    });
  }
};

/**
 * Get payment history
 * GET /api/payments/history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    
    // Find orders for this user (as buyer)
    const orders = await Order.find({ 
      buyer: userId,
      paymentMethod: 'stripe',
    })
      .populate('farmer', 'name')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get transactions
    const orderIds = orders.map(o => o._id);
    const transactions = await Transaction.find({ orderId: { $in: orderIds } });
    
    // Combine data
    const history = orders.map(order => {
      const transaction = transactions.find(t => t.orderId.toString() === order._id.toString());
      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        product: order.product,
        farmer: order.farmer,
        amount: transaction?.amount,
        status: transaction?.status,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      };
    });
    
    const total = await Order.countDocuments({ 
      buyer: userId,
      paymentMethod: 'stripe',
    });
    
    res.json({
      success: true,
      history,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ 
      message: 'Failed to get payment history',
      error: error.message 
    });
  }
};

/**
 * Transfer funds to farmer and transporter after delivery
 * POST /api/payments/transfer/:orderId
 */
exports.transferFunds = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('farmer', 'stripeConnectAccountId')
      .populate('transporter', 'stripeConnectAccountId');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.deliveryStatus !== 'delivered') {
      return res.status(400).json({ message: 'Order not yet delivered' });
    }
    
    if (order.paymentStatus === 'transferred') {
      return res.status(400).json({ message: 'Funds already transferred' });
    }
    
    const transaction = await Transaction.findOne({ paymentIntentId: order.paymentIntentId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transfers = [];
    
    // Transfer to farmer
    if (order.farmer.stripeConnectAccountId) {
      try {
        const farmerTransfer = await getStripe().transfers.create({
          amount: Math.round(transaction.amount.productAmount / transaction.exchangeRate * 100), // USD cents
          currency: 'usd',
          destination: order.farmer.stripeConnectAccountId,
          transfer_group: orderId.toString(),
          metadata: {
            orderId: orderId.toString(),
            recipientType: 'farmer',
          },
        });
        
        transfers.push({
          recipientId: order.farmer._id,
          recipientType: 'farmer',
          stripeTransferId: farmerTransfer.id,
          amount: transaction.amount.productAmount,
          status: 'completed',
          transferredAt: new Date(),
        });
      } catch (error) {
        console.error('Farmer transfer error:', error);
        transfers.push({
          recipientId: order.farmer._id,
          recipientType: 'farmer',
          amount: transaction.amount.productAmount,
          status: 'failed',
          error: error.message,
        });
      }
    }
    
    // Transfer to transporter
    if (order.transporter && order.transporter.stripeConnectAccountId) {
      try {
        const transporterTransfer = await getStripe().transfers.create({
          amount: Math.round(transaction.amount.deliveryFee / transaction.exchangeRate * 100), // USD cents
          currency: 'usd',
          destination: order.transporter.stripeConnectAccountId,
          transfer_group: orderId.toString(),
          metadata: {
            orderId: orderId.toString(),
            recipientType: 'transporter',
          },
        });
        
        transfers.push({
          recipientId: order.transporter._id,
          recipientType: 'transporter',
          stripeTransferId: transporterTransfer.id,
          amount: transaction.amount.deliveryFee,
          status: 'completed',
          transferredAt: new Date(),
        });
      } catch (error) {
        console.error('Transporter transfer error:', error);
        transfers.push({
          recipientId: order.transporter._id,
          recipientType: 'transporter',
          amount: transaction.amount.deliveryFee,
          status: 'failed',
          error: error.message,
        });
      }
    }
    
    // Update transaction
    await Transaction.findByIdAndUpdate(transaction._id, {
      status: 'transferred',
      transfers,
    });
    
    // Update order
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'transferred',
    });
    
    res.json({
      success: true,
      message: 'Funds transferred successfully',
      transfers,
    });
  } catch (error) {
    console.error('Transfer funds error:', error);
    res.status(500).json({ 
      message: 'Failed to transfer funds',
      error: error.message 
    });
  }
};

/**
 * Calculate distance between two coordinates
 * POST /api/payments/calculate-distance
 */
exports.calculateDistance = async (req, res) => {
  try {
    const { fromCoords, toCoords } = req.body;
    
    if (!fromCoords || !toCoords) {
      return res.status(400).json({ message: 'Both fromCoords and toCoords are required' });
    }
    
    // Validate coordinates
    if (!fromCoords.lat || !fromCoords.lng || !toCoords.lat || !toCoords.lng) {
      return res.status(400).json({ 
        message: 'Invalid coordinates. Both lat and lng are required for each point' 
      });
    }
    
    // Calculate distance using the utility
    const distance = await calculateRoadDistance(fromCoords, toCoords);
    
    res.json({
      success: true,
      distance: distance,
      unit: 'km',
      fromCoords,
      toCoords,
    });
  } catch (error) {
    console.error('Calculate distance error:', error);
    res.status(500).json({ 
      message: 'Failed to calculate distance',
      error: error.message 
    });
  }
};

module.exports = exports;
