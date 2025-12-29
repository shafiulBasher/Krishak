const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB Connection...\n');
    console.log('📋 Connection Details:');
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in .env file!');
      process.exit(1);
    }
    
    // Check if using MongoDB Atlas
    if (mongoUri.includes('mongodb+srv://') || mongoUri.includes('mongodb.net')) {
      console.log('✅ Using MongoDB Atlas (Online Cloud Database)');
      const clusterMatch = mongoUri.match(/@([^.]+)/);
      if (clusterMatch) {
        console.log(`   Cluster: ${clusterMatch[1]}`);
      }
    } else if (mongoUri.includes('localhost')) {
      console.error('⚠️  WARNING: Using localhost MongoDB!');
      console.error('   This is NOT the online server!');
      process.exit(1);
    } else {
      console.log('📡 Using custom MongoDB connection');
    }
    
    console.log(`\n🔌 Connecting to MongoDB...`);
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`\n✅ SUCCESS! Connected to MongoDB Atlas`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    // Test a simple query
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`\n📊 Collections found: ${collections.length}`);
    if (collections.length > 0) {
      console.log('   Collections:', collections.map(c => c.name).join(', '));
    }
    
    console.log('\n✅ All data will be fetched from MongoDB Atlas (Online Server)');
    console.log('✅ No localhost MongoDB is being used\n');
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection Failed!');
    console.error('   Error:', error.message);
    console.error('\n💡 Check:');
    console.error('   1. MongoDB Atlas connection string is correct');
    console.error('   2. IP address is whitelisted in MongoDB Atlas');
    console.error('   3. Database user credentials are correct');
    process.exit(1);
  }
};

testConnection();

