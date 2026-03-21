/**
 * Twilio SMS Service
 * Handles SMS notifications for policy and claim updates
 * 
 * Setup: npm install twilio
 * Get credentials from: https://www.twilio.com/console
 * Account SID, Auth Token, Phone Number
 */

export interface SMSTemplate {
  to: string;
  message: string;
}

/**
 * Policy Confirmation SMS
 */
export function getPolicyConfirmationSMS(data: {
  userName: string;
  policyNumber: string;
  planName: string;
  phone: string;
}): SMSTemplate {
  const message = `Hi ${data.userName}! Your ${data.planName} insurance policy ${data.policyNumber} is now active. Coverage starts today! Stay protected with Saathi. Login: saathiinsurance.com`;

  return {
    to: data.phone,
    message: message.substring(0, 160), // SMS limit
  };
}

/**
 * Claim Submitted SMS
 */
export function getClaimSubmittedSMS(data: {
  claimNumber: string;
  phone: string;
}): SMSTemplate {
  const message = `Your insurance claim ${data.claimNumber} has been submitted. Status updates will be sent to this number. Track it on saathiinsurance.com`;

  return {
    to: data.phone,
    message: message.substring(0, 160),
  };
}

/**
 * Claim Approved SMS
 */
export function getClaimApprovedSMS(data: {
  claimNumber: string;
  settledAmount: number;
  phone: string;
}): SMSTemplate {
  const message = `Good news! Claim ${data.claimNumber} approved. ₹${data.settledAmount.toLocaleString("en-IN")} will be credited to your account in 3-5 days.`;

  return {
    to: data.phone,
    message: message.substring(0, 160),
  };
}

/**
 * Policy Renewal Reminder SMS
 */
export function getPolicyRenewalSMS(data: {
  policyNumber: string;
  daysRemaining: number;
  phone: string;
}): SMSTemplate {
  const message = `Reminder: Your policy ${data.policyNumber} expires in ${data.daysRemaining} days. Renew now at saathiinsurance.com to avoid coverage gap.`;

  return {
    to: data.phone,
    message: message.substring(0, 160),
  };
}

/**
 * OTP SMS
 */
export function getOTPSMS(data: {
  otp: string;
  phone: string;
}): SMSTemplate {
  const message = `Your Saathi Insurance verification code is ${data.otp}. Don't share this with anyone. Valid for 10 minutes.`;

  return {
    to: data.phone,
    message,
  };
}

/**
 * Send SMS using Twilio
 * Backend only - requires AUTH_TOKEN
 */
export async function sendSMS(template: SMSTemplate): Promise<{
  success: boolean;
  sid?: string;
  error?: string;
}> {
  try {
    // Get Twilio credentials from environment
    const accountSID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
    const fromPhone = import.meta.env.VITE_TWILIO_FROM_PHONE;

    if (!accountSID || !authToken || !fromPhone) {
      console.warn("Twilio credentials not configured");
      return { success: false, error: "SMS service not configured" };
    }

    // Prepare request
    const params = new URLSearchParams();
    params.append("From", fromPhone);
    params.append("To", template.to);
    params.append("Body", template.message);

    // Send SMS via Twilio API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSID}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send SMS");
    }

    const data = await response.json();
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

/**
 * Batch send SMS (for multiple recipients)
 */
export async function sendBatchSMS(
  templates: SMSTemplate[]
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ to: string; error: string }>;
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ to: string; error: string }>,
  };

  for (const template of templates) {
    const result = await sendSMS(template);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        to: template.to,
        error: result.error || "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Validate Indian phone number
 */
export function isValidIndianPhoneNumber(phone: string): boolean {
  const pattern = /^(\+91)?[6-9]\d{9}$/;
  const cleanedPhone = phone.replace(/\D/g, "");
  return pattern.test(cleanedPhone);
}

/**
 * Format phone number for SMS sending
 */
export function formatPhoneForSMS(phone: string): string {
  const cleanedPhone = phone.replace(/\D/g, "");
  if (cleanedPhone.startsWith("91")) {
    return `+${cleanedPhone}`;
  }
  if (cleanedPhone.length === 10) {
    return `+91${cleanedPhone}`;
  }
  return `+${cleanedPhone}`;
}
