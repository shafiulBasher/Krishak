const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error('Google credential is required');
  }

  try {
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar, email_verified } = payload;

    if (!email) {
      res.status(400);
      throw new Error('Email not provided by Google');
    }

    // Check if user exists by email or googleId
    let user = await User.findOne({ 
      $or: [{ email }, { googleId }] 
    });

    if (user) {
      // Existing user - just login
      if (!user.googleId) {
        user.googleId = googleId;
        if (avatar) user.avatar = avatar;
        await user.save();
      }

      if (!user.isActive) {
        res.status(403);
        throw new Error('Your account has been deactivated');
      }

      // Check if profile is incomplete
      const needsCompletion = !user.phone || !user.role;

      res.json({
        success: true,
        needsCompletion,
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
    } else {
      // New user - create with minimal info
      const newUser = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: avatar || null,
        isVerified: email_verified || true // Google emails are verified
      });

      res.status(201).json({
        success: true,
        needsCompletion: true, // New users always need to complete profile
        data: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          avatar: newUser.avatar,
          isVerified: newUser.isVerified,
          token: generateToken(newUser._id)
        }
      });
    }
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(401);
    throw new Error('Invalid Google token');
  }
});

// @desc    Complete Google user profile
// @route   PUT /api/auth/complete-profile
// @access  Private
const completeProfile = asyncHandler(async (req, res) => {
  const { phone, role, farmLocation, vehicleType, vehicleNumber, licenseNumber } = req.body;

  // Validation
  if (!phone || !role) {
    res.status(400);
    throw new Error('Phone number and role are required');
  }

  // Validate phone format
  if (!/^01[3-9]\d{8}$/.test(phone)) {
    res.status(400);
    throw new Error('Please provide a valid 11-digit BD phone number (01XXXXXXXXX)');
  }

  // Check if phone already exists (for another user)
  const phoneExists = await User.findOne({ phone, _id: { $ne: req.user._id } });
  if (phoneExists) {
    res.status(400);
    throw new Error('Phone number already in use');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update user
  user.phone = phone;
  user.role = role;

  // Add role-specific fields
  if (role === 'farmer' && farmLocation) {
    user.farmLocation = farmLocation;
  }

  if (role === 'transporter') {
    if (vehicleType) user.vehicleType = vehicleType;
    if (vehicleNumber) user.vehicleNumber = vehicleNumber;
    if (licenseNumber) user.licenseNumber = licenseNumber;
  }

  await user.save();

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
      farmLocation: user.farmLocation,
      vehicleType: user.vehicleType,
      token: generateToken(user._id)
    }
  });
});

module.exports = {
  register,
  login,
  getMe,
  googleAuth,
  completeProfile
};
