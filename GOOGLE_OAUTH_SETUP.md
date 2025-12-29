# Google OAuth Setup Guide

## Getting Your Google Client ID

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project (if needed):**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter "Krishak" as the project name
   - Click "Create"

3. **Enable Google+ API:**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click on it and click "Enable"

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" user type
     - Fill in app name: "Krishak"
     - Add your email as developer contact
     - Save and continue through the steps

5. **Configure OAuth Client ID:**
   - Application type: "Web application"
   - Name: "Krishak Web Client"
   - Authorized JavaScript origins:
     - http://localhost:5173
     - http://localhost:5000
   - Authorized redirect URIs:
     - http://localhost:5173
     - http://localhost:5173/login
     - http://localhost:5173/register
   - Click "Create"

6. **Copy Your Client ID:**
   - You'll see a popup with your Client ID
   - Copy the Client ID (looks like: xxxxx-xxxxx.apps.googleusercontent.com)

7. **Add to .env Files:**
   
   **Frontend (.env):**
   - Open `frontend/.env`
   - Replace `your-google-client-id-here.apps.googleusercontent.com` with your actual Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   ```

   **Backend (.env):**
   - Open `backend/.env`
   - Replace `your_google_client_id_here` with your actual Client ID:
   ```
   GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   ```
   ⚠️ **Important:** The backend needs the same Client ID to verify Google tokens!

8. **Restart Both Development Servers:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   node server.js

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

## Testing Google Sign-In

1. Go to http://localhost:5173/login or http://localhost:5173/register
2. Click on the "Sign in with Google" button
3. Select your Google account
4. Grant permissions
5. You'll be redirected to complete your profile (phone number and role selection)
6. After completing the profile, you'll be redirected to your dashboard

## Important Notes

- **Development Mode:** The setup above is for development. For production, add your production domain to the authorized origins.
- **HTTPS Required for Production:** Google OAuth requires HTTPS in production environments.
- **User Consent Screen:** In development, you may see a warning that "This app isn't verified". This is normal for testing.

## Troubleshooting

**"redirect_uri_mismatch" error:**
- Make sure your redirect URIs in Google Console exactly match your application URL
- Check that you've added both the base URL and the full redirect paths

**"Invalid Client ID" error:**
- Verify you've copied the correct Client ID from Google Console
- Check that there are no extra spaces in your .env file
- Restart the dev server after changing .env

**Button not appearing:**
- Check browser console for errors
- Ensure you've installed @react-oauth/google package
- Verify the VITE_GOOGLE_CLIENT_ID is set correctly in .env
