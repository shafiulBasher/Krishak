# Module 2: Quick Start Guide - Cart & Order Management

## 🚀 Quick Overview

This module implements a complete shopping cart and order management system for the Krishak agricultural marketplace. Buyers can add items to cart, select delivery options, and place orders with full tracking capabilities.

---

## 📦 What's Included

### Backend
- **Cart Management**: Add/remove/update items, delivery preferences
- **Order Processing**: Create orders, track status, cancel, rate
- **Delivery Slots**: Manage delivery time windows
- **Stock Management**: Automatic inventory updates

### Frontend
- **Shopping Cart**: Item management with real-time calculations
- **Product Cards**: Add-to-cart with quantity selector
- **Checkout Flow**: Address selection, slot selection, payment
- **Order Tracking**: Full order history with status updates
- **Rating System**: Rate farmers and delivery personnel

---

## 🔧 Installation

### Backend
```bash
cd backend
npm install  # Already done if following main setup
npm start
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install  # Already done if following main setup
npm run dev
# App runs on http://localhost:5173
```

---

## 📋 File Locations

### Backend Models
```
backend/models/
├── Cart.js          # Shopping cart schema
└── DeliverySlot.js  # Delivery time slots
```

### Backend Controllers
```
backend/controllers/
├── cartController.js     # Cart operations
└── orderController.js    # Order management
```

### Backend Routes
```
backend/routes/
├── cartRoutes.js         # /api/cart endpoints
└── orderRoutes.js        # /api/orders endpoints
```

### Frontend Context
```
frontend/src/context/
└── CartContext.jsx  # Global cart state
```

### Frontend Pages
```
frontend/src/pages/buyer/
├── Cart.jsx        # Shopping cart page
├── Checkout.jsx    # Checkout flow
└── MyOrders.jsx    # Order history
```

### Frontend Components
```
frontend/src/components/
└── ProductCard.jsx # Product card with add-to-cart
```

---

## 🎯 Key Functions

### Cart Context Methods
```javascript
const { 
  cart,
  addToCart,
  updateCartItem,
  removeFromCart,
  updateDeliveryPreferences,
  clearCart,
  getCartItemCount,
  getTotalQuantity
} = useContext(CartContext);
```

### Usage Examples
```javascript
// Add 5 kg of product to cart
await addToCart('product_id', 5);

// Update quantity to 10 kg
await updateCartItem('product_id', 10);

// Remove product from cart
await removeFromCart('product_id');

// Get number of items in cart
const count = getCartItemCount(); // returns 3

// Get total kg in cart
const qty = getTotalQuantity(); // returns 15
```

---

## 📱 User Flow

### Buyer Journey
```
1. Browse Products
   ↓
2. Click "Add to Cart" on product
   ↓
3. Select quantity in modal
   ↓
4. View cart (icon in navbar)
   ↓
5. Adjust quantities/remove items
   ↓
6. Click "Proceed to Checkout"
   ↓
7. Select delivery address or location on map
   ↓
8. Select delivery slot (if available)
   ↓
9. Choose payment method
   ↓
10. Place Order
    ↓
11. View orders in "My Orders"
    ↓
12. Track delivery status
    ↓
13. Rate farmer/delivery (when completed)
```

---

## 🔌 API Endpoints

### Cart Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/cart` | Get buyer's cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:productId` | Update quantity |
| DELETE | `/api/cart/:productId` | Remove item |
| PUT | `/api/cart/preferences/delivery` | Set delivery prefs |
| DELETE | `/api/cart` | Clear cart |

### Order Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/orders` | Create order from cart |
| GET | `/api/orders/buyer` | Get buyer's orders |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id/cancel` | Cancel order |
| PUT | `/api/orders/:id/rate` | Rate farmer/transporter |
| GET | `/api/orders/delivery-slots` | Get available slots |

---

## 🔐 Authentication & Authorization

### Cart Routes
- ✅ Requires authentication
- ✅ Requires 'buyer' role
- ❌ Farmers cannot access cart

### Order Routes
- Order creation: Buyer only
- Order viewing: Self + admin
- Status updates: Farmer + admin
- Delivery updates: Transporter + admin

---

## 💾 Database

