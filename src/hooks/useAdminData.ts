import { useEffect, useState } from "react";
import {
  collection, getDocs, updateDoc, doc, Timestamp, onSnapshot, getDoc, deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface AdminUserProfile {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: "admin" | "user";
  onboardingCompleted: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminClaim {
  id: string;
  userId: string;
  userName?: string;
  procedure: string;
  hospital: string;
  claimAmount: number;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  documents?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "profiles"), (snapshot) => {
      try {
        const usersData = snapshot.docs.map((doc) => ({
          userId: doc.id,
          ...doc.data(),
        } as AdminUserProfile));
        setUsers(usersData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const updateUser = async (userId: string, updates: Partial<AdminUserProfile>) => {
    try {
      const { userId: _, ...updateData } = updates;
      await updateDoc(doc(db, "profiles", userId), updateData);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user";
      setError(message);
      return { success: false, error: message };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "profiles", userId));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      setError(message);
      return { success: false, error: message };
    }
  };

  return { users, loading, error, updateUser, deleteUser };
}

export function useAdminClaims() {
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "claims"), async (snapshot) => {
      try {
        const claimsData: AdminClaim[] = [];

        for (const claimDoc of snapshot.docs) {
          const claimData = claimDoc.data();
          const userId = claimData.userId;

          // Get user name
          let userName = "Unknown";
          try {
            const userDoc = await getDoc(doc(db, "profiles", userId));
            if (userDoc.exists()) {
              userName = userDoc.data().fullName || "Unknown";
            }
          } catch {
            // userName stays "Unknown"
          }

          claimsData.push({
            id: claimDoc.id,
            userId,
            userName,
            ...claimData,
          } as AdminClaim);
        }

        setClaims(claimsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch claims");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const updateClaim = async (claimId: string, updates: Partial<AdminClaim>) => {
    try {
      const { id, userId, userName, ...updateData } = updates;
      await updateDoc(doc(db, "claims", claimId), updateData);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update claim";
      setError(message);
      return { success: false, error: message };
    }
  };

  return { claims, loading, error, updateClaim };
}
