const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer reference is required'],
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    pricePerUnit: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Delivery preferences
  deliveryPreferences: {
    selectedAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    deliverySlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliverySlot',
      default: null
    },
    // Map-based delivery location
    mapLocation: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
      isMapBased: { type: Boolean, default: false }
    },
    // Requested delivery date
    preferredDeliveryDate: {
      type: Date
    }
  },
  // Cart summary
  cartSummary: {
    subtotal: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    estimatedDeliveryFee: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate totals
cartSchema.pre('save', function(next) {
  if (this.items.length === 0) {
    this.cartSummary.subtotal = 0;
    this.cartSummary.total = 0;
  } else {
    this.cartSummary.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.cartSummary.platformFee = Math.round(this.cartSummary.subtotal * 0.05); // 5% platform fee
    this.cartSummary.total = this.cartSummary.subtotal + this.cartSummary.platformFee + (this.cartSummary.estimatedDeliveryFee || 0);
  }
  this.lastUpdated = Date.now();
  next();
});

// Index for performance
cartSchema.index({ buyer: 1 });

module.exports = mongoose.model('Cart', cartSchema);
