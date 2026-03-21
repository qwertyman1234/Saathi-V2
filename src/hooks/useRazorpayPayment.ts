/**
 * useRazorpayPayment Hook
 * Manages Razorpay payment flow and state
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  loadRazorpayScript,
  createRazorpayOrder,
  openRazorpayCheckout,
  verifyPayment,
} from "@/lib/razorpay/service";
import { type RazorpayPaymentVerification } from "@/lib/razorpay/config";
import { generatePolicySummary } from "@/lib/pdf/policyGenerator";
import type { InsurancePlan } from "@/data/insurancePlans";

interface UseRazorpayPaymentProps {
  userId: string;
  email: string;
  phone: string;
  name: string;
}

interface PaymentState {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  policyId: string | null;
}

export function useRazorpayPayment(props: UseRazorpayPaymentProps) {
  const [state, setState] = useState<PaymentState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    policyId: null,
  });

  const initiatePayment = useCallback(
    async (
      plan: InsurancePlan,
      premium: number,
      coverage: number
    ): Promise<string | null> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Load Razorpay script
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error("Failed to load Razorpay");
        }

        // Create order
        const order = await createRazorpayOrder({
          planId: plan.id,
          userId: props.userId,
          amount: premium * 100, // Convert to paise
          planName: plan.name,
          email: props.email,
          phone: props.phone,
        });

        setState(prev => ({ ...prev, isProcessing: true }));

        // Open checkout
        await openRazorpayCheckout(
          order,
          {
            email: props.email,
            phone: props.phone,
            name: props.name,
          },
          async (paymentData: RazorpayPaymentVerification) => {
            try {
              // Verify payment
              const verifyResult = await verifyPayment({
                razorpay_order_id: paymentData.razorpay_order_id,
                razorpay_payment_id: paymentData.razorpay_payment_id,
                razorpay_signature: paymentData.razorpay_signature,
                userId: props.userId,
                planId: plan.id,
              });

              if (verifyResult.success) {
                const generatedPolicyId = verifyResult.policyId || 
                  `SAA-${Date.now().toString().slice(-8)}`;

                setState(prev => ({
                  ...prev,
                  isProcessing: false,
                  policyId: generatedPolicyId,
                  isLoading: false,
                }));

                toast.success(
                  `Payment successful! Policy ${generatedPolicyId} created.`
                );

                return generatedPolicyId;
              } else {
                throw new Error(verifyResult.message || "Verification failed");
              }
            } catch (verifyError) {
              const errorMsg = verifyError instanceof Error 
                ? verifyError.message 
                : "Payment verification failed";

              setState(prev => ({
                ...prev,
                isProcessing: false,
                error: errorMsg,
                isLoading: false,
              }));

              toast.error(errorMsg);
            }
          },
          (error: string) => {
            setState(prev => ({
              ...prev,
              isProcessing: false,
              error,
              isLoading: false,
            }));

            toast.error(error);
          }
        );

        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Payment initialization failed";
        setState(prev => ({
          ...prev,
          isLoading: false,
          isProcessing: false,
          error: errorMsg,
        }));

        toast.error(errorMsg);
        return null;
      }
    },
    [props.userId, props.email, props.phone, props.name]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isProcessing: false,
      error: null,
      policyId: null,
    });
  }, []);

  return {
    ...state,
    initiatePayment,
    reset,
  };
}
