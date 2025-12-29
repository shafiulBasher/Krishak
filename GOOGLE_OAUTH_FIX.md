# Google OAuth Configuration Fix

## Error: "The given origin is not allowed for the given client ID"

This error occurs when your frontend origin (`http://localhost:5173`) is not authorized in Google Cloud Console.

## Quick Fix Steps

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select your project (or create a new one)

### 2. Navigate to OAuth 2.0 Client IDs
- Go to **APIs & Services** → **Credentials**
- Find your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
- Click on it to edit

### 3. Add Authorized Origins
In the **Authorized JavaScript origins** section, add:
```
http://localhost:5173
http://localhost:3000
http://localhost:5174
```

### 4. Add Authorized Redirect URIs
In the **Authorized redirect URIs** section, add:
```
http://localhost:5173
http://localhost:3000
http://localhost:5174
```

### 5. Save Changes
- Click **Save**
- Wait 1-2 minutes for changes to propagate

### 6. Restart Your Frontend
- Stop your frontend server
- Restart it: `npm run dev`
- Hard refresh browser (Ctrl+Shift+R)

## Current Configuration

Your Google Client ID: `220479955054-3qlvp5opr1i2pbaj509b83tb5e9d8vpr.apps.googleusercontent.com`

Make sure this Client ID has `http://localhost:5173` in its authorized origins.

## Alternative: Disable Google OAuth

If you don't want to use Google OAuth, you can:
1. Remove or comment out `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`
2. The app will automatically hide Google Sign-In buttons
3. Users can still login/register with email/password

## Testing

After configuration:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Try Google Sign-In again
4. Check browser console for any remaining errors

