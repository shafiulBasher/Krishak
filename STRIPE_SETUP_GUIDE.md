# Stripe Payment Integration - Environment Variables Setup

## Backend Environment Variables (.env)

Add these variables to `backend/.env`:

```env
# Stripe API Keys
# Get these from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret
# Get this from: https://dashboard.stripe.com/test/webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Connect URLs
STRIPE_CONNECT_REFRESH_URL=http://localhost:5173/connect/refresh
STRIPE_CONNECT_RETURN_URL=http://localhost:5173/connect/return

# Currency Exchange Rate (USD to BDT)
# Update this periodically or integrate with a currency API
USD_TO_BDT_RATE=110

# OpenRouteService API (Free tier: 2000 requests/day)
# Sign up at: https://openrouteservice.org/dev/#/signup
ORS_API_KEY=your_openrouteservice_api_key_here
```

## Frontend Environment Variables (.env)

Add these variables to `frontend/.env`:

```env
# Stripe Publishable Key (same as backend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# API Base URL
VITE_API_BASE_URL=http://localhost:5000
```

---

## Getting Your Stripe Keys

### 1. Create Stripe Account
1. Go to https://stripe.com
2. Click "Sign up" and create an account
3. Complete email verification

### 2. Get Test API Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`) - Use in frontend
   - **Secret key** (starts with `sk_test_`) - Use in backend
3. Click "Reveal test key" to see your secret key
4. Copy both keys to your .env files

### 3. Setup Webhook
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. Enter endpoint URL: `http://localhost:5000/api/webhook/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `transfer.created`
   - `transfer.updated`
   - `transfer.failed`
   - `account.updated`
5. Click "Add endpoint"
6. Click on your new endpoint and reveal the "Signing secret" (starts with `whsec_`)
7. Copy this secret to `STRIPE_WEBHOOK_SECRET` in backend .env

### 4. Get OpenRouteService API Key
1. Go to https://openrouteservice.org/dev/#/signup
2. Sign up for free account
3. Go to https://openrouteservice.org/dev/#/home
4. Copy your API key
5. Add to `ORS_API_KEY` in backend .env

---

## Testing with Stripe Test Cards

Use these test card numbers:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 0002` | Declined (generic decline) |

**For all test cards:**
- Use any future expiration date (e.g., 12/28)
- Use any 3-digit CVC (e.g., 123)
- Use any 5-digit ZIP code (e.g., 12345)

---

## Webhook Testing (Local Development)

Since Stripe webhooks need a public URL, use **Stripe CLI** for local testing:

### Install Stripe CLI
1. Download from: https://stripe.com/docs/stripe-cli
2. Install and login: `stripe login`

### Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

This will give you a webhook secret (starts with `whsec_`) - use this for local development.

---

## Important Notes

### Bangladesh Stripe Support
⚠️ **Stripe doesn't officially operate in Bangladesh**

For development/testing:
- Use **Test Mode** with test API keys
- Everything works except real money transfers

For production:
- Consider using a business registered in a Stripe-supported country
- Alternative: Use **SSL Commerz** (popular in Bangladesh)
- Alternative: Use **bKash/Nagad** APIs (requires Bangladesh business)

### Currency Handling
- Stripe doesn't support BDT (Bangladeshi Taka)
- We use USD for Stripe and convert to BDT for display
- Exchange rate set in `USD_TO_BDT_RATE` environment variable
- Update rate periodically or integrate with currency API

### Security
- Never commit .env files to version control
- Keep secret keys secure
- Use test keys for development
- Use live keys only in production with proper security

---

## Verification Checklist

Before testing payments:

- [ ] Backend .env has all Stripe variables
- [ ] Frontend .env has VITE_STRIPE_PUBLISHABLE_KEY
- [ ] Stripe webhook endpoint created
- [ ] OpenRouteService API key obtained
- [ ] Backend server restarted after adding env variables
- [ ] Frontend dev server restarted after adding env variables
- [ ] Test webhook with Stripe CLI (optional but recommended)

---

## Need Help?

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- OpenRouteService Docs: https://openrouteservice.org/dev/#/api-docs
- Contact support if you encounter issues
