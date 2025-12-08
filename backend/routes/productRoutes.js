const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Create new product listing
// @route   POST /api/products
// @access  Private (Farmer only)
const createProduct = asyncHandler(async (req, res) => {
  const {
    cropName,
    grade,
    quantity,
    unit,
    location,
    harvestDate,
    moq,
    costBreakdown,
    margin,
    sellingPrice,
    isPreOrder,
    expectedHarvestDate
  } = req.body;

  // Handle uploaded photos
  const photos = req.files ? req.files.map(file => /uploads/products/${file.filename}) : [];

  // Parse location if it's a string (from FormData)
  const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
  const parsedCostBreakdown = costBreakdown && typeof costBreakdown === 'string' ? JSON.parse(costBreakdown) : costBreakdown;

  const product = await Product.create({
    farmer: req.user._id,
    cropName,
    grade,
    quantity,
    unit: unit || 'kg',
    location: parsedLocation,
    harvestDate,
    moq,
    photos: photos,
    ...(parsedCostBreakdown && { costBreakdown: parsedCostBreakdown }),
    ...(margin && { calculatedPrice: { margin } }),
    sellingPrice,
    isPreOrder: isPreOrder === 'true' || isPreOrder === true,
    expectedHarvestDate,
    status: 'pending' // Awaiting admin approval
  });

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Get all products (with filters)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { status, cropName, district, grade, farmer } = req.query;
  
  const query = {};
  
  // Only show approved products to non-admins
  if (req.user?.role !== 'admin') {
    query.status = 'approved';
  } else if (status) {
    query.status = status;
  }
  
  if (cropName) query.cropName = new RegExp(cropName, 'i');
  if (district) query['location.district'] = new RegExp(district, 'i');
  if (grade) query.grade = grade;
  if (farmer) query.farmer = farmer;

  const products = await Product.find(query)
    .populate('farmer', 'name phone location avatar rating')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('farmer', 'name phone farmLocation avatar rating isVerified');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Increment view count
  product.viewCount += 1;
  await product.save();

  res.json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Farmer - own products only)
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check ownership
  if (product.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  // Handle photos - combine existing and new
  let photos = [];
  if (req.body.existingPhotos) {
    const existingPhotos = typeof req.body.existingPhotos === 'string' 
      ? JSON.parse(req.body.existingPhotos) 
      : req.body.existingPhotos;
    photos = [...existingPhotos];
  }
  
  // Add new uploaded photos
  if (req.files && req.files.length > 0) {
    const newPhotos = req.files.map(file => /uploads/products/${file.filename});
    photos = [...photos, ...newPhotos];
  }

  // Parse location if it's a string (from FormData)
  const parsedLocation = req.body.location && typeof req.body.location === 'string' 
    ? JSON.parse(req.body.location) 
    : req.body.location;

  const updateData = {
    ...req.body,
    ...(parsedLocation && { location: parsedLocation }),
    ...(photos.length > 0 && { photos }),
    isPreOrder: req.body.isPreOrder === 'true' || req.body.isPreOrder === true,
  };

  // Remove existingPhotos from update data as it's not a schema field
  delete updateData.existingPhotos;

  // If product was approved and farmer edits, reset to pending
  if (product.status === 'approved' && req.user.role === 'farmer') {
    updateData.status = 'pending';
  }

  product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Farmer - own products, Admin - all)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check ownership
  if (product.farmer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Get farmer's own products
// @route   GET /api/products/my-listings
// @access  Private (Farmer)
const getMyListings = asyncHandler(async (req, res) => {
  const products = await Product.find({ farmer: req.user._id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyListings
};