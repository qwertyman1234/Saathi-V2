import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { insurancePlans as staticPlans, type InsurancePlan } from "@/data/insurancePlans";

export interface UserInsurancePlan extends InsurancePlan {
  provider?: string; // Admin uses "provider", users expect "insurer"
}

export function useInsurancePlans() {
  const [plans, setPlans] = useState<InsurancePlan[]>(staticPlans);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      // Subscribe to Firestore plans collection
      unsubscribe = onSnapshot(collection(db, "plans"), (snapshot) => {
        try {
          const firestorePlans = snapshot.docs.map((doc) => {
            const data = doc.data();
            
            // Map admin fields to user-facing fields
            return {
              id: doc.id,
              name: data.name || "",
              insurer: data.provider || data.insurer || "", // Admin saves as "provider"
              premium: data.premium || 0,
              coverage: data.coverage || 0,
              coverageLabel: `₹${(data.coverage / 100000).toFixed(1)}L`, // Generate if not provided
              pedWait: data.minAge || 1, // Use minAge as pedWait approximation
              claimRatio: 85, // Default, users can add this field
              rating: data.rating || 4.0,
              features: data.features || [],
              badge: data.badges?.[0] || "Standard",
              badgeColor: "bg-blue-100 text-blue-700", // Default badge color
            } as InsurancePlan;
          });

          if (firestorePlans.length > 0) {
            // Use Firestore plans if they exist
            setPlans(firestorePlans);
          } else {
            // Fall back to static plans if Firestore collection is empty
            setPlans(staticPlans);
          }

          setError(null);
        } catch (err) {
          console.error("Error processing Firestore plans:", err);
          // Keep static plans as fallback
          setPlans(staticPlans);
          setError(null); // Don't show error to user, just use fallback
        } finally {
          setLoading(false);
        }
      });
    } catch (err) {
      console.error("Error fetching plans from Firestore:", err);
      // Use static plans as fallback
      setPlans(staticPlans);
      setError(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { plans, loading, error };
}
