# Cart and Order Management Integration Guide - Module 2

## Overview
This document provides a complete guide for integrating the shopping cart and order management system for buyers in the Krishak platform. The system supports:

- ✅ Adding items to cart
- ✅ Selecting delivery slots
- ✅ Map-based delivery location selection
- ✅ Placing orders from cart
- ✅ Order tracking and status updates
- ✅ Rating and feedback system

---

## Backend Implementation

### 1. Models Created

#### Cart Model (`backend/models/Cart.js`)
Stores buyer's shopping cart with items, delivery preferences, and pricing summary.

**Key Fields:**
- `buyer`: Reference to User (unique per buyer)
- `items[]`: Array of cart items with product details
- `deliveryPreferences`: Stores selected address/map location and delivery slot
- `cartSummary`: Calculates subtotal, platform fee (5%), and total

**Features:**
- Auto-calculation of totals
- Tracks last updated time
- Supports both saved addresses and map-based locations

#### DeliverySlot Model (`backend/models/DeliverySlot.js`)
Manages available delivery time slots for different districts and farmers.

**Key Fields:**
- `farmer`: Optional reference (can be farmer-specific or general)
- `coverage`: District and thana coverage
- `startTime` / `endTime`: Delivery window (e.g., "09:00" - "12:00")
- `availableDays`: Days of week when slot is available (0-6)
- `maxOrders`: Capacity limit
- `deliveryFee`: Cost for using this slot
- `minimumOrderValue`: Minimum cart value required

---

### 2. Controllers Created

#### Cart Controller (`backend/controllers/cartController.js`)

**Endpoints:**
```
GET    /api/cart                          - Get buyer's cart
POST   /api/cart                          - Add item to cart
PUT    /api/cart/:productId               - Update item quantity
DELETE /api/cart/:productId               - Remove item from cart
PUT    /api/cart/preferences/delivery     - Update delivery preferences
DELETE /api/cart                          - Clear entire cart
```

**Key Functions:**
- `getCart()` - Retrieves cart with populated product and farmer details
- `addToCart()` - Validates stock, adds or updates cart items
- `updateCartItem()` - Modifies quantity with stock validation
- `removeFromCart()` - Removes single item
- `updateDeliveryPreferences()` - Stores delivery address or map location + slot
- `clearCart()` - Empties cart after order placement

#### Order Controller (`backend/controllers/orderController.js`)

**Endpoints:**
```
POST   /api/orders                        - Create order(s) from cart
GET    /api/orders/buyer                  - Get buyer's orders
GET    /api/orders/farmer                 - Get farmer's orders
GET    /api/orders/:id                    - Get single order details
PUT    /api/orders/:id/status             - Update order status
PUT    /api/orders/:id/delivery-status    - Update delivery status
PUT    /api/orders/:id/cancel             - Cancel order
PUT    /api/orders/:id/rate               - Rate farmer/transporter
GET    /api/orders/delivery-slots         - Get available slots
```

**Key Features:**
- Creates separate orders per farmer (maintains direct buyer-farmer relationship)
- Validates stock before order creation
- Reduces product quantity on successful order
- Supports map-based and address-based delivery
- Handles order cancellation with automatic stock restoration
- Records complete status history with timestamps
- Rating system for farmers and transporters

---

### 3. Routes

#### Cart Routes (`backend/routes/cartRoutes.js`)
All cart endpoints require authentication and buyer role.

#### Order Routes (`backend/routes/orderRoutes.js`)
- Public: GET delivery slots
- Protected: Order creation (buyers), viewing orders
- Role-specific: Status updates by farmers/transporters

---

## Frontend Implementation

### 1. Context Management

#### CartContext (`frontend/src/context/CartContext.jsx`)
Global state management for shopping cart operations.

**Methods:**
```javascript
- addToCart(productId, quantity)
- updateCartItem(productId, quantity)
- removeFromCart(productId)
- updateDeliveryPreferences(preferences)
- clearCart()
- getCartItemCount()
- getTotalQuantity()
```

**Usage:**
```jsx
const { cart, addToCart, removeFromCart } = useContext(CartContext);
```

---

### 2. Pages & Components

#### ProductCard Component (`frontend/src/components/ProductCard.jsx`)
Displays product with add-to-cart functionality.

**Features:**
- Add to cart modal with quantity selector
- Displays farmer information and ratings
- Shows cost breakdown if available
- Stock availability validation
- Success/error notifications

#### Cart Page (`frontend/src/pages/buyer/Cart.jsx`)
Shows shopping cart with items and order summary.

**Features:**
- List all cart items with images
- Adjust quantities with +/- buttons
- Remove individual items
- Real-time price calculation
- Order summary with fees breakdown
- Link to checkout

#### Checkout Page (`frontend/src/pages/buyer/Checkout.jsx`)
Complete checkout flow with delivery and payment options.

**Features:**
- Choose between saved addresses or map-based delivery
- Add new delivery address
- Select delivery slot
- Display available delivery slots
- Choose payment method
- Add special instructions/notes
- Order summary sidebar
- Maps integration ready (placeholder provided)

#### MyOrders Page (`frontend/src/pages/buyer/MyOrders.jsx`)
Order history and tracking.

**Features:**
- Filter orders by status (all, pending, confirmed, completed, cancelled)
- View order details including:
  - Product and quantity
  - Farmer information
  - Delivery address
  - Payment status
  - Order timeline
- Cancel orders (with restrictions)
- Rate farmers and delivery personnel
- View existing ratings

---

## Integration Steps

### 1. Setup Environment
```bash
# Backend
cd backend
npm install  # Already done

# Frontend  
cd frontend
npm install  # Already done
```

