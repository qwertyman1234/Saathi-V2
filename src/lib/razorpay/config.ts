/**
 * Razorpay Configuration
 * Store credentials in .env.local
 */

export const RAZORPAY_CONFIG = {
  // Public key - safe to expose in frontend
  keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_1234567890abcd",
  
  // Private key stored on backend only (via Edge Function)
  // Never expose to frontend
  
  // API endpoints
  orderEndpoint: "/api/razorpay/create-order",
  verifyEndpoint: "/api/razorpay/verify-payment",
  
  // Webhook config (backend only)
  webhookSecret: import.meta.env.VITE_RAZORPAY_WEBHOOK_SECRET || "",
};

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
