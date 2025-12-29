# Directory Structure - Module 2 Implementation

```
krishak-main/
│
├── 📄 README_MODULE_2.md                   ⭐ START HERE
├── 📄 QUICK_INTEGRATION_5MIN.md            ⚡ Quick Setup
├── 📄 QUICK_START_CART_ORDERS.md           📚 Quick Reference
├── 📄 CART_ORDER_INTEGRATION.md            📖 Full Guide
├── 📄 MODULE_2_SETUP_CHECKLIST.md          ✓ Verification
├── 📄 MODULE_2_IMPLEMENTATION_COMPLETE.md  ✅ Summary
├── 📄 MODULE_2_FILE_STRUCTURE.md           🗺️ Architecture
│
├── backend/
│   ├── 📄 server.js                        ✏️ MODIFIED (routes added)
│   ├── 📄 api-tests-cart-orders.http       🧪 API Testing
│   │
│   ├── models/
│   │   ├── 📄 Cart.js                      ✨ NEW
│   │   ├── 📄 DeliverySlot.js              ✨ NEW
│   │   ├── 📄 Order.js                     (existing, compatible)
│   │   ├── 📄 Product.js                   (existing)
│   │   ├── 📄 User.js                      (existing)
│   │   └── 📄 TransporterAssignment.js    (existing)
│   │
│   ├── controllers/
│   │   ├── 📄 cartController.js            ✨ NEW
│   │   ├── 📄 orderController.js           ✏️ REWRITTEN (9 functions)
│   │   ├── 📄 productController.js         (existing)
│   │   ├── 📄 authController.js            (existing)
│   │   ├── 📄 userController.js            (existing)
│   │   └── 📄 adminController.js           (existing)
│   │
│   ├── routes/
│   │   ├── 📄 cartRoutes.js                ✨ NEW
│   │   ├── 📄 orderRoutes.js               ✨ NEW
│   │   ├── 📄 authRoutes.js                (existing)
│   │   ├── 📄 productRoutes.js             (existing)
│   │   ├── 📄 userRoutes.js                (existing)
│   │   └── 📄 adminRoutes.js               (existing)
│   │
│   ├── middleware/
│   │   ├── 📄 authMiddleware.js            (existing)
│   │   └── 📄 uploadMiddleware.js          (existing)
│   │
│   ├── utils/
│   │   ├── 📄 jwt.js                       (existing)
│   │   └── 📄 passwordUtils.js             (existing)
│   │
│   ├── config/
│   │   └── 📄 db.js                        (existing)
│   │
│   ├── 📄 package.json                     (existing, no changes)
│   └── 📄 .env                             (setup needed)
│
│
├── frontend/
│   ├── 📄 package.json                     (existing)
│   ├── 📄 vite.config.js                   (existing)
│   ├── 📄 tailwind.config.js               (existing)
│   ├── 📄 eslint.config.js                 (existing)
│   │
│   ├── index.html                          (existing)
│   │
│   └── src/
│       ├── 📄 main.jsx                     (existing)
│       ├── 📄 App.jsx                      ✏️ TO UPDATE (add CartProvider & routes)
│       ├── 📄 index.css                    (existing)
│       ├── 📄 App.css                      (existing)
│       │
│       ├── context/
│       │   ├── 📄 CartContext.jsx          ✨ NEW (global cart state)
│       │   └── 📄 AuthContext.jsx          (existing)
│       │
│       ├── components/
│       │   ├── 📄 ProductCard.jsx          ✨ NEW (add to cart modal)
│       │   ├── 📄 Button.jsx               (existing)
│       │   ├── 📄 Card.jsx                 (existing)
│       │   ├── 📄 Input.jsx                (existing)
│       │   ├── 📄 Select.jsx               (existing)
│       │   ├── 📄 Loading.jsx              (existing)
│       │   ├── 📄 Navbar.jsx               ✏️ TO UPDATE (add cart link)
│       │   ├── 📄 ProtectedRoute.jsx       (existing)
│       │   └── admin/
│       │       ├── 📄 StatsCard.jsx        (existing)
│       │       └── 📄 UserBadge.jsx        (existing)
│       │
│       ├── pages/
│       │   ├── 📄 Home.jsx                 (existing)
│       │   ├── 📄 Login.jsx                (existing)
│       │   ├── 📄 Register.jsx             (existing)
│       │   ├── 📄 Profile.jsx              (existing)
│       │   ├── 📄 CompleteProfile.jsx      (existing)
│       │   ├── 📄 Dashboard.jsx            (existing)
│       │   │
│       │   ├── admin/
│       │   │   ├── 📄 AdminDashboard.jsx   (existing)
│       │   │   ├── 📄 UserManagement.jsx   (existing)
│       │   │   └── 📄 ListingModeration.jsx(existing)
│       │   │
│       │   ├── buyer/
│       │   │   ├── 📄 Cart.jsx             ✨ NEW (shopping cart)
│       │   │   ├── 📄 Checkout.jsx         ✨ NEW (checkout flow)
│       │   │   ├── 📄 MyOrders.jsx         ✨ NEW (order history)
│       │   │   └── 📄 DeliveryAddresses.jsx(existing)
│       │   │
│       │   └── farmer/
│       │       ├── 📄 CreateListing.jsx    (existing)
│       │       ├── 📄 EditListing.jsx      (existing)
│       │       └── 📄 MyListings.jsx       (existing)
│       │
│       ├── services/
│       │   ├── 📄 api.js                   (existing)
│       │   ├── 📄 authService.js           (existing)
│       │   ├── 📄 userService.js           (existing)
│       │   ├── 📄 productService.js        (existing)
│       │   └── 📄 adminService.js          (existing)
│       │
│       └── assets/
│           └── (existing)
│
│
└── 📄 IMPLEMENTATION_SUMMARY.md            (existing)
```

