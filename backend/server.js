const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// FORCE the path to the .env file in the current directory
dotenv.config({ path: path.join(__dirname, '.env') });

// DEBUG: Check if variables are loaded now
console.log("--- DEBUG START ---");
console.log("JWT_SECRET is:", process.env.JWT_SECRET ? "Loaded" : "NOT LOADED");
console.log("MONGO_URI is:", process.env.MONGO_URI ? "Loaded" : "NOT LOADED");
if (process.env.MONGO_URI) {
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri.includes('mongodb+srv://') || mongoUri.includes('mongodb.net')) {
    console.log("✅ Using MongoDB Atlas (Online)");
    console.log("   Cluster:", mongoUri.match(/@([^.]+)/)?.[1] || "Unknown");
  } else if (mongoUri.includes('localhost')) {
    console.log("⚠️  WARNING: Using localhost MongoDB!");
  } else {
    console.log("📡 Using MongoDB:", mongoUri.substring(0, 30) + "...");
  }
}
console.log("--- DEBUG END ---");

// Connect to database imports
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - Allow requests from frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    // Add your production frontend URL here when deployed
    // 'https://your-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Expires'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests
app.options('*', cors());

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Krishak API is running',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/market-prices', require('./routes/marketPriceRoutes'));
app.use('/api/transporter', require('./routes/transporterRoutes'));

// Debug: Log registered routes on startup
console.log('✅ Order routes registered: /api/orders/stats/buyer, /api/orders/stats/transporter');
console.log('✅ Transporter routes registered: /api/transporter/*');

// Error handler middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});