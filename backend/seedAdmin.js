const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPassword } = require('./utils/passwordUtils');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@krishak.com' });

    if (adminExists) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email:', adminExists.email);
      console.log('   Name:', adminExists.name);
      console.log('\n   To reset admin password, delete the user and run this script again.\n');
      process.exit(0);
    }

    // Admin credentials from .env or defaults
    const adminData = {
      name: process.env.ADMIN_NAME || 'System Admin',
      email: process.env.ADMIN_EMAIL || 'admin@krishak.com',
      phone: process.env.ADMIN_PHONE || '01700000000',
      password: await hashPassword(process.env.ADMIN_PASSWORD || 'admin123'),
      role: 'admin',
      isVerified: true,
      isActive: true
    };

    // Create admin user
    const admin = await User.create(adminData);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ADMIN USER CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📧 Email:    ', process.env.ADMIN_EMAIL || 'admin@krishak.com');
    console.log('🔑 Password: ', process.env.ADMIN_PASSWORD || 'admin123');
    console.log('👤 Name:     ', admin.name);
    console.log('📱 Phone:    ', admin.phone);
    console.log('\n⚠️  IMPORTANT: Change the admin password after first login!\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();
