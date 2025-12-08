const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer reference is required']
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer reference is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Order quantity is required'],
    min: [1, 'Quantity must be at least 1 kg']
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0, 'Price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true
  },
  // Price breakdown for transparency
  priceBreakdown: {
    farmerEarnings: {
      type: Number,
      required: true
    },
    platformFee: {
      type: Number,
      default: 0
    },
    transportFee: {
      type: Number,
      default: 0
    }
  },
  deliveryAddress: {
    addressLine: {
      type: String,
      required: [true, 'Delivery address is required']
    },
    thana: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  orderStatus: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'cancelled', 'completed'],
      message: 'Invalid order status'
    },
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'failed', 'refunded'],
      message: 'Invalid payment status'
    },
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'bkash', 'nagad', 'bank_transfer', 'card'],
    default: 'cash_on_delivery'
  },
  transactionId: {
    type: String
  },
  // Delivery/Transport tracking
  transporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryStatus: {
    type: String,
    enum: {
      values: ['not_assigned', 'assigned', 'picked', 'in_transit', 'delivered'],
      message: 'Invalid delivery status'
    },
    default: 'not_assigned'
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String
    },
    photo: {
      type: String // Verification photo URL (mandatory at pickup)
    }
  }],
  estimatedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  // Pre-order specific
  isPreOrder: {
    type: Boolean,
    default: false
  },
  // Ratings and feedback
  buyerRating: {
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 500 },
    createdAt: { type: Date }
  },
  farmerRating: {
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 500 },
    createdAt: { type: Date }
  },
  transporterRating: {
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 500 },
    createdAt: { type: Date }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ buyer: 1 });
orderSchema.index({ farmer: 1 });
orderSchema.index({ transporter: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ deliveryStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    // Format: KRK-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(10000 + Math.random() * 90000);
    this.orderNumber = `KRK-${dateStr}-${random}`;
  }
  
  // Calculate total price
  if (this.isModified('quantity') || this.isModified('pricePerUnit')) {
    this.totalPrice = this.quantity * this.pricePerUnit;
  }
  
  next();
});

module.exports = mongoose.model('Order', orderSchema);
