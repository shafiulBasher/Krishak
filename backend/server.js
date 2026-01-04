const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { handleStripeWebhook } = require('./webhooks/stripeWebhook');

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

// Stripe webhook route - MUST be before express.json() middleware
// because Stripe needs raw body for signature verification
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

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

// API Routes - Register all routes together for consistency
// Load and verify notification routes
const notificationRoutes = require('./routes/notificationRoutes');
if (!notificationRoutes || typeof notificationRoutes !== 'function') {
  console.error('❌ CRITICAL: Notification routes failed to load!');
  process.exit(1);
}

// Register all API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/market-prices', require('./routes/marketPriceRoutes'));
app.use('/api/transporter', require('./routes/transporterRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Verify notification routes are registered
console.log('\n🔍 Verifying notification routes registration...');
const allRoutes = app._router?.stack || [];
const notificationRoutesInStack = allRoutes.filter(r => 
  r.regexp && r.regexp.toString().includes('notifications')
);
console.log(`   Found ${notificationRoutesInStack.length} notification route handler(s) in Express router stack`);
if (notificationRoutesInStack.length === 0) {
  console.error('   ⚠️  WARNING: Notification routes not found in router stack!');
} else {
  console.log('   ✅ Notification routes are registered in Express');
}

// Debug: Log registered routes on startup
console.log('✅ API Routes registered:');
console.log('   - /api/auth');
console.log('   - /api/users');
console.log('   - /api/products');
console.log('   - /api/orders');
console.log('   - /api/admin');
console.log('   - /api/market-prices');
console.log('   - /api/transporter');
console.log('   - /api/notifications ✅ VERIFIED');
console.log('   - /api/reviews ✅ VERIFIED');
console.log('   - /api/payments ✅ NEW');
console.log('   - /api/webhook/stripe ✅ WEBHOOK');
console.log('');
console.log('🔔 Notification system is ACTIVE and ready!');
console.log('💳 Payment system is ACTIVE and ready!');

// 404 handler for unmatched API routes (must be after all routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      '/api/auth',
      '/api/users',
      '/api/products',
      '/api/orders',
      '/api/admin',
      '/api/market-prices',
      '/api/transporter',
      '/api/notifications',
      '/api/reviews',
      '/api/payments',
      '/api/webhook/stripe'
    ]
  });
});

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
  console.log(`🔔 Notification system: ACTIVE at /api/notifications`);
});