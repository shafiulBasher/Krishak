# ⚡ Quick Integration Steps (5 Minutes)

## 1. Update App.jsx (2 min)

Add this at the top:
```jsx
import { CartProvider } from './context/CartContext';
import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import MyOrders from './pages/buyer/MyOrders';
```

Wrap your app:
```jsx
function App() {
  return (
    <CartProvider>  {/* ADD THIS LINE */}
      <BrowserRouter>
        {/* Your existing app */}
      </BrowserRouter>
    </CartProvider>  {/* ADD THIS LINE */}
  );
}
```

Add routes:
```jsx
<Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
<Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
<Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
```

---

## 2. Update Navbar.jsx (1 min)

Add import:
```jsx
import { CartContext } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
```

Add to navbar:
```jsx
const { getCartItemCount } = useContext(CartContext);
const itemCount = getCartItemCount();

{/* Add this link in navbar */}
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

## 3. Update Product Listing Page (1 min)

Replace product display with ProductCard:
```jsx
import ProductCard from '../components/ProductCard';

{/* In your product grid */}
{products.map(product => (
  <ProductCard key={product._id} product={product} />
))}
```

---

## 4. Verify Backend Routes (1 min)

Check `server.js` has these lines:
```javascript
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
```

✅ Already added in server.js!

---

## ✅ Done! Test It

1. Open app at http://localhost:5173
2. Login as buyer
3. Browse products
4. Click "Add to Cart"
5. View cart at /cart
6. Go to checkout at /checkout
7. Place order
8. View orders at /orders

---

## 📞 Need Help?

1. Check: `QUICK_START_CART_ORDERS.md`
2. Read: `CART_ORDER_INTEGRATION.md`
3. Test: `backend/api-tests-cart-orders.http`
4. Verify: `MODULE_2_SETUP_CHECKLIST.md`

---

**That's it! 🎉 Your cart and order system is ready!**
