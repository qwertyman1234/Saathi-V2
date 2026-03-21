// Declare global Razorpay type
declare global {
  interface Window {
    Razorpay: any;
  }
}

import { RAZORPAY_CONFIG, type RazorpayOrder, type RazorpayPaymentVerification } from "./config";

export interface CreateOrderPayload {
  planId: string;
  userId: string;
  amount: number; // in paise
  planName: string;
  email: string;
  phone: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userId: string;
  planId: string;
}

/**
 * Create Razorpay order via Supabase Edge Function
 */
export async function createRazorpayOrder(
  payload: CreateOrderPayload
): Promise<RazorpayOrder> {
  try {
    const response = await fetch(RAZORPAY_CONFIG.orderEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create Razorpay order");
    }

    const data = await response.json();
    return data.order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
}

/**
 * Verify payment signature with Razorpay signature
 */
export async function verifyPayment(
  payload: VerifyPaymentPayload
): Promise<{
  success: boolean;
  policyId?: string;
  message: string;
}> {
  try {
    const response = await fetch(RAZORPAY_CONFIG.verifyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Payment verification failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
}

/**
 * Load Razorpay checkout script
 */
export async function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Open Razorpay payment modal
 */
export async function openRazorpayCheckout(
  order: RazorpayOrder,
  userDetails: {
    email: string;
    phone: string;
    name: string;
  },
  onSuccess: (paymentData: RazorpayPaymentVerification) => void,
  onError: (error: string) => void
): Promise<void> {
  if (!window.Razorpay) {
    onError("Razorpay is not loaded");
    return;
  }

  const options = {
    key: RAZORPAY_CONFIG.keyId,
    amount: order.amount.toString(),
    currency: order.currency,
    name: "Saathi Health Insurance",
    description: "Health Insurance Policy Purchase",
    order_id: order.id,
    customer_notifiation: 1,
    handler: function (response: any) {
      onSuccess({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    prefill: {
      name: userDetails.name,
      email: userDetails.email,
      contact: userDetails.phone,
    },
    notes: {
      note_key_1: "Saathi Health Insurance",
    },
    theme: {
      color: "#3399cc",
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();

  rzp.on("payment.failed", function (response: any) {
    onError(
      `Payment failed: ${response.error.code} - ${response.error.description}`
    );
  });
}
