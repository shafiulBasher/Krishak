const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

const updatePendingOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Find all pending orders
    const pendingOrders = await Order.find({ orderStatus: 'pending' });
    console.log(`📊 Found ${pendingOrders.length} pending orders`);

    // Update each order to confirmed
    for (const order of pendingOrders) {
      order.orderStatus = 'confirmed';
      
      // Add to status history if it doesn't exist
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      
      order.statusHistory.push({
        status: 'confirmed',
        note: 'Auto-confirmed by system update',
        timestamp: new Date()
      });

      await order.save();
      console.log(`✅ Updated order ${order.orderNumber} to confirmed`);
    }

    console.log(`\n✅ Successfully updated ${pendingOrders.length} orders to confirmed status`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updatePendingOrders();