### Models Relationships
```
Cart
├─ buyer (Reference to User)
├─ items[]
│  ├─ product (Reference to Product)
│  └─ farmer (Reference to User)
└─ deliveryPreferences
   └─ deliverySlot (Reference to DeliverySlot)

Order
├─ buyer (Reference to User)
├─ farmer (Reference to User)
├─ product (Reference to Product)
├─ deliveryAddress
│  └─ coordinates (lat, lng)
└─ ratings
   ├─ buyerRating
   ├─ farmerRating
   └─ transporterRating

DeliverySlot
├─ farmer (Reference to User, optional)
├─ coverage
│  ├─ district
│  └─ thana
└─ availableDays (array of day numbers)
```

---

## 🧪 Quick Testing

### Test Add to Cart
```javascript
// In browser console
const { addToCart } = useContext(CartContext);
await addToCart('product_id_from_db', 5);
```

### Test Cart Display
Navigate to `/cart` after adding items

### Test Checkout
1. Add items to cart
2. Navigate to `/checkout`
3. Select address and slot
4. Click "Place Order"

### Test Order Tracking
Navigate to `/orders` to see all orders

---

## 🔍 Debugging

### Check Cart in Console
```javascript
// Get cart context
const { cart } = useContext(CartContext);
console.log(cart);

// View cart items
console.log(cart.items);

// View totals
console.log(cart.cartSummary);
```

### Check Network Requests
1. Open DevTools → Network tab
2. Perform cart actions
3. Inspect request/response in Network tab

### Check Backend Logs
```bash
# Terminal shows all API requests and responses
# Look for errors or validation issues
```

---

## ⚙️ Configuration

### Platform Fee
- Hardcoded to 5% in cartController.js
- Can be modified in Cart.pre('save') hook
- Formula: `subtotal * 0.05`

### Delivery Fee
- Set per delivery slot in database
- Can be 0 for free delivery
- Applied at checkout if slot selected

### Available Payment Methods
- cash_on_delivery (COD)
- bkash
- nagad
- bank_transfer
- card

**Note**: Only COD is fully implemented. Others require payment gateway integration.

---

## 🔄 State Management

### CartContext Provides
```javascript
{
  cart: { items[], deliveryPreferences, cartSummary },
  loading: boolean,
  error: string | null,
  fetchCart: () => Promise,
  addToCart: (productId, qty) => Promise,
  updateCartItem: (productId, qty) => Promise,
  removeFromCart: (productId) => Promise,
  updateDeliveryPreferences: (prefs) => Promise,
  clearCart: () => Promise,
  getCartItemCount: () => number,
  getTotalQuantity: () => number
}
```

### Local Component State
- Quantity selections in ProductCard
- Modal visibility states
- Form inputs in Checkout
- Rating forms in MyOrders

---

## 📊 Data Flow

```
User browses products
       ↓
Clicks "Add to Cart" → ProductCard Modal
       ↓
CartContext.addToCart() → API POST /api/cart
       ↓
Backend validates & updates Cart model
       ↓
Response updates CartContext state
       ↓
UI re-renders with updated cart
       ↓
Cart persists in database
```

---

## 🚨 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Cart empty after refresh | Context not persisted | Fetch cart on component mount |
| Cannot add to cart | Not authenticated | Login first, check token |
| Orders not creating | Invalid delivery address | Select address/map location |
| Quantities not updating | API error | Check network tab, verify product exists |
| Ratings not visible | Wrong order status | Wait for order completion |

---

## 📚 Related Documentation

- **Full Integration Guide**: See `CART_ORDER_INTEGRATION.md`
- **Setup Checklist**: See `MODULE_2_SETUP_CHECKLIST.md`
- **API Testing**: See `backend/api-tests-cart-orders.http`

---

## 🚀 Next Steps

1. Review the code in each file
2. Add routes to App.jsx
3. Update Navbar with cart link
4. Test with real data
5. Integrate payment gateway (future)
6. Add Google Maps (future)

---

## 💡 Tips

- Use browser DevTools to inspect state
- Check network tab for API errors
- Test with different user roles
- Verify database operations
- Use the provided API testing guide

---

## ✅ Verification Checklist

- [ ] Cart API endpoints accessible
- [ ] Can add items to cart
- [ ] Quantities update correctly
- [ ] Price calculations work
- [ ] Cart clears after order
- [ ] Orders appear in history
- [ ] Status updates work
- [ ] Ratings can be submitted

---

**Ready to integrate? Follow the MODULE_2_SETUP_CHECKLIST.md file!**
