const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  
  // Stripe payment identifiers
  paymentIntentId: {
    type: String,
    unique: true,
    sparse: true,
  },
  chargeId: {
    type: String,
  },
  
  // Amount breakdown in BDT
  amount: {
    productAmount: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
  },
  
  // Currency handling
  currency: {
    type: String,
    default: 'usd',
    enum: ['usd', 'bdt'],
  },
  
  // USD amount in cents (for Stripe)
  amountInCents: {
    type: Number,
  },
  
  // Exchange rate used
  exchangeRate: {
    type: Number,
    default: 110, // 1 USD = 110 BDT (approximate)
  },
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'processing', 'captured', 'transferred', 'refunded', 'failed', 'cancelled'],
    default: 'pending',
  },
  
  // Transfers to connected accounts
  transfers: [{
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recipientType: {
      type: String,
      enum: ['farmer', 'transporter'],
    },
    stripeTransferId: String,
    amount: Number, // Amount in BDT
    amountInCents: Number, // Amount in USD cents
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    transferredAt: Date,
    error: String,
  }],
  
  // Platform fee collected
  platformFeeCollected: {
    amount: Number,
    collectedAt: Date,
  },
  
  // Refund information
  refund: {
    refundId: String,
    amount: Number,
    amountInCents: Number,
    reason: {
      type: String,
      enum: ['order_cancelled', 'product_issue', 'delivery_failed', 'customer_request', 'other'],
    },
    reasonDetails: String,
    refundedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
    },
  },
  
  // Delivery vehicle and distance metadata
  metadata: {
    deliveryVehicle: {
      type: String,
      enum: ['van', 'pickup', 'truck'],
    },
    deliveryFeeBreakdown: {
      baseRate: Number,
      perKmRate: Number,
      distance: Number,
      totalFee: Number,
    },
    distance: Number,
    buyerDistrict: String,
    farmerDistrict: String,
    crossDistrict: Boolean,
  },
  
  // Payment method details
  paymentMethod: {
    type: String,
    last4: String,
    brand: String,
    country: String,
  },
  
  // Timestamps for tracking
  paidAt: Date,
  transferredAt: Date,
  
}, { timestamps: true });

// Indexes for performance
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ paymentIntentId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'transfers.recipientId': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
