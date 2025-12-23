const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get buyer's cart
// @route   GET /api/cart
// @access  Private (Buyer)
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ buyer: req.user._id })
    .populate('items.product', 'cropName sellingPrice photos grade')
    .populate('items.farmer', 'name avatar')
    .populate('deliveryPreferences.deliverySlot');

  if (!cart) {
    return res.json({
      success: true,
      data: {
        buyer: req.user._id,
        items: [],
        deliveryPreferences: {},
        cartSummary: {
          subtotal: 0,
          platformFee: 0,
          estimatedDeliveryFee: 0,
          total: 0
        }
      }
    });
  }

  res.json({
    success: true,
    data: cart
  });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private (Buyer)
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  // Validate input
  if (!productId || !quantity) {
    res.status(400);
    throw new Error('Product ID and quantity are required');
  }

  if (quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1');
  }

  // Get product details
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if product is available
  if (product.status !== 'approved') {
    res.status(400);
    throw new Error('This product is not available for purchase');
  }

  if (product.quantity < quantity) {
    res.status(400);
    throw new Error(`Only ${product.quantity} kg available`);
  }

  // Get or create cart
  let cart = await Cart.findOne({ buyer: req.user._id });
  
  if (!cart) {
    cart = await Cart.create({
      buyer: req.user._id,
      items: []
    });
  }

  // Check if item already exists
  const existingItem = cart.items.find(item => item.product.toString() === productId);

  if (existingItem) {
    // Update existing item
    const newQuantity = existingItem.quantity + quantity;
    
    if (product.quantity < newQuantity) {
      res.status(400);
      throw new Error(`Only ${product.quantity} kg available`);
    }

    existingItem.quantity = newQuantity;
    existingItem.totalPrice = newQuantity * product.sellingPrice;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      farmer: product.farmer,
      quantity,
      pricePerUnit: product.sellingPrice,
      totalPrice: quantity * product.sellingPrice
    });
  }

  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'cropName sellingPrice photos grade')
    .populate('items.farmer', 'name avatar');

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data: updatedCart
  });
});

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:productId
// @access  Private (Buyer)
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (!quantity) {
    res.status(400);
    throw new Error('Quantity is required');
  }

  if (quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1');
  }

  // Get product to check availability
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.quantity < quantity) {
    res.status(400);
    throw new Error(`Only ${product.quantity} kg available`);
  }

  // Update cart
  const cart = await Cart.findOne({ buyer: req.user._id });
  
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.find(item => item.product.toString() === productId);
  
  if (!item) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  item.quantity = quantity;
  item.totalPrice = quantity * item.pricePerUnit;

  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'cropName sellingPrice photos grade')
    .populate('items.farmer', 'name avatar');

  res.json({
    success: true,
    message: 'Cart item updated',
    data: updatedCart
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private (Buyer)
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ buyer: req.user._id });
  
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
  
  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'cropName sellingPrice photos grade')
    .populate('items.farmer', 'name avatar');

  res.json({
    success: true,
    message: 'Item removed from cart',
    data: updatedCart
  });
});

// @desc    Update delivery preferences
// @route   PUT /api/cart/delivery-preferences
// @access  Private (Buyer)
const updateDeliveryPreferences = asyncHandler(async (req, res) => {
  const { selectedAddressId, deliverySlot, mapLocation, preferredDeliveryDate } = req.body;

  let cart = await Cart.findOne({ buyer: req.user._id });
  
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  // Update delivery preferences
  cart.deliveryPreferences = {
    ...cart.deliveryPreferences,
    ...(selectedAddressId && { selectedAddressId }),
    ...(deliverySlot && { deliverySlot }),
    ...(mapLocation && { 
      mapLocation: {
        lat: mapLocation.lat,
        lng: mapLocation.lng,
        address: mapLocation.address,
        isMapBased: true
      }
    }),
    ...(preferredDeliveryDate && { preferredDeliveryDate })
  };

  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'cropName sellingPrice photos grade')
    .populate('items.farmer', 'name avatar')
    .populate('deliveryPreferences.deliverySlot');

  res.json({
    success: true,
    message: 'Delivery preferences updated',
    data: updatedCart
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private (Buyer)
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ buyer: req.user._id });
  
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items = [];
  cart.deliveryPreferences = {};
  await cart.save();

  res.json({
    success: true,
    message: 'Cart cleared',
    data: cart
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  updateDeliveryPreferences,
  clearCart
};
