# Firebase Phone Authentication Setup Guide

## Quick Fix - Enable Phone Authentication

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `saathi-health-insurance`
3. **Navigate to Authentication**:
   - Click on "Build" > "Authentication" in left sidebar
4. **Click on "Sign-in method" tab**
5. **Look for "Phone"** in the providers list
6. **If it's disabled (greyed out):**
   - Click on it
   - Click the "Enable" toggle
   - Click "Save"
7. **Make sure reCAPTCHA v2 is configured:**
   - In the same Authentication section, look for "reCAPTCHA Enterprise" or "reCAPTCHA v2"
   - Enable it if not already enabled

## Verify reCAPTCHA Setup

1. In Firebase console, go to **Authentication > Settings**
2. Look for **reCAPTCHA** section
3. Make sure you have a reCAPTCHA site key configured
4. The site key should match your domain (saathi-health-insurance.web.app)

## Test the Setup

1. Visit: https://saathi-health-insurance.web.app
2. Enter phone: `9028493353` (or your real phone)
3. **Open DevTools** (F12) > **Console tab**
4. Click "Send OTP"
5. Look for these log messages:
   - 📱 Starting OTP send process...
   - 🔐 Initializing reCAPTCHA...
   - 📞 Sending OTP via Firebase...
   - ✅ OTP sent successfully (if working)
   - ❌ Error message (if not working)

## Common Issues & Fixes

### "Phone authentication is not enabled in your Firebase project"
- **Solution**: Enable Phone Authentication in Firebase Console (steps 1-6 above)

### "Invalid reCAPTCHA configuration"
- **Solution**: Make sure reCAPTCHA v2 is configured in Authentication Settings
- Check that site key is set for your domain

### "Invalid phone number"
- **Check**: Phone must be 10 digits (without +91)
- **Current format in app**: +91{10-digit-number}
- **Example**: 9028493353 → +919028493353

### "Too many requests"
- **Solution**: Wait 24 hours before trying the same number again
- Also check Firebase Console for rate limiting settings

## Debugging Steps

1. **Check Firebase Project ID matches**:
   - In your code: `VITE_FIREBASE_PROJECT_ID` env var
   - In Firebase Console: Project Settings > Project ID
   - They must match exactly

2. **Check API Key has Phone Authentication enabled**:
   - Firebase Console > Project Settings > Service Accounts
   - Make sure your Firebase API key allows Phone Auth

3. **Check Domain is whitelisted**:
   - Firebase Console > Authentication > Settings
   - Look for "Authorized domains"
   - Make sure `saathi-health-insurance.web.app` is listed

4. **Clear Browser Cache & Hard Refresh**:
   - Close the site completely
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Try again

## Test with Mock OTP (Optional)

If you want to test without real SMS:
1. The system currently requires real Firebase Phone Authentication
2. Contact developer for "test mode" implementation if needed

## Still Having Issues?

**Check Firebase Console Logs**:
1. Go to Firebase Console > Logging
2. Look for any auth-related errors
3. Take screenshot and share with developer

**Browser Console Logs**:
1. Press F12 to open DevTools
2. Go to Console tab
3. Try sending OTP
4. Copy all emoji-prefixed log messages
5. Share these logs for debugging
