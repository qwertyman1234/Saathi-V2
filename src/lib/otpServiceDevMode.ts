/**
 * DEVELOPMENT MODE - OTP Service with Local Testing Support
 * Use this alongside Firebase Phone Auth for easier testing
 */

// Test OTP codes (use in development mode)
const TEST_OTP_CODES = {
  "9028493353": "123456",
  "9876543210": "654321",
  "9999999999": "111111",
  // Add more test numbers as needed
};

// Simple in-memory storage for development
const devSessions = new Map<string, { otp: string; timestamp: number }>();

/**
 * DEVELOPMENT: Send test OTP
 * Phone format: 10 digits (9028493353)
 * For testing: use phone numbers from TEST_OTP_CODES and their paired OTP
 */
export function sendTestOTP(phone: string): { success: boolean; message: string; testOTP?: string } {
  if (!phone || phone.length !== 10) {
    return { success: false, message: "Invalid phone. Use 10 digits." };
  }

  // Check if it's a test number
  if (TEST_OTP_CODES[phone as keyof typeof TEST_OTP_CODES]) {
    const otp = TEST_OTP_CODES[phone as keyof typeof TEST_OTP_CODES];
    const timestamp = Date.now();
    devSessions.set(phone, { otp, timestamp });

    console.log(`🧪 DEV MODE: OTP for +91${phone} = ${otp}`);

    return {
      success: true,
      message: `✅ DEV TEST OTP sent (check console)`,
      testOTP: otp, // Only in dev!
    };
  }

  return {
    success: false,
    message: `Number not in test list. Use: ${Object.keys(TEST_OTP_CODES).join(", ")}`,
  };
}

/**
 * DEVELOPMENT: Verify test OTP
 */
export function verifyTestOTP(phone: string, code: string): { valid: boolean; message: string } {
  const session = devSessions.get(phone);

  if (!session) {
    return { valid: false, message: "No OTP sent for this number" };
  }

  if (Date.now() - session.timestamp > 10 * 60 * 1000) {
    devSessions.delete(phone);
    return { valid: false, message: "OTP expired" };
  }

  if (code === session.otp) {
    devSessions.delete(phone);
    return { valid: true, message: "✅ OTP verified (dev mode)" };
  }

  return { valid: false, message: `Invalid OTP. Expected: ${session.otp}` };
}

/**
 * DEVELOPMENT: Clear session
 */
export function clearTestSession(phone: string): void {
  devSessions.delete(phone);
}
