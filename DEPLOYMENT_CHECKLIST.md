# 🚀 Vercel Deployment Quick Checklist

## Before You Start
- [ ] Vercel account created
- [ ] GitHub repository pushed
- [ ] MongoDB Atlas cluster active
- [ ] Stripe account with test keys
- [ ] Google OAuth credentials ready

---

## Backend Deployment

### 1. Environment Variables (Vercel Dashboard)
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secure_secret
JWT_EXPIRE=30d
GOOGLE_CLIENT_ID=220479955054-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_REFRESH_URL=https://your-frontend.vercel.app/connect/refresh
STRIPE_CONNECT_RETURN_URL=https://your-frontend.vercel.app/connect/return
ADMIN_EMAIL=admin@krishak.com
ADMIN_PASSWORD=secure_password
```

### 2. Cloudinary Setup (for file uploads)
- [ ] Create Cloudinary account
- [ ] Get API credentials
- [ ] Add to Vercel:
  ```env
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  ```
- [ ] Install packages:
  ```bash
  npm install cloudinary multer-storage-cloudinary
  ```
- [ ] Update uploadMiddleware.js to use Cloudinary

### 3. Deploy
```bash
cd backend
vercel --prod
```
**Backend URL:** `https://krishak-backend.vercel.app`

---

## Frontend Deployment

### 1. Environment Variables (Vercel Dashboard)
```env
VITE_API_URL=https://your-backend.vercel.app/api
VITE_GOOGLE_CLIENT_ID=220479955054-...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Deploy
```bash
cd frontend
vercel --prod
```
**Frontend URL:** `https://krishak.vercel.app`

---

## External Services Configuration

### Google OAuth
1. Go to: https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Add **Authorized JavaScript Origins:**
   - `https://krishak.vercel.app`
4. Add **Authorized Redirect URIs:**
   - `https://krishak.vercel.app`
   - `https://krishak.vercel.app/callback`
5. **Wait 5-10 minutes** for propagation

### Stripe Webhook
1. Go to: https://dashboard.stripe.com/webhooks
2. **Add endpoint:** `https://krishak-backend.vercel.app/api/webhook/stripe`
3. **Select events:**
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - payment_intent.canceled
   - charge.refunded
   - transfer.*
   - account.updated
4. **Copy webhook secret** (whsec_...)
5. **Update** STRIPE_WEBHOOK_SECRET in Vercel
6. **Redeploy backend**

### MongoDB Atlas
1. Go to: https://cloud.mongodb.com
2. Network Access → Add IP Address
3. **Allow:** 0.0.0.0/0 (Vercel uses dynamic IPs)
4. **Confirm**

### Backend CORS
Ensure `backend/server.js` includes:
```javascript
origin: [
  'http://localhost:5173',
  'https://krishak.vercel.app'
]
```

---

## Testing

### Basic Tests
- [ ] Frontend loads
- [ ] Backend API responds: `https://backend-url.vercel.app/api/`
- [ ] Login with email/password
- [ ] Google Sign-In works
- [ ] Product listing works
- [ ] Photo upload works
- [ ] Test payment: 4242 4242 4242 4242
- [ ] Order placed successfully
- [ ] Notifications received
- [ ] Webhook events in Stripe Dashboard

### Debug Commands
```bash
# View backend logs
vercel logs backend-url --follow

# View frontend logs
vercel logs frontend-url --follow

# Test webhook locally
stripe listen --forward-to https://backend-url.vercel.app/api/webhook/stripe
```

---

## Production Ready

### Before Going Live
- [ ] Change JWT_SECRET to strong random string
- [ ] Change ADMIN_PASSWORD
- [ ] Switch to Stripe **live mode** keys
- [ ] Create live webhook in Stripe
- [ ] Test with real payment (small amount)
- [ ] Set up custom domain (optional)
- [ ] Enable monitoring/error tracking
- [ ] Document admin credentials securely

---

## Quick Reference URLs

**Development:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

**Production:**
- Frontend: https://your-frontend.vercel.app
- Backend: https://your-backend.vercel.app
- Stripe Dashboard: https://dashboard.stripe.com
- Google Console: https://console.cloud.google.com
- MongoDB Atlas: https://cloud.mongodb.com
- Cloudinary: https://cloudinary.com/console

---

## Common Issues

| Issue | Solution |
|-------|----------|
| CORS error | Add frontend URL to backend CORS origins |
| Google OAuth fails | Check authorized origins, wait 10 min |
| Webhook not working | Verify endpoint URL, check signing secret |
| Images not showing | Configure Cloudinary, check credentials |
| MongoDB connection fails | Allow 0.0.0.0/0 in network access |
| Env vars not working | Redeploy after adding variables |

---

## Emergency Rollback

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [previous-deployment-url]

# Or re-run
vercel --prod
```

---

**✅ All Done? Your KRISHAK platform is live! 🌾**
