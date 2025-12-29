# 🚀 Deployment Guide - Krishak Project

## Quick Setup for Online Server

### Step 1: Deploy Backend

Choose one of these platforms:

#### Option A: Render (Recommended - Free Tier Available)
1. Go to https://render.com
2. Create a new account or sign in
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: krishak-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (or set to `backend` if deploying only backend)
6. Add Environment Variables:
   - `MONGO_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - A strong random string
   - `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `NODE_ENV` - Set to `production`
   - `PORT` - Render will set this automatically
7. Click "Create Web Service"
8. Wait for deployment and copy your backend URL (e.g., `https://krishak-backend.onrender.com`)

#### Option B: Railway
1. Go to https://railway.app
2. Create a new project
3. Add a new service → "GitHub Repo"
4. Select your repository
5. Railway will auto-detect Node.js
6. Set Root Directory to `backend`
7. Add Environment Variables (same as Render)
8. Deploy and get your URL

#### Option C: Heroku
1. Install Heroku CLI
2. Run:
   ```bash
   cd backend
   heroku create krishak-backend
   heroku config:set MONGO_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-secret
   heroku config:set NODE_ENV=production
   git push heroku main
   ```

### Step 2: Update Frontend Configuration

1. Open `frontend/.env`
2. Replace `VITE_API_URL` with your deployed backend URL:
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

### Step 3: Deploy Frontend

#### Option A: Vercel (Recommended for React)
1. Go to https://vercel.com
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_URL` - Your backend URL (e.g., `https://krishak-backend.onrender.com/api`)
   - `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
5. Deploy

#### Option B: Netlify
1. Go to https://netlify.com
2. Import your repository
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add Environment Variables (same as Vercel)
5. Deploy

### Step 4: Update Google OAuth Settings

1. Go to https://console.cloud.google.com
2. Navigate to your OAuth 2.0 Client ID
3. Update **Authorized JavaScript origins**:
   - Add your frontend URL (e.g., `https://your-app.vercel.app`)
4. Update **Authorized redirect URIs**:
   - Add `https://your-app.vercel.app`
   - Add `https://your-app.vercel.app/login`
   - Add `https://your-app.vercel.app/register`

### Step 5: Update Backend CORS

The backend should already allow all origins. If you need to restrict it, update `backend/server.js`:

```javascript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

## Environment Variables Summary

### Backend (.env)
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/krishak
JWT_SECRET=your-strong-secret-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NODE_ENV=production
PORT=5000
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Testing After Deployment

1. Visit your frontend URL
2. Test registration/login
3. Check browser console for any CORS errors
4. Verify API calls are going to your backend URL

## Troubleshooting

### CORS Errors
- Make sure backend CORS allows your frontend domain
- Check that `VITE_API_URL` in frontend matches your backend URL

### MongoDB Connection Issues
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas IP whitelist (allow all IPs: `0.0.0.0/0`)

### Google OAuth Not Working
- Verify frontend URL is in Google Console authorized origins
- Check that `VITE_GOOGLE_CLIENT_ID` matches in both frontend and backend

