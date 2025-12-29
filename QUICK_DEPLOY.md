# 🚀 Quick Deploy Guide - Krishak to Online Server

## Deploy Backend to Render (Free Tier)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. **Go to Render**: https://render.com
2. **Sign up/Login** (free account)
3. **Click "New +" → "Web Service"**
4. **Connect GitHub** and select your repository: `shafiulBasher/Krishak`
5. **Configure the service**:
   - **Name**: `krishak-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or choose paid if needed)

6. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   MONGO_URI=mongodb+srv://krishak_user:bJzan6OXMbcbWQeR@krishak-cluster.fxbz06y.mongodb.net/krishak?retryWrites=true&w=majority&appName=Krishak-Cluster
   JWT_SECRET=krishak_secret_key_2025_change_in_production
   GOOGLE_CLIENT_ID=220479955054-3qlvp5opr1i2pbaj509b83tb5e9d8vpr.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   NODE_ENV=production
   ADMIN_EMAIL=admin@krishak.com
   ADMIN_PASSWORD=admin123
   ADMIN_NAME=System Admin
   ADMIN_PHONE=01700000000
   ```

7. **Click "Create Web Service"**
8. **Wait for deployment** (takes 2-5 minutes)
9. **Copy your backend URL** (e.g., `https://krishak-backend.onrender.com`)

### Step 3: Update Frontend Configuration

1. Open `frontend/.env`
2. Replace the URL with your Render backend URL:
   ```env
   VITE_API_URL=https://krishak-backend.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=220479955054-3qlvp5opr1i2pbaj509b83tb5e9d8vpr.apps.googleusercontent.com
   ```

### Step 4: Deploy Frontend to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Import your GitHub repository**
3. **Configure**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables**:
   ```
   VITE_API_URL=https://krishak-backend.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=220479955054-3qlvp5opr1i2pbaj509b83tb5e9d8vpr.apps.googleusercontent.com
   ```

5. **Deploy**

### Step 5: Update Google OAuth Settings

1. Go to https://console.cloud.google.com
2. Navigate to your OAuth 2.0 Client ID
3. Update **Authorized JavaScript origins**:
   - Add: `https://your-frontend-app.vercel.app`
   - Add: `http://localhost:5173` (for local dev)
4. Update **Authorized redirect URIs**:
   - Add: `https://your-frontend-app.vercel.app`
   - Add: `https://your-frontend-app.vercel.app/login`
   - Add: `https://your-frontend-app.vercel.app/register`

## Alternative: Deploy to Railway

1. Go to https://railway.app
2. Create new project → "Deploy from GitHub repo"
3. Select your repository
4. Add new service → Select `backend` folder
5. Add environment variables (same as Render)
6. Deploy

## Your Backend URL Format

After deployment, your backend will be at:
- **Render**: `https://krishak-backend.onrender.com`
- **Railway**: `https://your-app.railway.app`

Update `frontend/.env` with your actual backend URL!

## Testing

1. Visit your deployed frontend URL
2. Test registration/login
3. Check browser console for errors
4. Verify API calls work

