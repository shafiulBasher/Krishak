const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Product = require('./models/Product');
const User = require('./models/User');

// Create a simple test image (1x1 pixel PNG)
const createTestImage = (filename) => {
  const uploadsDir = path.join(__dirname, 'uploads', 'products');
  
  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filepath = path.join(uploadsDir, filename);
  
  // PNG: 1x1 red pixel (smallest possible valid PNG)
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR chunk size
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
    0x90, 0x77, 0x53, 0xde, // CRC
    0x00, 0x00, 0x00, 0x0c, // IDAT chunk size
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xfe, 0xff,
    0x00, 0x00, 0x00, 0x02, // scanline with red pixel
    0x7d, 0x5b, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk size
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82  // CRC
  ]);

  fs.writeFileSync(filepath, png);
  return `/uploads/products/${filename}`;
};

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get a farmer user (or create one for testing)
    let farmer = await User.findOne({ role: 'farmer' });
    
    if (!farmer) {
      console.log('⚠️  No farmer found. Creating a test farmer account...');
      const { hashPassword } = require('./utils/passwordUtils');
      farmer = await User.create({
        name: 'Test Farmer',
        email: 'farmer@test.com',
        password: await hashPassword('farmer123'),
        phone: '01712345678',
        role: 'farmer',
        isVerified: true,
        isActive: true,
        location: {
          village: 'Test Village',
          thana: 'Test Thana',
          district: 'Dhaka'
        }
      });
      console.log('✅ Test farmer created:', farmer.email);
    }

    console.log('📁 Creating test images...');
    
    // Create test images
    const image1 = createTestImage('rice-sample.png');
    const image2 = createTestImage('tomato-sample.png');
    const image3 = createTestImage('potato-sample.png');
    const image4 = createTestImage('cabbage-sample.png');

    console.log('✅ Test images created\n');

    // Sample products data
    const products = [
      {
        farmer: farmer._id,
        cropName: 'Basmati Rice',
        grade: 'A',
        quantity: 500,
        unit: 'kg',
        location: {
          village: 'Modhupur',
          thana: 'Madhupur',
          district: 'Tangail',
          coordinates: { lat: 24.6446, lng: 89.7369 }
        },
        harvestDate: new Date('2024-12-15'),
        moq: 50,
        photos: [image1],
        sellingPrice: 55,
        isPreOrder: false,
        status: 'approved',
        costBreakdown: {
          seedCost: 5000,
          fertilizerCost: 8000,
          laborCost: 15000
        }
      },
      {
        farmer: farmer._id,
        cropName: 'Fresh Tomatoes',
        grade: 'B',
        quantity: 200,
        unit: 'kg',
        location: {
          village: 'Savar',
          thana: 'Savar',
          district: 'Dhaka',
          coordinates: { lat: 23.8545, lng: 90.2745 }
        },
        harvestDate: new Date('2024-12-10'),
        moq: 20,
        photos: [image2],
        sellingPrice: 25,
        isPreOrder: false,
        status: 'approved'
      },
      {
        farmer: farmer._id,
        cropName: 'Red Potatoes',
        grade: 'A',
        quantity: 1000,
        unit: 'kg',
        location: {
          village: 'Bogra',
          thana: 'Bogra Sadar',
          district: 'Bogra',
          coordinates: { lat: 24.8933, lng: 89.3668 }
        },
        harvestDate: new Date('2024-12-01'),
        moq: 100,
        photos: [image3],
        sellingPrice: 15,
        isPreOrder: false,
        status: 'approved'
      },
      {
        farmer: farmer._id,
        cropName: 'Green Cabbage',
        grade: 'A',
        quantity: 300,
        unit: 'kg',
        location: {
          village: 'Zipur',
          thana: 'Savar',
          district: 'Dhaka',
          coordinates: { lat: 23.8445, lng: 90.2845 }
        },
        harvestDate: new Date('2024-12-18'),
        moq: 30,
        photos: [image4],
        sellingPrice: 12,
        isPreOrder: true,
        expectedHarvestDate: new Date('2024-12-25'),
        status: 'approved'
      }
    ];

    // Check if products already exist
    const existingCount = await Product.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} products already exist in the database.`);
      console.log('   Skipping seed to avoid duplicates.\n');
    } else {
      console.log('🌾 Seeding products...\n');
      
      const createdProducts = await Product.insertMany(products);
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`✅ ${createdProducts.length} PRODUCTS CREATED SUCCESSFULLY!`);
      console.log('═══════════════════════════════════════════════════════════\n');
      
      createdProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.cropName}`);
        console.log(`   📍 Location: ${product.location.village}, ${product.location.district}`);
        console.log(`   📊 Available: ${product.quantity} ${product.unit}`);
        console.log(`   💰 Price: ৳${product.sellingPrice}/${product.unit}`);
        console.log(`   🖼️  Photos: ${product.photos.length}`);
        console.log();
      });
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedProducts();
