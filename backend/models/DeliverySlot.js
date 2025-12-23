const mongoose = require('mongoose');

const deliverySlotSchema = new mongoose.Schema({
  // Can be associated with a farmer or be a general slot
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Geographic coverage for this slot
  coverage: {
    district: {
      type: String,
      required: true
    },
    thana: {
      type: String
    }
  },
  // Time window for delivery
  startTime: {
    type: String, // Format: "09:00" (24-hour)
    required: true
  },
  endTime: {
    type: String, // Format: "12:00" (24-hour)
    required: true
  },
  // Days of the week this slot is available (0-6, where 0 is Sunday)
  availableDays: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.every(day => day >= 0 && day <= 6);
      },
      message: 'Days must be between 0 (Sunday) and 6 (Saturday)'
    }
  },
  // Maximum orders per slot
  maxOrders: {
    type: Number,
    required: true,
    min: [1, 'Max orders must be at least 1']
  },
  currentOrders: {
    type: Number,
    default: 0
  },
  // Delivery fee for this slot
  deliveryFee: {
    type: Number,
    required: true,
    min: [0, 'Delivery fee cannot be negative']
  },
  // Is this slot active
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional info
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  minimumOrderValue: {
    type: Number,
    default: 0,
    description: 'Minimum cart value required to use this slot'
  }
}, {
  timestamps: true
});

// Index for performance
deliverySlotSchema.index({ district: 1 });
deliverySlotSchema.index({ farmer: 1 });
deliverySlotSchema.index({ isActive: 1 });

module.exports = mongoose.model('DeliverySlot', deliverySlotSchema);
