const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farmer reference is required']
  },
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true,
    maxlength: [100, 'Crop name cannot exceed 100 characters']
  },
  grade: {
    type: String,
    enum: {
      values: ['A', 'B', 'C'],
      message: 'Grade must be A, B, or C'
    },
    required: [true, 'Grade is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1 kg']
  },
  unit: {
    type: String,
    enum: ['kg', 'ton'],
    default: 'kg'
  },
  location: {
    village: {
      type: String,
      required: [true, 'Village is required']
    },
    thana: {
      type: String,
      required: [true, 'Thana is required']
    },
    district: {
      type: String,
      required: [true, 'District is required']
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  harvestDate: {
    type: Date,
    required: [true, 'Harvest date is required']
  },
  moq: { // Minimum Order Quantity
    type: Number,
    required: [true, 'Minimum order quantity is required'],
    min: [1, 'MOQ must be at least 1 kg']
  },
  photos: [{
    type: String, // URLs to uploaded images
    required: false
  }],
  // Fair Price Calculator inputs (optional)
  costBreakdown: {
    seedCost: {
      type: Number,
      required: false,
      min: [0, 'Seed cost cannot be negative']
    },
    fertilizerCost: {
      type: Number,
      required: false,
      min: [0, 'Fertilizer cost cannot be negative']
    },
    laborCost: {
      type: Number,
      required: false,
      min: [0, 'Labor cost cannot be negative']
    },
    transportCost: {
      type: Number,
      default: 0,
      min: [0, 'Transport cost cannot be negative']
    },
    otherCost: {
      type: Number,
      default: 0,
      min: [0, 'Other cost cannot be negative']
    }
  },
  // Fair Price Calculator: totalCost + margin (optional)
  calculatedPrice: {
    totalCost: {
      type: Number,
      required: false
    },
    margin: {
      type: Number,
      default: 15, // Default 15% margin
      min: [0, 'Margin cannot be negative'],
      max: [100, 'Margin cannot exceed 100%']
    },
    suggestedPrice: {
      type: Number,
      required: false
    }
  },
  // Final price set by farmer (can override suggestion)
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'sold', 'expired'],
      message: 'Invalid status'
    },
    default: 'pending'
  },
  moderationNote: {
    type: String,
    maxlength: [500, 'Moderation note cannot exceed 500 characters']
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  isPreOrder: {
    type: Boolean,
    default: false
  },
  expectedHarvestDate: {
    type: Date // Only for pre-orders
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
productSchema.index({ farmer: 1 });
productSchema.index({ status: 1 });
productSchema.index({ cropName: 1 });
productSchema.index({ 'location.district': 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);