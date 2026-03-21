import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp,
  serverTimestamp, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface InsurancePlan {
  id: string;
  name: string;
  provider: string;
  premium: number;
  coverage: number;
  features: string[];
  maxAge: number;
  minAge: number;
  claimSettlementDays: number;
  rating: number;
  badges: string[];
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

export function useAdminPlans() {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to plans collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "plans"), (snapshot) => {
      try {
        const plansData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as InsurancePlan));
        setPlans(plansData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch plans");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const createPlan = async (planData: Omit<InsurancePlan, "id" | "createdAt" | "updatedAt">) => {
    try {
      await addDoc(collection(db, "plans"), {
        ...planData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create plan";
      setError(message);
      return { success: false, error: message };
    }
  };

  const updatePlan = async (planId: string, updates: Partial<InsurancePlan>) => {
    try {
      const { id, createdAt, ...updateData } = updates as any;
      await updateDoc(doc(db, "plans", planId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update plan";
      setError(message);
      return { success: false, error: message };
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      await deleteDoc(doc(db, "plans", planId));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete plan";
      setError(message);
      return { success: false, error: message };
    }
  };

  return { plans, loading, error, createPlan, updatePlan, deletePlan };
}
