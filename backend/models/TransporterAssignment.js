const mongoose = require('mongoose');

const transporterAssignmentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required']
  },
  transporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Transporter reference is required']
  },
  status: {
    type: String,
    enum: {
      values: ['assigned', 'picked', 'in_transit', 'delivered', 'cancelled'],
      message: 'Status must follow: assigned → picked → in_transit → delivered'
    },
    default: 'assigned',
    required: true
  },
  pickupLocation: {
    address: { type: String, required: true },
    thana: { type: String, required: true },
    district: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  deliveryLocation: {
    address: { type: String, required: true },
    thana: { type: String, required: true },
    district: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  // Verification photos (mandatory at pickup)
  pickupPhoto: {
    type: String,
    required: function() {
      return this.status === 'picked' || this.status === 'in_transit' || this.status === 'delivered';
    }
  },
  deliveryPhoto: {
    type: String,
    required: function() {
      return this.status === 'delivered';
    }
  },
  // Timeline tracking
  timeline: {
    assignedAt: {
      type: Date,
      default: Date.now
    },
    pickedAt: {
      type: Date
    },
    inTransitAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    }
  },
  estimatedDistance: {
    type: Number, // in kilometers
    min: [0, 'Distance cannot be negative']
  },
  transportFee: {
    type: Number,
    required: [true, 'Transport fee is required'],
    min: [0, 'Transport fee cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  cancelReason: {
    type: String,
    maxlength: [500, 'Cancel reason cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes
transporterAssignmentSchema.index({ order: 1 });
transporterAssignmentSchema.index({ transporter: 1 });
transporterAssignmentSchema.index({ status: 1 });
transporterAssignmentSchema.index({ createdAt: -1 });

// Strict status flow validation
transporterAssignmentSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    const validTransitions = {
      'assigned': ['picked', 'cancelled'],
      'picked': ['in_transit', 'cancelled'],
      'in_transit': ['delivered', 'cancelled'],
      'delivered': [], // Terminal state
      'cancelled': [] // Terminal state
    };
    
    const currentStatus = this.status;
    const previousStatus = this._original?.status;
    
    if (previousStatus && !validTransitions[previousStatus]?.includes(currentStatus)) {
      return next(new Error(`Invalid status transition from ${previousStatus} to ${currentStatus}`));
    }
  }
  
  // Update timeline based on status
  if (this.isModified('status')) {
    switch(this.status) {
      case 'picked':
        this.timeline.pickedAt = new Date();
        break;
      case 'in_transit':
        this.timeline.inTransitAt = new Date();
        break;
      case 'delivered':
        this.timeline.deliveredAt = new Date();
        break;
    }
  }
  
  next();
});

// Store original document for validation
transporterAssignmentSchema.post('init', function() {
  this._original = this.toObject();
});

module.exports = mongoose.model('TransporterAssignment', transporterAssignmentSchema);
