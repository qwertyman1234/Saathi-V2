/**
 * OTP Service for Phone Verification
 * Uses Firebase Phone Authentication (FREE - no SMS costs)
 */

import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

interface VerificationSession {
  confirmationResult: any;
  phone: string;
  timestamp: number;
}

// Store session temporarily (Firebase handles backend)
const verificationSessions = new Map<string, VerificationSession>();
let recaptchaVerifier: RecaptchaVerifier | null = null;
const MAX_RESENDS = 3;
const resendStore = new Map<string, number>();

/**
 * Initialize reCAPTCHA for phone verification
 * Call this once when component mounts
 */
export async function initializeRecaptcha(containerId: string = "recaptcha-container"): Promise<RecaptchaVerifier | null> {
  try {
    const auth = getAuth();
    
    // Check if container exists
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`reCAPTCHA container with id "${containerId}" not found, creating invisible one`);
      // Create invisible container if it doesn't exist
      const div = document.createElement("div");
      div.id = containerId;
      div.style.display = "none";
      document.body.appendChild(div);
    }

    // Clear previous verifier if exists
    if (recaptchaVerifier) {
      recaptchaVerifier = null;
    }

    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: (token) => {
        console.log("reCAPTCHA verified");
      },
      "expired-callback": () => {
        console.log("reCAPTCHA expired, will request new token on next verify");
        recaptchaVerifier = null;
      },
      "error-callback": (error) => {
        console.error("reCAPTCHA error:", error);
        recaptchaVerifier = null;
      }
    });

    return recaptchaVerifier;
  } catch (error: any) {
    console.error("Error initializing reCAPTCHA:", error);
    recaptchaVerifier = null;
    return null;
  }
}

/**
 * Send OTP via Firebase Phone Authentication (COMPLETELY FREE)
 * Firebase Phone Auth is free - no SMS charges
 */
export async function sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
  // Validate phone
  if (!phone || phone.length !== 10) {
    return { success: false, message: "Invalid phone number. Please enter 10 digits." };
  }

  // Check resend limit
  const resendCount = resendStore.get(phone) || 0;
  if (resendCount >= MAX_RESENDS) {
    return { success: false, message: "Too many resend attempts. Try again in 24 hours." };
  }

  try {
    const auth = getAuth();
    const phoneWithCountryCode = `+91${phone}`; // India country code

    console.log("📱 Starting OTP send process for:", phoneWithCountryCode);

    // Initialize reCAPTCHA if not already done
    if (!recaptchaVerifier) {
      console.log("🔐 Initializing reCAPTCHA...");
      const verifier = await initializeRecaptcha("recaptcha-container");
      recaptchaVerifier = verifier;
    }

    if (!recaptchaVerifier) {
      // If reCAPTCHA still fails, try to create new one
      console.log("⚠️ reCAPTCHA verifier not initialized, creating new one...");
      try {
        recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible"
        });
        console.log("✅ reCAPTCHA verifier created successfully");
      } catch (error) {
        console.error("❌ Failed to create reCAPTCHA verifier:", error);
        return {
          success: false,
          message: "Security verification failed. Please refresh and try again."
        };
      }
    }

    console.log("📞 Sending OTP via Firebase Phone Authentication...");
    
    // Sign in with phone using Firebase (handles OTP sending)
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneWithCountryCode,
      recaptchaVerifier
    );

    console.log("✅ OTP sent successfully to:", phoneWithCountryCode);

    // Store confirmation result for later verification
    verificationSessions.set(phone, {
      confirmationResult,
      phone,
      timestamp: Date.now(),
    });

    // Increment resend count
    resendStore.set(phone, resendCount + 1);

    // Reset reCAPTCHA for next use
    recaptchaVerifier = null;

    return {
      success: true,
      message: `OTP sent to +91${phone}. Check your messages.`,
    };
  } catch (error: any) {
    console.error("❌ Error sending OTP:", error);
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);
    console.error("Full error:", JSON.stringify(error, null, 2));
    
    let message = "Failed to send OTP. Please check your phone number.";
    
    if (error?.code === "auth/invalid-phone-number") {
      message = "Invalid phone number. Please enter a valid Indian phone number.";
    } else if (error?.code === "auth/too-many-requests") {
      message = "Too many requests. Please try again later.";
    } else if (error?.code === "auth/missing-phone-number") {
      message = "Phone number is required.";
    } else if (error?.code === "auth/operation-not-allowed") {
      message = "Phone authentication is not enabled in your Firebase project.";
    } else if (error?.message?.includes("reCAPTCHA")) {
      message = "Security verification failed. Please refresh the page and try again.";
    } else if (error?.message?.includes("AUTHENTICATION_DISABLED")) {
      message = "Phone authentication is disabled. Please try again later.";
    }

    recaptchaVerifier = null;
    return { success: false, message };
  }
}

/**
 * Verify OTP code entered by user
 */
export async function verifyOTP(phone: string, code: string): Promise<{ valid: boolean; message: string; userCredential?: any }> {
  // Validate code
  if (!code || code.length !== 6) {
    return { valid: false, message: "OTP must be 6 digits." };
  }

  try {
    const session = verificationSessions.get(phone);

    if (!session) {
      return { valid: false, message: "No OTP found. Request a new one." };
    }

    // Check if session expired (10 minutes)
    if (Date.now() - session.timestamp > 10 * 60 * 1000) {
      verificationSessions.delete(phone);
      return { valid: false, message: "OTP expired. Request a new one." };
    }

    // Verify OTP with Firebase
    const result = await session.confirmationResult.confirm(code);

    // Clear session on success
    verificationSessions.delete(phone);
    resendStore.delete(phone);

    return {
      valid: true,
      message: "OTP verified successfully!",
      userCredential: result,
    };
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    
    // Provide helpful error messages
    let message = "Invalid OTP. Please try again.";
    if (error?.code === "auth/invalid-verification-code") {
      message = "Invalid OTP. Please check and try again.";
    } else if (error?.code === "auth/code-expired") {
      verificationSessions.delete(phone);
      message = "OTP expired. Request a new one.";
    } else if (error?.code === "auth/too-many-requests") {
      message = "Too many attempts. Try again later.";
    }

    return { valid: false, message };
  }
}

/**
 * Clear verification session (for logout or UI reset)
 */
export function clearVerificationSession(phone: string): void {
  verificationSessions.delete(phone);
}

/**
 * Get remaining verification time (in seconds)
 */
export function getVerificationTimeRemaining(phone: string): number {
  const session = verificationSessions.get(phone);
  if (!session) return 0;

  const elapsed = Date.now() - session.timestamp;
  const remaining = Math.max(0, 10 * 60 * 1000 - elapsed); // 10 minutes
  return Math.ceil(remaining / 1000);
}

/**
 * Check if phone has pending verification
 */
export function hasPendingVerification(phone: string): boolean {
  const session = verificationSessions.get(phone);
  if (!session) return false;

  // Check if still within 10-minute window
  const elapsed = Date.now() - session.timestamp;
  return elapsed < 10 * 60 * 1000;
}
