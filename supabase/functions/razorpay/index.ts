/**
 * Supabase Edge Function: Razorpay Payment Integration
 * 
 * This function handles:
 * 1. Creating Razorpay orders
 * 2. Verifying payment signatures
 * 3. Creating policy records in Firestore
 * 
 * Deploy with: supabase functions deploy razorpay
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "";
const FIREBASE_API_KEY = Deno.env.get("FIREBASE_API_KEY") || "";

interface CreateOrderRequest {
  planId: string;
  userId: string;
  amount: number;
  planName: string;
  email: string;
  phone: string;
}

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userId: string;
  planId: string;
}

/**
 * Create Razorpay Order
 */
async function createOrder(req: CreateOrderRequest) {
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

  const body = {
    amount: req.amount, // in paise
    currency: "INR",
    receipt: `receipt_${req.userId}_${Date.now()}`,
    customer_notify: 1,
    notes: {
      plan_id: req.planId,
      user_id: req.userId,
      plan_name: req.planName,
    },
  };

  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Razorpay error: ${error}`);
    }

    const order = await response.json();

    return {
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
      },
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to create order: ${errorMessage}`,
    };
  }
}

/**
 * Verify Payment Signature
 *
 * Razorpay uses HMAC-SHA256 for signature verification
 */
async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  try {
    const message = `${orderId}|${paymentId}`;
    const key = RAZORPAY_KEY_SECRET;

    // Import the key
    const keyObj = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(key),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Sign the message
    const signedBuffer = await crypto.subtle.sign(
      "HMAC",
      keyObj,
      new TextEncoder().encode(message)
    );

    // Convert to hex string for comparison
    const computedSignature = Array.from(new Uint8Array(signedBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare with provided signature
    return computedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Create Policy in Firestore
 */
async function createPolicy(
  userId: string,
  planId: string,
  paymentId: string,
  amount: number
) {
  // Policy creation would be handled by Firebase Cloud Function or API
  // This is a placeholder for actual Firestore document creation

  return {
    policyId: `SAA-${Date.now().toString().slice(-8)}`,
    userId,
    planId,
    paymentId,
    amount,
    status: "active",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Main handler
 */
serve(async (req: Request) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { action, ...payload } = await req.json();

    if (action === "create_order") {
      const result = await createOrder(payload as CreateOrderRequest);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "verify_payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } =
        payload as VerifyPaymentRequest;

      // Verify signature
      const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, message: "Invalid signature" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Create policy
      const policy = await createPolicy(userId, planId, razorpay_payment_id, 0);

      return new Response(
        JSON.stringify({
          success: true,
          policyId: policy.policyId,
          message: "Payment verified successfully",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ message: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
