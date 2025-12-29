const mongoose = require('mongoose');
const DeliverySlot = require('./models/DeliverySlot');
require('dotenv').config();

const seedDeliverySlots = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing slots
    await DeliverySlot.deleteMany({});
    console.log('🗑️  Cleared existing delivery slots\n');

    // Define delivery slots for different districts and times
    const slots = [
      // Dhaka - Mirpur
      {
        coverage: { district: 'Dhaka', thana: 'Mirpur' },
        startTime: '09:00',
        endTime: '12:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 20,
        currentOrders: 0,
        deliveryFee: 100,
        minimumOrderValue: 0,
        description: 'Morning Delivery (9 AM - 12 PM)',
        isActive: true
      },
      {
        coverage: { district: 'Dhaka', thana: 'Mirpur' },
        startTime: '14:00',
        endTime: '17:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 20,
        currentOrders: 0,
        deliveryFee: 100,
        minimumOrderValue: 0,
        description: 'Afternoon Delivery (2 PM - 5 PM)',
        isActive: true
      },
      {
        coverage: { district: 'Dhaka', thana: 'Mirpur' },
        startTime: '17:00',
        endTime: '20:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 15,
        currentOrders: 0,
        deliveryFee: 120,
        minimumOrderValue: 0,
        description: 'Evening Delivery (5 PM - 8 PM)',
        isActive: true
      },
      // Dhaka - Dhanmondi
      {
        coverage: { district: 'Dhaka', thana: 'Dhanmondi' },
        startTime: '09:00',
        endTime: '12:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 20,
        currentOrders: 0,
        deliveryFee: 100,
        minimumOrderValue: 0,
        description: 'Morning Delivery (9 AM - 12 PM)',
        isActive: true
      },
      {
        coverage: { district: 'Dhaka', thana: 'Dhanmondi' },
        startTime: '14:00',
        endTime: '17:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 20,
        currentOrders: 0,
        deliveryFee: 100,
        minimumOrderValue: 0,
        description: 'Afternoon Delivery (2 PM - 5 PM)',
        isActive: true
      },
      // Dhaka - Gulshan
      {
        coverage: { district: 'Dhaka', thana: 'Gulshan' },
        startTime: '09:00',
        endTime: '12:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 20,
        currentOrders: 0,
        deliveryFee: 100,
        minimumOrderValue: 0,
        description: 'Morning Delivery (9 AM - 12 PM)',
        isActive: true
      },
      {
        coverage: { district: 'Dhaka', thana: 'Gulshan' },
        startTime: '14:00',
        endTime: '17:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 20,
        currentOrders: 0,
        deliveryFee: 100,
        minimumOrderValue: 0,
        description: 'Afternoon Delivery (2 PM - 5 PM)',
        isActive: true
      },
      // Chittagong - Halishahar
      {
        coverage: { district: 'Chittagong', thana: 'Halishahar' },
        startTime: '09:00',
        endTime: '12:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 15,
        currentOrders: 0,
        deliveryFee: 150,
        minimumOrderValue: 0,
        description: 'Morning Delivery (9 AM - 12 PM)',
        isActive: true
      },
      {
        coverage: { district: 'Chittagong', thana: 'Halishahar' },
        startTime: '14:00',
        endTime: '17:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 15,
        currentOrders: 0,
        deliveryFee: 150,
        minimumOrderValue: 0,
        description: 'Afternoon Delivery (2 PM - 5 PM)',
        isActive: true
      },
      // Khulna - Khulna Sadar
      {
        coverage: { district: 'Khulna', thana: 'Khulna Sadar' },
        startTime: '10:00',
        endTime: '13:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 12,
        currentOrders: 0,
        deliveryFee: 200,
        minimumOrderValue: 0,
        description: 'Morning Delivery (10 AM - 1 PM)',
        isActive: true
      },
      {
        coverage: { district: 'Khulna', thana: 'Khulna Sadar' },
        startTime: '15:00',
        endTime: '18:00',
        availableDays: [1, 2, 3, 4, 5],
        maxOrders: 12,
        currentOrders: 0,
        deliveryFee: 200,
        minimumOrderValue: 0,
        description: 'Afternoon Delivery (3 PM - 6 PM)',
        isActive: true
      }
    ];

    // Insert slots into database
    const createdSlots = await DeliverySlot.insertMany(slots);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ DELIVERY SLOTS CREATED SUCCESSFULLY!`);
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📦 Created ${createdSlots.length} delivery slots\n`);
    
    // Print summary by district
    const slotsByDistrict = {};
    createdSlots.forEach(slot => {
      const key = slot.coverage.district;
      slotsByDistrict[key] = (slotsByDistrict[key] || 0) + 1;
    });

    console.log('📍 Slots by District:');
    Object.entries(slotsByDistrict).forEach(([district, count]) => {
      console.log(`   ${district}: ${count} slots`);
    });
    
    console.log('\n⏰ Available Time Slots:');
    console.log('   • 9 AM - 12 PM (Morning)');
    console.log('   • 2 PM - 5 PM (Afternoon)');
    console.log('   • 5 PM - 8 PM (Evening)');
    
    console.log('\n💰 Delivery Fees:');
    console.log('   • Dhaka: ৳100 (Morning/Afternoon), ৳120 (Evening)');
    console.log('   • Chittagong: ৳150');
    console.log('   • Khulna: ৳200\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding delivery slots:', error.message);
    process.exit(1);
  }
};

seedDeliverySlots();
