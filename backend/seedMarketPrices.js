const mongoose = require('mongoose');
const MarketPrice = require('./models/MarketPrice');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Helper function to generate realistic price variations
const generatePriceHistory = (baseWholesale, baseRetail, days = 30) => {
  const history = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    // Generate variation: ±10% fluctuation
    const variation = 1 + (Math.random() * 0.2 - 0.1); // 0.9 to 1.1
    const wholesale = Math.round(baseWholesale * variation);
    const retail = Math.round(baseRetail * variation);
    
    history.push({
      date,
      wholesale,
      retail,
      source: 'Seed Data'
    });
  }
  
  return history;
};

// Sample market prices for key crops in major districts
const samplePrices = [
  // Dhaka District
  { cropName: 'Rice (Boro)', district: 'Dhaka', category: 'Grains', baseWholesale: 55, baseRetail: 65 },
  { cropName: 'Potato', district: 'Dhaka', category: 'Vegetables', baseWholesale: 35, baseRetail: 45 },
  { cropName: 'Onion', district: 'Dhaka', category: 'Vegetables', baseWholesale: 60, baseRetail: 75 },
  { cropName: 'Tomato', district: 'Dhaka', category: 'Vegetables', baseWholesale: 40, baseRetail: 55 },
  { cropName: 'Brinjal', district: 'Dhaka', category: 'Vegetables', baseWholesale: 30, baseRetail: 40 },
  { cropName: 'Cabbage', district: 'Dhaka', category: 'Vegetables', baseWholesale: 25, baseRetail: 35 },
  { cropName: 'Green Chili', district: 'Dhaka', category: 'Vegetables', baseWholesale: 80, baseRetail: 100 },
  
  // Chittagong District
  { cropName: 'Rice (Boro)', district: 'Chittagong', category: 'Grains', baseWholesale: 58, baseRetail: 68 },
  { cropName: 'Potato', district: 'Chittagong', category: 'Vegetables', baseWholesale: 38, baseRetail: 48 },
  { cropName: 'Onion', district: 'Chittagong', category: 'Vegetables', baseWholesale: 65, baseRetail: 80 },
  { cropName: 'Tomato', district: 'Chittagong', category: 'Vegetables', baseWholesale: 45, baseRetail: 60 },
  { cropName: 'Banana', district: 'Chittagong', category: 'Fruits', baseWholesale: 40, baseRetail: 50 },
  
  // Rajshahi District
  { cropName: 'Rice (Aman)', district: 'Rajshahi', category: 'Grains', baseWholesale: 50, baseRetail: 60 },
  { cropName: 'Wheat', district: 'Rajshahi', category: 'Grains', baseWholesale: 45, baseRetail: 55 },
  { cropName: 'Potato', district: 'Rajshahi', category: 'Vegetables', baseWholesale: 32, baseRetail: 42 },
  { cropName: 'Onion', district: 'Rajshahi', category: 'Vegetables', baseWholesale: 55, baseRetail: 70 },
  { cropName: 'Mango', district: 'Rajshahi', category: 'Fruits', baseWholesale: 60, baseRetail: 80 },
  
  // Khulna District
  { cropName: 'Rice (Boro)', district: 'Khulna', category: 'Grains', baseWholesale: 53, baseRetail: 63 },
  { cropName: 'Potato', district: 'Khulna', category: 'Vegetables', baseWholesale: 36, baseRetail: 46 },
  { cropName: 'Brinjal', district: 'Khulna', category: 'Vegetables', baseWholesale: 28, baseRetail: 38 },
  { cropName: 'Pumpkin', district: 'Khulna', category: 'Vegetables', baseWholesale: 20, baseRetail: 30 },
  
  // Sylhet District
  { cropName: 'Rice (Aman)', district: 'Sylhet', category: 'Grains', baseWholesale: 52, baseRetail: 62 },
  { cropName: 'Potato', district: 'Sylhet', category: 'Vegetables', baseWholesale: 40, baseRetail: 50 },
  { cropName: 'Ginger', district: 'Sylhet', category: 'Vegetables', baseWholesale: 120, baseRetail: 150 },
  { cropName: 'Turmeric', district: 'Sylhet', category: 'Spices', baseWholesale: 200, baseRetail: 250 },
  
  // Comilla District
  { cropName: 'Rice (Boro)', district: 'Comilla', category: 'Grains', baseWholesale: 54, baseRetail: 64 },
  { cropName: 'Potato', district: 'Comilla', category: 'Vegetables', baseWholesale: 34, baseRetail: 44 },
  { cropName: 'Tomato', district: 'Comilla', category: 'Vegetables', baseWholesale: 42, baseRetail: 57 },
  { cropName: 'Cauliflower', district: 'Comilla', category: 'Vegetables', baseWholesale: 30, baseRetail: 40 },
  
  // Mymensingh District
  { cropName: 'Rice (Boro)', district: 'Mymensingh', category: 'Grains', baseWholesale: 51, baseRetail: 61 },
  { cropName: 'Maize', district: 'Mymensingh', category: 'Grains', baseWholesale: 35, baseRetail: 45 },
  { cropName: 'Potato', district: 'Mymensingh', category: 'Vegetables', baseWholesale: 33, baseRetail: 43 },
  { cropName: 'Cucumber', district: 'Mymensingh', category: 'Vegetables', baseWholesale: 25, baseRetail: 35 }
];

// Seed function
const seedMarketPrices = async () => {
  try {
    console.log('🌱 Starting market price seeding...');
    
    // Clear existing data
    await MarketPrice.deleteMany({});
    console.log('🗑️  Cleared existing market prices');
    
    const priceEntries = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const sample of samplePrices) {
      const history = generatePriceHistory(sample.baseWholesale, sample.baseRetail, 30);
      const latestPrice = history[history.length - 1];
      
      priceEntries.push({
        cropName: sample.cropName,
        district: sample.district,
        category: sample.category,
        unit: sample.cropName === 'Banana' ? 'dozen' : 'kg',
        currentPrice: {
          wholesale: latestPrice.wholesale,
          retail: latestPrice.retail,
          date: today,
          source: 'Seed Data'
        },
        priceHistory: history,
        isActive: true
      });
    }
    
    await MarketPrice.insertMany(priceEntries);
    
    console.log(`✅ Successfully seeded ${priceEntries.length} market price entries`);
    console.log('📊 Price data covers:');
    console.log(`   - ${new Set(samplePrices.map(p => p.district)).size} districts`);
    console.log(`   - ${new Set(samplePrices.map(p => p.cropName)).size} crops`);
    console.log(`   - 30 days of historical data per entry`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding market prices:', error);
    process.exit(1);
  }
};

// Run the seed
(async () => {
  await connectDB();
  await seedMarketPrices();
})();
