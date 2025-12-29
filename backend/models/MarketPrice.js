const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Grains', 'Vegetables', 'Fruits', 'Spices', 'Cash Crops']
  },
  currentPrice: {
    wholesale: {
      type: Number,
      required: [true, 'Wholesale price is required'],
      min: [0, 'Wholesale price cannot be negative'],
      max: [10000, 'Wholesale price seems unrealistic']
    },
    retail: {
      type: Number,
      required: [true, 'Retail price is required'],
      min: [0, 'Retail price cannot be negative'],
      max: [10000, 'Retail price seems unrealistic']
    },
    date: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      default: 'Manual Entry',
      trim: true
    }
  },
  priceHistory: [{
    date: {
      type: Date,
      required: true
    },
    wholesale: {
      type: Number,
      required: true,
      min: 0
    },
    retail: {
      type: Number,
      required: true,
      min: 0
    },
    source: {
      type: String,
      default: 'Manual Entry'
    }
  }],
  unit: {
    type: String,
    default: 'kg',
    enum: ['kg', 'dozen', 'piece']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
marketPriceSchema.index({ cropName: 1, district: 1 }, { unique: true });
marketPriceSchema.index({ district: 1 });
marketPriceSchema.index({ category: 1 });
marketPriceSchema.index({ 'currentPrice.date': -1 });

// Validation: Retail price should be greater than wholesale
marketPriceSchema.pre('save', function(next) {
  if (this.currentPrice.retail <= this.currentPrice.wholesale) {
    next(new Error('Retail price must be greater than wholesale price'));
  }
  next();
});

// Keep only last 365 days of history to prevent bloat
marketPriceSchema.pre('save', function(next) {
  if (this.priceHistory.length > 365) {
    this.priceHistory = this.priceHistory.slice(-365);
  }
  next();
});

// Update lastUpdated timestamp
marketPriceSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Virtual for price trend (last 7 days)
marketPriceSchema.virtual('weeklyTrend').get(function() {
  if (!this.priceHistory || !Array.isArray(this.priceHistory) || this.priceHistory.length < 7) {
    return 'stable';
  }
  
  const recentPrices = this.priceHistory.slice(-7);
  const avgRecent = recentPrices.reduce((sum, p) => sum + p.wholesale, 0) / recentPrices.length;
  const previousPrices = this.priceHistory.slice(-14, -7);
  
  if (previousPrices.length === 0) {
    return 'stable';
  }
  
  const avgPrevious = previousPrices.reduce((sum, p) => sum + p.wholesale, 0) / previousPrices.length;
  const change = ((avgRecent - avgPrevious) / avgPrevious) * 100;
  
  if (change > 5) return 'rising';
  if (change < -5) return 'falling';
  return 'stable';
});

// Virtual for margin percentage
marketPriceSchema.virtual('marginPercentage').get(function() {
  try {
    if (this.currentPrice && this.currentPrice.wholesale && this.currentPrice.retail) {
      const margin = this.currentPrice.retail - this.currentPrice.wholesale;
      return ((margin / this.currentPrice.wholesale) * 100).toFixed(1);
    }
    return '0.0';
  } catch (error) {
    return '0.0';
  }
});

// Enable virtuals in JSON
marketPriceSchema.set('toJSON', { virtuals: true });
marketPriceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
