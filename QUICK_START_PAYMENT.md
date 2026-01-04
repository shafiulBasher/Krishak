# 🚀 Quick Start Guide - Stripe Payment Integration

## Prerequisites
- ✅ Stripe packages installed (already done)
- ✅ Backend and frontend code implemented (already done)
- ⚠️ Need Stripe API keys (follow steps below)

---

## Step 1: Get Stripe Test API Keys (5 minutes)

### 1.1 Create Stripe Account
1. Go to https://stripe.com
2. Click "Sign up" and create account
3. Verify your email

### 1.2 Get Test Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

### 1.3 Add Keys to .env Files

**Backend** (`d:\KRISHAK\backend\.env`):
```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

**Frontend** (`d:\KRISHAK\frontend\.env`):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

---

## Step 2: Setup Webhook (5 minutes)

### 2.1 Option A: Use Stripe CLI (Recommended for Development)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Run in a terminal:
```bash
stripe listen --forward-to localhost:5000/api/webhook/stripe
```
4. Copy the webhook secret (starts with `whsec_`)
5. Add to `backend\.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### 2.2 Option B: Create Webhook in Dashboard

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `http://localhost:5000/api/webhook/stripe`
4. Select events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.refunded
   - transfer.created
5. Click "Add endpoint"
6. Copy "Signing secret"
7. Add to `backend\.env`

---

## Step 3: Get OpenRouteService Key (2 minutes)

1. Go to https://openrouteservice.org/dev/#/signup
2. Sign up (free)
3. Go to https://openrouteservice.org/dev/#/home
4. Copy your API key
5. Add to `backend\.env`:
```env
ORS_API_KEY=YOUR_ORS_KEY_HERE
```

---

## Step 4: Start Servers

```bash
# Terminal 1: Backend
cd d:\KRISHAK\backend
npm start

# Terminal 2: Frontend
cd d:\KRISHAK\frontend
npm run dev

# Terminal 3 (if using Stripe CLI): Webhook
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

---

## Step 5: Test Payment Flow

### 5.1 Setup Stripe Connect (Farmer)
1. Open http://localhost:5173
2. Login as farmer
3. Go to Profile → Earnings or `/farmer/connect`
4. Click "Start Onboarding"
5. Complete Stripe onboarding (use test data)
6. Return to marketplace

### 5.2 Make Test Payment (Buyer)
1. Login as buyer
2. Browse products
3. Add product to cart
4. Go to checkout
5. Place order
6. You should see vehicle selection
7. Select vehicle (Van/Pickup/Truck)
8. See delivery fee calculation
9. Enter test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/28`
   - CVC: `123`
   - ZIP: `12345`
10. Click "Pay"
11. Payment should succeed!

### 5.3 Verify
- Order status should be "PAID"
- Check Stripe dashboard: https://dashboard.stripe.com/test/payments
- Payment should appear

---

## 🎯 Test Card Numbers

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 0002` | Generic decline |

For all cards:
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## 📋 Verification Checklist

Before testing:
- [ ] Stripe secret key added to backend .env
- [ ] Stripe publishable key added to both .env files
- [ ] Webhook secret added (from CLI or dashboard)
- [ ] OpenRouteService API key added
- [ ] Backend server restarted
- [ ] Frontend dev server restarted
- [ ] No console errors in browser
- [ ] Backend logs show "💳 Payment system is ACTIVE"

---

## 🐛 Common Issues

### "Stripe key not found"
- Check .env files have keys
- Restart servers after adding keys
- Check key starts with `pk_test_` (frontend) or `sk_test_` (backend)

### "Webhook signature verification failed"
- Use Stripe CLI for local development
- Or create webhook in Stripe dashboard
- Make sure webhook secret is correct

### "Distance calculation failed"
- Check ORS_API_KEY is valid
- Check internet connection
- System will fall back to straight-line distance

### Payment doesn't complete
- Check browser console for errors
- Check backend terminal for logs
- Verify card number is `4242 4242 4242 4242`

---

## 📚 Next Steps

After successful testing:
1. Review `PAYMENT_IMPLEMENTATION_SUMMARY.md` for complete details
2. Read `STRIPE_SETUP_GUIDE.md` for production setup
3. Test full flow: Order → Pay → Deliver → Transfer
4. Customize vehicle rates if needed
5. Consider production payment gateway for Bangladesh

---

## 🎉 You're Ready!

Once you have your API keys:
1. Add them to .env files (both backend and frontend)
2. Restart servers
3. Test a payment
4. Everything should work!

**Need help?** Check the error messages in:
- Browser console (F12)
- Backend terminal logs
- Stripe dashboard logs
