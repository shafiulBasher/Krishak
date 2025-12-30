const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

const checkOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // Get all orders
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).limit(20);
    console.log(`📊 Total orders found: ${allOrders.length}\n`);

    // Group by status
    const statusCount = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0
    };

    console.log('Recent Orders:');
    console.log('─'.repeat(100));
    
    allOrders.forEach((order, index) => {
      statusCount[order.orderStatus]++;
      console.log(`${index + 1}. ${order.orderNumber} | Status: ${order.orderStatus.toUpperCase()} | Total: ৳${order.totalPrice} | Created: ${order.createdAt.toLocaleString()}`);
    });

    console.log('\n' + '─'.repeat(100));
    console.log('\n📊 Status Summary:');
    console.log(`   Pending: ${statusCount.pending}`);
    console.log(`   Confirmed: ${statusCount.confirmed}`);
    console.log(`   Cancelled: ${statusCount.cancelled}`);
    console.log(`   Completed: ${statusCount.completed}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkOrders();
