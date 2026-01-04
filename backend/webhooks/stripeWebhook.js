const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

// Initialize Stripe lazily to ensure env vars are loaded
let stripe;
const getStripe = () => {
  if (!stripe) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * Handle Stripe webhooks
 * POST /api/webhook/stripe
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // Verify webhook signature
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log('Stripe webhook received:', event.type);
  
  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
        
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
        
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
        
      case 'transfer.updated':
        await handleTransferUpdated(event.data.object);
        break;
        
      case 'transfer.failed':
        await handleTransferFailed(event.data.object);
        break;
        
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Record webhook event
    await Transaction.findOneAndUpdate(
      { paymentIntentId: event.data.object.id },
      {
        $push: {
          webhookEvents: {
            eventType: event.type,
            eventId: event.id,
            receivedAt: new Date(),
          },
        },
      }
    );
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handle payment_intent.succeeded event
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  console.log('Payment succeeded:', paymentIntent.id);
  
  const orderId = paymentIntent.metadata.orderId;
  
  if (!orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }
  
  // Update order
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    paymentMethod: 'stripe',
  });
  
  // Update transaction
  await Transaction.findOneAndUpdate(
    { paymentIntentId: paymentIntent.id },
    {
      status: 'captured',
      chargeId: paymentIntent.charges?.data[0]?.id,
    }
  );
  
  console.log(`Order ${orderId} payment confirmed`);
};

/**
 * Handle payment_intent.payment_failed event
 */
const handlePaymentIntentFailed = async (paymentIntent) => {
  console.log('Payment failed:', paymentIntent.id);
  
  const orderId = paymentIntent.metadata.orderId;
  
  if (!orderId) return;
  
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'failed',
  });
  
  await Transaction.findOneAndUpdate(
    { paymentIntentId: paymentIntent.id },
    {
      status: 'failed',
    }
  );
  
  console.log(`Order ${orderId} payment failed`);
};

/**
 * Handle payment_intent.canceled event
 */
const handlePaymentIntentCanceled = async (paymentIntent) => {
  console.log('Payment canceled:', paymentIntent.id);
  
  const orderId = paymentIntent.metadata.orderId;
  
  if (!orderId) return;
  
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'failed',
    orderStatus: 'cancelled',
  });
  
  await Transaction.findOneAndUpdate(
    { paymentIntentId: paymentIntent.id },
    {
      status: 'failed',
    }
  );
};

/**
 * Handle charge.refunded event
 */
const handleChargeRefunded = async (charge) => {
  console.log('Charge refunded:', charge.id);
  
  const paymentIntentId = charge.payment_intent;
  
  await Transaction.findOneAndUpdate(
    { paymentIntentId },
    {
      status: 'refunded',
      'refund.refundId': charge.refunds?.data[0]?.id,
      'refund.amount': charge.amount_refunded / 100,
      'refund.refundedAt': new Date(),
    }
  );
  
  const transaction = await Transaction.findOne({ paymentIntentId });
  if (transaction) {
    await Order.findByIdAndUpdate(transaction.orderId, {
      paymentStatus: 'refunded',
      orderStatus: 'cancelled',
    });
  }
};

/**
 * Handle transfer.created event
 */
const handleTransferCreated = async (transfer) => {
  console.log('Transfer created:', transfer.id);
  
  // Find transaction by metadata
  const orderId = transfer.metadata?.orderId;
  if (!orderId) return;
  
  await Transaction.findOneAndUpdate(
    { orderId },
    {
      $push: {
        transfers: {
          stripeTransferId: transfer.id,
          amount: transfer.amount / 100,
          status: 'pending',
        },
      },
    }
  );
};

/**
 * Handle transfer.updated event
 */
const handleTransferUpdated = async (transfer) => {
  console.log('Transfer updated:', transfer.id);
  
  const orderId = transfer.metadata?.orderId;
  if (!orderId) return;
  
  await Transaction.findOneAndUpdate(
    { 
      orderId,
      'transfers.stripeTransferId': transfer.id,
    },
    {
      $set: {
        'transfers.$.status': 'completed',
        'transfers.$.transferredAt': new Date(),
      },
    }
  );
};

/**
 * Handle transfer.failed event
 */
const handleTransferFailed = async (transfer) => {
  console.error('Transfer failed:', transfer.id, transfer.failure_message);
  
  const orderId = transfer.metadata?.orderId;
  if (!orderId) return;
  
  await Transaction.findOneAndUpdate(
    { 
      orderId,
      'transfers.stripeTransferId': transfer.id,
    },
    {
      $set: {
        'transfers.$.status': 'failed',
        'transfers.$.error': transfer.failure_message,
      },
    }
  );
};

/**
 * Handle account.updated event
 */
const handleAccountUpdated = async (account) => {
  console.log('Account updated:', account.id);
  
  const userId = account.metadata?.userId;
  if (!userId) return;
  
  const User = require('../models/User');
  
  const onboardingComplete = account.charges_enabled && account.payouts_enabled;
  
  await User.findByIdAndUpdate(userId, {
    stripeOnboardingComplete: onboardingComplete,
  });
  
  console.log(`User ${userId} onboarding status: ${onboardingComplete}`);
};

module.exports = { handleStripeWebhook };