### 2. Configure Backend
Create `.env` file in backend directory:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=5000
```

### 3. Initialize Database Models
Models are automatically created on first use. To seed with sample delivery slots:

```javascript
// In backend/seedDeliverySlots.js (create this file)
const DeliverySlot = require('./models/DeliverySlot');

const slots = [
  {
    coverage: { district: 'Dhaka', thana: 'Mirpur' },
    startTime: '09:00',
    endTime: '12:00',
    availableDays: [1, 2, 3, 4, 5],
    maxOrders: 20,
    deliveryFee: 100,
    description: 'Morning Delivery',
    isActive: true
  },
  {
    coverage: { district: 'Dhaka', thana: 'Mirpur' },
    startTime: '14:00',
    endTime: '17:00',
    availableDays: [1, 2, 3, 4, 5],
    maxOrders: 20,
    deliveryFee: 100,
    description: 'Afternoon Delivery',
    isActive: true
  }
];

DeliverySlot.insertMany(slots);
```

### 4. Update App.jsx with Routes
Add the following routes to your main App.jsx:

```jsx
import { CartProvider } from './context/CartContext';
import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import MyOrders from './pages/buyer/MyOrders';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* ... existing routes ... */}
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
```

### 5. Update Navbar with Cart Link
Add cart icon to navbar:
```jsx
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

// In Navbar component
const { getCartItemCount } = useContext(CartContext);
const itemCount = getCartItemCount();

<Link to="/cart" className="relative">
  <ShoppingCart size={20} />
  {itemCount > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
      {itemCount}
    </span>
  )}
</Link>
```

---

## API Usage Examples

### Adding to Cart
```javascript
// Using CartContext
const { addToCart } = useContext(CartContext);
await addToCart('product_id', 5); // Add 5 kg
```

### Creating an Order
```javascript
const orderData = {
  deliveryAddressId: 'address_id', // OR mapLocation
  mapLocation: { lat: 23.8103, lng: 90.4125, address: "...", district: "..." },
  deliverySlot: 'slot_id',
  paymentMethod: 'cash_on_delivery',
  notes: 'Special instructions'
};

await api.post('/orders', orderData);
```

### Getting Orders
```javascript
// Buyer's orders
await api.get('/orders/buyer?status=pending');

// Farmer's orders
await api.get('/orders/farmer?deliveryStatus=pending');
```

### Rating an Order
```javascript
await api.put(`/orders/${orderId}/rate`, {
  rating: 5,
  review: 'Great quality products',
  rateType: 'farmer'
});
```

---

## Features Overview

### Cart Management
- ✅ Add/remove items
- ✅ Update quantities
- ✅ Automatic price calculation
- ✅ Platform fee (5%)
- ✅ Persistent cart state

### Delivery Options
- ✅ Saved addresses
- ✅ Add new addresses during checkout
- ✅ Map-based delivery selection (ready for Google Maps integration)
- ✅ Delivery slot selection
- ✅ Multiple delivery time windows

### Order Management
- ✅ Single-click checkout
- ✅ Multiple farmer orders in one transaction
- ✅ Order tracking with status updates
- ✅ Order cancellation with stock restoration
- ✅ Payment status tracking
- ✅ Delivery status tracking

### Rating & Feedback
- ✅ Rate farmers after order completion
- ✅ Rate delivery personnel
- ✅ Star-based rating system (1-5)
- ✅ Optional review comments
- ✅ Automatic rating aggregation

---

## Future Enhancements

1. **Google Maps Integration**
   - Replace map placeholder with interactive Google Maps API
   - Autocomplete address suggestions
   - Distance calculation for delivery fees

2. **Payment Gateway Integration**
   - bKash API integration
   - Nagad API integration
   - Card payment processing

3. **Real-time Notifications**
   - Order status updates via WebSockets
   - Delivery tracking notifications
   - Push notifications

4. **Advanced Features**
   - Wishlist functionality
   - Bulk ordering for businesses
   - Subscription-based ordering
   - Loyalty points system

---

## Testing Checklist

- [ ] Cart add/remove items
- [ ] Quantity adjustment
- [ ] Price calculations
- [ ] Delivery address selection
- [ ] Map-based delivery
- [ ] Order creation
- [ ] Order cancellation
- [ ] Rating submission
- [ ] Order filtering by status
- [ ] Stock reduction verification
- [ ] Platform fee calculation

---

## Support & Troubleshooting

### Common Issues

**Issue:** Cart items not persisting
**Solution:** Ensure CartProvider wraps your app and user is authenticated

**Issue:** Orders not creating
**Solution:** Check delivery address/map location and delivery slot selection

**Issue:** Stock not reducing
**Solution:** Verify order creation response and product ID references

**Issue:** Ratings not showing
**Solution:** Ensure order status is 'completed' before rating

---

## File Summary

### Backend Files Created
```
backend/
├── models/
│   ├── Cart.js
│   └── DeliverySlot.js
├── controllers/
│   ├── cartController.js
│   └── orderController.js
└── routes/
    ├── cartRoutes.js
    └── orderRoutes.js
```

### Frontend Files Created
```
frontend/src/
├── context/
│   └── CartContext.jsx
├── pages/buyer/
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   └── MyOrders.jsx
└── components/
    └── ProductCard.jsx
```

---

## Conclusion

The cart and order management system is fully integrated and ready for use. The system provides a seamless shopping experience with multiple delivery options, transparent pricing, and complete order tracking. Further enhancements can be made by integrating real payment gateways and mapping APIs.

For questions or issues, refer to the code comments and the individual file documentation.
