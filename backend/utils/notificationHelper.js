const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {String} options.userId - User ID to notify
 * @param {String} options.type - Notification type
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.relatedOrder - Related order ID (optional)
 * @param {String} options.relatedProduct - Related product ID (optional)
 * @param {Object} options.metadata - Additional metadata (optional)
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedOrder = null,
  relatedProduct = null,
  metadata = {}
}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedOrder,
      relatedProduct,
      metadata
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error - notifications shouldn't break the main flow
    return null;
  }
};

/**
 * Create notifications for order events
 */
const notifyOrderPlaced = async (order) => {
  // Notify farmer about new order
  await createNotification({
    userId: order.farmer,
    type: 'order_placed',
    title: 'New Order Received',
    message: `You have received a new order #${order.orderNumber} for ${order.quantity} kg.`,
    relatedOrder: order._id,
    relatedProduct: order.product,
    metadata: {
      orderNumber: order.orderNumber,
      quantity: order.quantity,
      totalPrice: order.totalPrice
    }
  });

  // Notify buyer about order confirmation
  await createNotification({
    userId: order.buyer,
    type: 'order_confirmed',
    title: 'Order Confirmed',
    message: `Your order #${order.orderNumber} has been confirmed and is being processed.`,
    relatedOrder: order._id,
    relatedProduct: order.product,
    metadata: {
      orderNumber: order.orderNumber
    }
  });
};

const notifyOrderCancelled = async (order, cancelledBy) => {
  const isBuyer = cancelledBy.toString() === order.buyer.toString();
  const recipientId = isBuyer ? order.farmer : order.buyer;
  const recipientRole = isBuyer ? 'farmer' : 'buyer';

  await createNotification({
    userId: recipientId,
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Order #${order.orderNumber} has been cancelled by the ${isBuyer ? 'buyer' : 'farmer'}.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber,
      cancelledBy: cancelledBy.toString()
    }
  });
};

const notifyOrderCompleted = async (order) => {
  // Notify buyer
  await createNotification({
    userId: order.buyer,
    type: 'order_completed',
    title: 'Order Completed',
    message: `Your order #${order.orderNumber} has been completed successfully.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });

  // Notify farmer
  await createNotification({
    userId: order.farmer,
    type: 'order_completed',
    title: 'Order Completed',
    message: `Order #${order.orderNumber} has been completed. Payment will be processed soon.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice
    }
  });
};

const notifyDeliveryAssigned = async (order, transporterId) => {
  // Notify transporter
  await createNotification({
    userId: transporterId,
    type: 'delivery_assigned',
    title: 'New Delivery Assignment',
    message: `You have been assigned to deliver order #${order.orderNumber}.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });

  // Notify buyer
  await createNotification({
    userId: order.buyer,
    type: 'delivery_assigned',
    title: 'Delivery Assigned',
    message: `A transporter has been assigned to deliver your order #${order.orderNumber}.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });
};

const notifyDeliveryPicked = async (order) => {
  await createNotification({
    userId: order.buyer,
    type: 'delivery_picked',
    title: 'Order Picked Up',
    message: `Your order #${order.orderNumber} has been picked up and is on its way.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });
};

const notifyDeliveryInTransit = async (order) => {
  await createNotification({
    userId: order.buyer,
    type: 'delivery_in_transit',
    title: 'Order In Transit',
    message: `Your order #${order.orderNumber} is currently in transit to your location.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });
};

const notifyOrderDelivered = async (order) => {
  // Notify buyer
  await createNotification({
    userId: order.buyer,
    type: 'order_delivered',
    title: 'Order Delivered',
    message: `Your order #${order.orderNumber} has been delivered successfully.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });

  // Notify farmer
  await createNotification({
    userId: order.farmer,
    type: 'order_delivered',
    title: 'Order Delivered',
    message: `Order #${order.orderNumber} has been delivered to the buyer.`,
    relatedOrder: order._id,
    metadata: {
      orderNumber: order.orderNumber
    }
  });

  // Notify transporter about delivery completion and payment
  if (order.transporter) {
    const deliveryFee = order.priceBreakdown?.transportFee || 
                       order.deliveryFeeDetails?.totalFee || 
                       0;
    
    await createNotification({
      userId: order.transporter,
      type: 'delivery_payment',
      title: '🚚 Delivery Payment Received!',
      message: `You have completed delivery for order #${order.orderNumber} and earned ৳${Number(deliveryFee).toLocaleString()}. Great job!`,
      relatedOrder: order._id,
      metadata: {
        orderNumber: order.orderNumber,
        deliveryFee: deliveryFee,
        deliveryDate: order.actualDeliveryDate || new Date()
      }
    });
  }
};

module.exports = {
  createNotification,
  notifyOrderPlaced,
  notifyOrderCancelled,
  notifyOrderCompleted,
  notifyDeliveryAssigned,
  notifyDeliveryPicked,
  notifyDeliveryInTransit,
  notifyOrderDelivered
};