---

## 📊 Summary by Category

### 📄 New Backend Files: 4
- models/Cart.js
- models/DeliverySlot.js
- controllers/cartController.js
- routes/cartRoutes.js
- routes/orderRoutes.js

### ✏️ Modified Backend Files: 2
- controllers/orderController.js (completely rewritten)
- server.js (2 lines added)

### 📄 New Frontend Files: 4
- context/CartContext.jsx
- pages/buyer/Cart.jsx
- pages/buyer/Checkout.jsx
- pages/buyer/MyOrders.jsx
- components/ProductCard.jsx

### ✏️ Modified Frontend Files: 1
- App.jsx (TO UPDATE: add CartProvider & 3 routes)
- Navbar.jsx (TO UPDATE: add cart link)

### 📄 New Documentation Files: 8
- README_MODULE_2.md
- QUICK_INTEGRATION_5MIN.md
- QUICK_START_CART_ORDERS.md
- CART_ORDER_INTEGRATION.md
- MODULE_2_SETUP_CHECKLIST.md
- MODULE_2_IMPLEMENTATION_COMPLETE.md
- MODULE_2_FILE_STRUCTURE.md
- api-tests-cart-orders.http

---

## 🎯 Files You Need to Update

### 1. frontend/src/App.jsx
```jsx
// Add these imports
import { CartProvider } from './context/CartContext';
import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import MyOrders from './pages/buyer/MyOrders';

// Wrap app with CartProvider
<CartProvider>
  <BrowserRouter>
    {/* ... routes ... */}
  </BrowserRouter>
</CartProvider>

// Add these routes
<Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
<Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
<Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
```

### 2. frontend/src/components/Navbar.jsx
```jsx
// Add import
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

// Inside component
const { getCartItemCount } = useContext(CartContext);
const itemCount = getCartItemCount();

// Add link
<Link to="/cart" className="relative">
  <ShoppingCart size={20} />
  {itemCount > 0 && (
    <span className="badge">{itemCount}</span>
  )}
</Link>
<Link to="/orders">My Orders</Link>
```

---

## ✅ Integration Status

| File | Status | Action |
|------|--------|--------|
| models/Cart.js | ✅ Complete | No action needed |
| models/DeliverySlot.js | ✅ Complete | No action needed |
| controllers/cartController.js | ✅ Complete | No action needed |
| controllers/orderController.js | ✅ Complete | No action needed |
| routes/cartRoutes.js | ✅ Complete | No action needed |
| routes/orderRoutes.js | ✅ Complete | No action needed |
| server.js | ✅ Complete | No action needed |
| context/CartContext.jsx | ✅ Complete | No action needed |
| pages/buyer/Cart.jsx | ✅ Complete | No action needed |
| pages/buyer/Checkout.jsx | ✅ Complete | No action needed |
| pages/buyer/MyOrders.jsx | ✅ Complete | No action needed |
| components/ProductCard.jsx | ✅ Complete | No action needed |
| **App.jsx** | ⏳ Ready | **UPDATE NEEDED** |
| **Navbar.jsx** | ⏳ Ready | **UPDATE NEEDED** |

---

## 🚀 Quick Checklist

- [ ] Review README_MODULE_2.md
- [ ] Read QUICK_INTEGRATION_5MIN.md
- [ ] Update App.jsx (CartProvider + 3 routes)
- [ ] Update Navbar.jsx (cart icon + link)
- [ ] Test cart functionality
- [ ] Test checkout flow
- [ ] Test order creation
- [ ] Test order tracking
- [ ] Deploy to production

---

## 📞 Documentation Map

```
START → README_MODULE_2.md
   ↓
   ├→ QUICK_INTEGRATION_5MIN.md (if in hurry)
   ├→ QUICK_START_CART_ORDERS.md (quick reference)
   ├→ CART_ORDER_INTEGRATION.md (full guide)
   ├→ MODULE_2_SETUP_CHECKLIST.md (verification)
   ├→ MODULE_2_FILE_STRUCTURE.md (architecture)
   └→ api-tests-cart-orders.http (API testing)
```

---

**That's the complete file structure! Ready to integrate? Start with README_MODULE_2.md!**
