const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    // Verify we're using MongoDB Atlas (online), not localhost
    if (mongoUri && mongoUri.includes('localhost')) {
      console.error('⚠️  WARNING: MONGO_URI points to localhost!');
      console.error('   Please update .env file to use MongoDB Atlas connection string.');
      console.error('   Current URI:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    }
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Show connection type
    if (mongoUri.includes('mongodb+srv://') || mongoUri.includes('mongodb.net')) {
      console.log(`🌐 Connection Type: MongoDB Atlas (Online Cloud Database)`);
    } else {
      console.log(`💻 Connection Type: Local MongoDB`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error('Failed to connect to MongoDB. Please check your MONGO_URI in .env file');
    process.exit(1);
  }
};

module.exports = connectDB;
