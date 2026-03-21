# OTP Troubleshooting Checklist

## Step 1: Check Browser Console Logs
**Action**: 
1. Open browser: https://saathi-health-insurance.web.app
2. Press **F12** to open DevTools
3. Click **Console** tab
4. Enter phone: `9028493353`
5. Click **Send OTP**
6. **Look for log messages starting with emoji** (📱, 🔐, 📞, ✅, ❌)

**What you should see**:
- ✅ Good: `✅ OTP sent successfully to: +919028493353`
- ❌ Bad: Error messages starting with ❌

---

## Step 2: Share Error Message
**If you see an error, look for one of these and tell me which one:**

| Error | Cause | Fix |
|-------|-------|-----|
| `auth/operation-not-allowed` | Phone Auth not enabled | Enable in Firebase Console |
| `auth/invalid-phone-number` | Wrong phone format | Use 10 digits (9028493353) |
| `reCAPTCHA` error | reCAPTCHA not configured | Enable reCAPTCHA v2 in Firebase |
| `AUTHENTICATION_DISABLED` | Phone Auth disabled | Enable in Firebase Console |
| `auth/too-many-requests` | Too many attempts | Wait 24 hours |

---

## Step 3: Enable Phone Authentication in Firebase

**If you see "Phone authentication is not enabled" error:**

1. **Go to**: https://console.firebase.google.com/
2. **Select** project: `saathi-health-insurance`
3. **Left sidebar** > **Build** > **Authentication**
4. **Click** the **"Sign-in method"** tab
5. **Find** "Phone" in the list
6. **If greyed out**: Click it > Click **Enable toggle** > Click **Save**
7. **If enabled (green)**: Phone Auth is already set up ✅

---

## Step 4: Check reCAPTCHA Configuration

1. **In Firebase Console** > **Authentication** page
2. **Look for** a section about "reCAPTCHA" or "reCAPTCHA Enterprise"
3. **Make sure** one is enabled (should have a green checkmark)
4. **Verify** your domain is listed:
   - Should include: `saathi-health-insurance.web.app`

---

## Step 5: Clear Cache & Refresh

1. Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
   - This does a hard refresh (clears cache)
2. Close the browser completely and reopen
3. Try again

---

## Step 6: Test with Different Numbers

Try these numbers (if configured):
```
9028493353 → Test 1
9876543210 → Test 2
9999999999 → Test 3
```

**If one works but another doesn't**: The issue might be rate limiting.

---

## Step 7: For Real SMS Testing

Real SMS OTP will only work if:
- ✅ Phone Authentication is **enabled** in Firebase
- ✅ reCAPTCHA v2 is **enabled** in Firebase
- ✅ Your domain is **whitelisted** in Firebase
- ✅ Your Firebase **API key has correct permissions**

---

## Step 8: Collect Diagnostic Info

**Please gather and share:**

```
1. Screenshot of browser console (F12 > Console)
   - Include all messages starting with emoji (📱, 🔐, etc.)

2. Error message text:
   - Copy the full error message shown in red

3. Phone number used:
   - What 10-digit number did you test with?

4. Firebase Project Status:
   - Take screenshot of Firebase Console > Authentication
   - Show if Phone is enabled or disabled
   - Show reCAPTCHA status

5. Browser & OS:
   - Example: Chrome on Windows 11
   - Safari on iOS 16
```

---

## Quick Test Script

**If you want to see the actual Firebase error**, paste this in browser console:

```javascript
// Copy and paste into Browser Console (F12)
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

async function testOTP() {
  try {
    const auth = getAuth();
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible'
    });
    const result = await signInWithPhoneNumber(auth, '+919028493353', verifier);
    console.log("✅ SUCCESS:", result);
  } catch (error) {
    console.error("❌ FIREBASE ERROR:", error.code, error.message);
  }
}

testOTP();
```

---

## Alternative: Development Mode with Test OTP

If Firebase Phone Auth is problematic, we can implement **test mode** where:
- ✅ No real SMS needed
- ✅ Use predefined test OTPs
- ✅ Test the rest of the onboarding flow
- ✅ Later enable real SMS when Firebase is ready

**Would you like me to implement this?** Tell me and I'll add it.

---

## Next Steps

1. **Tell me the exact error** you see in the browser console
2. **Check if Phone Authentication is enabled** in Firebase
3. **Share any error messages** that start with ❌

Then I can give you a targeted fix!
