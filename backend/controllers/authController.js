const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, farmLocation, vehicleType, vehicleNumber, licenseNumber } = req.body;

  // Validation
  if (!name || !email || !phone || !password || !role) {
    res.status(400);
    throw new Error('Please provide all required fields: name, email, phone, password, role');
  }

  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { phone }] });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email or phone');
  }

  // Validate role
  const validRoles = ['farmer', 'buyer', 'transporter', 'admin'];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role. Must be one of: farmer, buyer, transporter, admin');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user object
  const userData = {
    name,
    email,
    phone,
    password: hashedPassword,
    role
  };

  // Add role-specific fields
  if (role === 'farmer' && farmLocation) {
    userData.farmLocation = farmLocation;
  }
  
  if (role === 'transporter') {
    userData.vehicleType = vehicleType;
    userData.vehicleNumber = vehicleNumber;
    userData.licenseNumber = licenseNumber;
  }

  const user = await User.create(userData);

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check password
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated');
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  res.json({
    success: true,
    data: user
  });
});

// @desc    Google OAuth callback
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { googleId, email, name, avatar } = req.body;

  let user = await User.findOne({ googleId });

  if (!user) {
    // Check if email exists
    user = await User.findOne({ email });
    
    if (user) {
      // Link Google account
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      await user.save();
    } else {
      res.status(400);
      throw new Error('Please complete registration with role selection');
    }
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated');
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    }
  });
});

module.exports = {
  register,
  login,
  getMe,
  googleAuth
};
