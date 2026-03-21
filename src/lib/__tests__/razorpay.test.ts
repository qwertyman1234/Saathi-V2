/**
 * Unit Tests for Razorpay Payment
 * Testing payment order creation, verification, and failure handling
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createRazorpayOrder,
  verifyPayment,
  loadRazorpayScript,
} from "@/lib/razorpay/service";

describe("Razorpay Payment Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createRazorpayOrder", () => {
    it("should create order with correct payload", async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order: {
            id: "order_123456",
            amount: 50000,
            currency: "INR",
            receipt: "receipt_user_123",
            status: "created",
            created_at: 1705593600,
          },
        }),
      });

      const result = await createRazorpayOrder({
        planId: "gold",
        userId: "user_123",
        amount: 50000,
        planName: "Gold Plan",
        email: "user@test.com",
        phone: "+919876543210",
      });

      expect(result.id).toBe("order_123456");
      expect(result.amount).toBe(50000);
      expect(result.currency).toBe("INR");
    });

    it("should handle order creation error", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid request" }),
      });

      await expect(
        createRazorpayOrder({
          planId: "gold",
          userId: "user_123",
          amount: 50000,
          planName: "Gold Plan",
          email: "user@test.com",
          phone: "+919876543210",
        })
      ).rejects.toThrow();
    });
  });

  describe("verifyPayment", () => {
    it("should verify valid payment signature", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          policyId: "SAA-123456",
          message: "Payment verified successfully",
        }),
      });

      const result = await verifyPayment({
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_123",
        razorpay_signature: "sig_123",
        userId: "user_123",
        planId: "gold",
      });

      expect(result.success).toBe(true);
      expect(result.policyId).toBe("SAA-123456");
    });

    it("should reject invalid payment signature", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid signature" }),
      });

      await expect(
        verifyPayment({
          razorpay_order_id: "order_123",
          razorpay_payment_id: "pay_123",
          razorpay_signature: "invalid_sig",
          userId: "user_123",
          planId: "gold",
        })
      ).rejects.toThrow();
    });
  });

  describe("loadRazorpayScript", () => {
    it.skip("should load Razorpay script successfully", async () => {
      // Skip in unit tests - test with DOM in E2E tests
      const mockScript = document.createElement("script");
      mockScript.onload = vi.fn();

      global.document.head.appendChild = vi.fn();

      const loaded = await loadRazorpayScript();
      expect(loaded).toBe(true);
    });
  });
});
