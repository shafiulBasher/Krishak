const User = require('../models/User');

// Initialize Stripe lazily to ensure env vars are loaded
let stripe;
const getStripe = () => {
  if (!stripe) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * Create Stripe Connect account and start onboarding
 * POST /api/stripe/connect/onboard
 */
exports.createConnectAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is farmer or transporter
    if (!['farmer', 'transporter'].includes(user.role)) {
      return res.status(403).json({ 
        message: 'Only farmers and transporters can create Connect accounts' 
      });
    }
    
    // If account already exists, return account link
    if (user.stripeConnectAccountId) {
      // Check if onboarding is complete
      const account = await getStripe().accounts.retrieve(user.stripeConnectAccountId);
      
      if (account.charges_enabled && account.payouts_enabled) {
        return res.json({
          success: true,
          accountId: user.stripeConnectAccountId,
          onboardingComplete: true,
          message: 'Connect account already setup',
        });
      }
      
      // Create new account link if onboarding not complete
      const accountLink = await getStripe().accountLinks.create({
        account: user.stripeConnectAccountId,
        refresh_url: process.env.STRIPE_CONNECT_REFRESH_URL || 'http://localhost:5173/connect/refresh',
        return_url: process.env.STRIPE_CONNECT_RETURN_URL || 'http://localhost:5173/connect/return',
        type: 'account_onboarding',
      });
      
      return res.json({
        success: true,
        url: accountLink.url,
        accountId: user.stripeConnectAccountId,
      });
    }
    
    // Create new Stripe Express account
    const account = await getStripe().accounts.create({
      type: 'express',
      country: 'US', // Use supported country for testing
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId: userId.toString(),
        role: user.role,
        name: user.name,
      },
    });
    
    // Save account ID to user
    await User.findByIdAndUpdate(userId, {
      stripeConnectAccountId: account.id,
    });
    
    // Create account link for onboarding
    const accountLink = await getStripe().accountLinks.create({
      account: account.id,
      refresh_url: process.env.STRIPE_CONNECT_REFRESH_URL || 'http://localhost:5173/connect/refresh',
      return_url: process.env.STRIPE_CONNECT_RETURN_URL || 'http://localhost:5173/connect/return',
      type: 'account_onboarding',
    });
    
    res.json({
      success: true,
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (error) {
    console.error('Create connect account error:', error);
    res.status(500).json({ 
      message: 'Failed to create connect account',
      error: error.message 
    });
  }
};

/**
 * Get Stripe Connect account status
 * GET /api/stripe/connect/status
 */
exports.getConnectStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.stripeConnectAccountId) {
      return res.json({ 
        success: true,
        onboardingComplete: false,
        hasAccount: false,
      });
    }
    
    const account = await getStripe().accounts.retrieve(user.stripeConnectAccountId);
    
    const onboardingComplete = account.charges_enabled && account.payouts_enabled;
    
    // Update user's onboarding status
    if (user.stripeOnboardingComplete !== onboardingComplete) {
      await User.findByIdAndUpdate(req.user._id, {
        stripeOnboardingComplete: onboardingComplete,
      });
    }
    
    res.json({
      success: true,
      hasAccount: true,
      onboardingComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      accountId: user.stripeConnectAccountId,
    });
  } catch (error) {
    console.error('Get connect status error:', error);
    res.status(500).json({ 
      message: 'Failed to get connect status',
      error: error.message 
    });
  }
};

/**
 * Get Stripe dashboard link
 * GET /api/stripe/connect/dashboard
 */
exports.getDashboardLink = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.stripeConnectAccountId) {
      return res.status(400).json({ 
        message: 'No Connect account found' 
      });
    }
    
    // Create login link to Stripe Express dashboard
    const loginLink = await getStripe().accounts.createLoginLink(user.stripeConnectAccountId);
    
    res.json({
      success: true,
      url: loginLink.url,
    });
  } catch (error) {
    console.error('Get dashboard link error:', error);
    res.status(500).json({ 
      message: 'Failed to get dashboard link',
      error: error.message 
    });
  }
};

/**
 * Get earnings summary
 * GET /api/stripe/connect/earnings
 */
exports.getEarnings = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user.stripeConnectAccountId) {
      return res.json({
        success: true,
        totalEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0,
        transfers: [],
      });
    }
    
    // Get balance from Stripe
    const balance = await getStripe().balance.retrieve({
      stripeAccount: user.stripeConnectAccountId,
    });
    
    // Get recent transfers
    const transfers = await getStripe().transfers.list({
      destination: user.stripeConnectAccountId,
      limit: 10,
    });
    
    const availableBalance = balance.available.reduce((sum, bal) => sum + bal.amount, 0) / 100;
    const pendingBalance = balance.pending.reduce((sum, bal) => sum + bal.amount, 0) / 100;
    
    // Convert USD to BDT for display
    const exchangeRate = parseFloat(process.env.USD_TO_BDT_RATE) || 110;
    
    res.json({
      success: true,
      availableBalance: Math.round(availableBalance * exchangeRate),
      pendingBalance: Math.round(pendingBalance * exchangeRate),
      currency: 'BDT',
      transfers: transfers.data.map(t => ({
        id: t.id,
        amount: Math.round((t.amount / 100) * exchangeRate),
        currency: 'BDT',
        created: new Date(t.created * 1000),
        metadata: t.metadata,
      })),
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ 
      message: 'Failed to get earnings',
      error: error.message 
    });
  }
};

/**
 * Refresh onboarding link (when user needs to re-complete onboarding)
 * POST /api/stripe/connect/refresh-onboarding
 */
exports.refreshOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.stripeConnectAccountId) {
      return res.status(400).json({ 
        message: 'No Connect account found' 
      });
    }
    
    // Create new account link
    const accountLink = await getStripe().accountLinks.create({
      account: user.stripeConnectAccountId,
      refresh_url: process.env.STRIPE_CONNECT_REFRESH_URL || 'http://localhost:5173/connect/refresh',
      return_url: process.env.STRIPE_CONNECT_RETURN_URL || 'http://localhost:5173/connect/return',
      type: 'account_onboarding',
    });
    
    res.json({
      success: true,
      url: accountLink.url,
    });
  } catch (error) {
    console.error('Refresh onboarding error:', error);
    res.status(500).json({ 
      message: 'Failed to refresh onboarding',
      error: error.message 
    });
  }
};

module.exports = exports;
