const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^01[3-9]\d{8}$/, 'Please provide a valid 11-digit BD phone number (01XXXXXXXXX)']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not using Google Sign-In
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  role: {
    type: String,
    enum: {
      values: ['farmer', 'buyer', 'transporter', 'admin'],
      message: 'Role must be one of: farmer, buyer, transporter, admin'
    },
    required: [true, 'User role is required']
  },
  // Farmer-specific fields
  farmLocation: {
    village: { type: String },
    thana: { type: String },
    district: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  // Transporter-specific fields
  vehicleType: {
    type: String,
    enum: ['truck', 'van', 'motorbike', 'other']
  },
  vehicleNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  // Common fields
  avatar: {
    type: String, // URL to profile picture
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);
