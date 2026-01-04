/**
 * Stripe Configuration for Krishak Marketplace
 * 
 * Handles Stripe initialization and common settings
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe configuration
const STRIPE_CONFIG = {
  // Currency settings
  // Note: Stripe doesn't support BDT directly, so we use USD
  currency: 'usd',
  
  // Exchange rate (should be updated periodically or fetched from an API)
  exchangeRate: parseFloat(process.env.USD_TO_BDT_RATE) || 110,
  
  // Platform fee percentage
  platformFeePercent: 5,
  
  // Webhook secret for verifying webhook signatures
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Connect account settings
  connect: {
    refreshUrl: process.env.STRIPE_CONNECT_REFRESH_URL || 'http://localhost:5173/connect/refresh',
    returnUrl: process.env.STRIPE_CONNECT_RETURN_URL || 'http://localhost:5173/connect/return',
  },
  
  // Payment intent settings
  paymentIntent: {
    // Capture payment immediately (vs manual capture)
    captureMethod: 'automatic',
    // Hold funds until order is delivered
    // Note: For escrow-like behavior, consider using manual capture
  },
};

/**
 * Create a Stripe customer for a user
 * @param {object} user - User object with email and name
 * @returns {Promise<string>} - Stripe customer ID
 */
const createStripeCustomer = async (user) => {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString(),
        role: user.role,
      },
    });
    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

/**
 * Get or create a Stripe customer
 * @param {object} user - User object
 * @returns {Promise<string>} - Stripe customer ID
 */
const getOrCreateCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  return await createStripeCustomer(user);
};

/**
 * Create a Stripe Connect Express account
 * @param {object} user - User object (farmer or transporter)
 * @returns {Promise<object>} - { accountId, onboardingUrl }
 */
const createConnectAccount = async (user) => {
  try {
    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Use a supported country for testing
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId: user._id.toString(),
        role: user.role,
        platform: 'krishak',
      },
    });
    
    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: STRIPE_CONFIG.connect.refreshUrl,
      return_url: STRIPE_CONFIG.connect.returnUrl,
      type: 'account_onboarding',
    });
    
    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
};

/**
 * Get Connect account onboarding status
 * @param {string} accountId - Stripe Connect account ID
 * @returns {Promise<object>} - Account status
 */
const getConnectAccountStatus = async (accountId) => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    return {
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingComplete: account.charges_enabled && account.payouts_enabled,
      requirements: account.requirements,
    };
  } catch (error) {
    console.error('Error getting Connect account status:', error);
    throw error;
  }
};

/**
 * Create a login link for Connect account dashboard
 * @param {string} accountId - Stripe Connect account ID
 * @returns {Promise<string>} - Dashboard URL
 */
const createConnectLoginLink = async (accountId) => {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  } catch (error) {
    console.error('Error creating Connect login link:', error);
    throw error;
  }
};

/**
 * Create a new onboarding link for incomplete accounts
 * @param {string} accountId - Stripe Connect account ID
 * @returns {Promise<string>} - Onboarding URL
 */
const createOnboardingLink = async (accountId) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: STRIPE_CONFIG.connect.refreshUrl,
      return_url: STRIPE_CONFIG.connect.returnUrl,
      type: 'account_onboarding',
    });
    return accountLink.url;
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    throw error;
  }
};

module.exports = {
  stripe,
  STRIPE_CONFIG,
  createStripeCustomer,
  getOrCreateCustomer,
  createConnectAccount,
  getConnectAccountStatus,
  createConnectLoginLink,
  createOnboardingLink,
};
