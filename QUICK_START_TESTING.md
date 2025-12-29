# 🚀 Quick Start - Testing Google Sign-In

## ⚡ Immediate Testing (Without Google Credentials)

You can test the UI and flow without setting up Google OAuth first:

1. **Start Both Servers:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

2. **View the Changes:**
   - Go to http://localhost:5173/login
   - You'll see the Google Sign-In button (will show an error if clicked without credentials)
   - Go to http://localhost:5173/register
   - You'll see the Google Sign-Up button

3. **Test Profile Completion Page:**
   - The page is at `/complete-profile`
   - It's protected, so you need to be logged in first
   - You can log in with a regular account to see the page design

---

## ✅ Full Testing (With Google Credentials)

To actually test Google Sign-In functionality:

### Step 1: Get Google Client ID (5 minutes)

1. Visit: https://console.cloud.google.com/
2. Create a new project or select existing
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure consent screen if needed
6. Choose "Web application"
7. Add authorized JavaScript origins:
   - `http://localhost:5173`
8. Add authorized redirect URIs:
   - `http://localhost:5173`
9. Copy the Client ID

### Step 2: Add Client ID to Project

1. Open `frontend/.env`
2. Replace the placeholder:
   ```env
   VITE_GOOGLE_CLIENT_ID=YOUR-ACTUAL-CLIENT-ID.apps.googleusercontent.com
   ```
3. **Important:** Restart the frontend server:
   ```bash
   # Press Ctrl+C in frontend terminal
   npm run dev
   ```

### Step 3: Test the Feature

1. **Test New User Registration:**
   - Go to http://localhost:5173/register
   - Click "Sign up with Google"
   - Select your Google account
   - You should be redirected to "Complete Profile" page
   - Fill in:
     - Phone: 01712345678 (example)
     - Role: Select any role
     - Fill role-specific fields if shown
   - Click "Complete Profile"
   - You should see your dashboard

2. **Test Existing User Login:**
   - Log out (click Logout button)
   - Go to http://localhost:5173/login
   - Click "Sign in with Google"
   - Select the same Google account
   - You should go directly to dashboard (no profile completion needed)

3. **Test Phone Validation:**
   - Create a new Google account
   - Try entering invalid phone: 1234567890
   - Should show error
   - Try correct format: 01712345678
   - Should work

---

## 🎯 What You Should See

### Before Google Setup:
- ✅ Login page has Google Sign-In button (grayed out/will error)
- ✅ Register page has Google Sign-Up button (grayed out/will error)
- ✅ UI looks good and professional

### After Google Setup:
- ✅ Clicking Google button shows Google account selector
- ✅ After selection, redirects to Complete Profile page
- ✅ Complete Profile page has phone input and role selection
- ✅ After submitting, redirects to dashboard
- ✅ User data is saved in database
- ✅ Can log out and log back in with Google

---

## 🐛 Quick Troubleshooting

### "Google Sign-In button doesn't work"
- Check if `VITE_GOOGLE_CLIENT_ID` is set in `frontend/.env`
- Make sure you restarted the frontend server after adding it
- Check browser console for errors

### "redirect_uri_mismatch" error
- Go back to Google Console
- Make sure `http://localhost:5173` is in authorized origins
- Make sure `http://localhost:5173` is in authorized redirect URIs

### "Invalid Client ID" error
- Double-check you copied the correct Client ID
- Make sure there are no extra spaces in `.env`
- Client ID should end with `.apps.googleusercontent.com`

### "Profile completion page not showing"
- Check if you're logged in (token in localStorage)
- Check browser console for errors
- Try hard refresh (Ctrl+F5)

### Backend errors
- Make sure MongoDB is running
- Check `backend/server.js` console for errors
- Verify backend is running on port 5000

---

## 📋 Quick Test Checklist

- [ ] Both servers running (backend:5000, frontend:5173)
- [ ] Google Client ID added to `.env`
- [ ] Frontend server restarted after adding Client ID
- [ ] Can see Google buttons on login/register pages
- [ ] Google button actually opens Google account selector
- [ ] After Google auth, redirected to complete profile
- [ ] Can submit phone and role successfully
- [ ] Redirected to dashboard after profile completion
- [ ] Can log out and log back in with Google
- [ ] User data persists in database

---

## 💾 Database Check

To verify user was created correctly:

```bash
cd backend
node viewDatabase.js
```

Look for:
- User with Google email
- `googleId` field populated
- `phone` and `role` filled after profile completion
- `isVerified` should be `true`
- `password` should be missing/undefined

---

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ Google sign-in popup appears
2. ✅ You're redirected to complete profile page
3. ✅ Profile form validates correctly
4. ✅ You land on dashboard with correct role
5. ✅ Navbar shows your name from Google
6. ✅ You can log out and log back in
7. ✅ No console errors

---

## 📞 Need Help?

1. Read `GOOGLE_OAUTH_SETUP.md` for detailed setup
2. Read `IMPLEMENTATION_SUMMARY.md` for technical details
3. Check browser console for errors
4. Check backend terminal for errors
5. Try clearing browser cache and localStorage

---

**Quick Tip:** If you just want to see the UI without Google OAuth working, you can still browse the login/register pages and see the Google buttons. They look professional and are properly styled!
