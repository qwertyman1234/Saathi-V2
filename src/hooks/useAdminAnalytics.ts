import { useEffect, useState } from "react";
import {
  collection, getCountFromServer, query, where, getDocs, Timestamp, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface AnalyticsData {
  totalUsers: number;
  activeUsersMonth: number;
  totalClaims: number;
  totalRevenue: number;
  claimsApproved: number;
  claimsPending: number;
  claimsRejected: number;
  planPopularity: { [planId: string]: number };
  monthlySignups: { date: string; count: number }[];
  claimsTrend: { date: string; approved: number; rejected: number; pending: number }[];
}

export function useAdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeActiveUsers: (() => void) | null = null;
    let unsubscribeProfiles: (() => void) | null = null;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Total users
        const usersSnapshot = await getCountFromServer(collection(db, "profiles"));
        const totalUsers = usersSnapshot.data().count;

        // Active users this month - Count UNIQUE USERS who logged in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Real-time listener for unique active users
        unsubscribeActiveUsers = onSnapshot(collection(db, "loginLogs"), async (snapshot) => {
          const uniqueUserIds = new Set<string>();
          
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const loginTime = data.timestamp || data.lastLogin;
            
            // Check if login is within last 30 days
            if (loginTime instanceof Timestamp && loginTime.toDate() >= thirtyDaysAgo) {
              uniqueUserIds.add(data.userId);
            }
          });

          const activeCount = uniqueUserIds.size;
          console.log("Real-time update - Unique active users (last 30 days):", activeCount);
          console.log("User IDs:", Array.from(uniqueUserIds));

          setData((prevData) => {
            if (!prevData) return null;
            return {
              ...prevData,
              activeUsersMonth: activeCount,
            };
          });
        });

        // Total claims
        const claimsSnapshot = await getCountFromServer(collection(db, "claims"));
        const totalClaims = claimsSnapshot.data().count;

        // Claims by status
        const claimsApprovedSnapshot = await getCountFromServer(
          query(collection(db, "claims"), where("status", "==", "approved"))
        );
        const claimsApproved = claimsApprovedSnapshot.data().count;

        const claimsPendingSnapshot = await getCountFromServer(
          query(collection(db, "claims"), where("status", "==", "pending"))
        );
        const claimsPending = claimsPendingSnapshot.data().count;

        const claimsRejectedSnapshot = await getCountFromServer(
          query(collection(db, "claims"), where("status", "==", "rejected"))
        );
        const claimsRejected = claimsRejectedSnapshot.data().count;

        // Get all policies for revenue and plan popularity
        const policiesSnapshot = await getDocs(collection(db, "policies"));
        let totalRevenue = 0;
        const planPopularity: { [key: string]: number } = {};

        policiesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const premium = data.premium || 0;
          totalRevenue += premium;
          planPopularity[data.planId] = (planPopularity[data.planId] || 0) + 1;
        });

        // Get all claims for trend analysis
        const allClaimsSnapshot = await getDocs(collection(db, "claims"));
        const claimsTrendMap: { [date: string]: { approved: number; rejected: number; pending: number } } = {};
        const lastNineDays = new Date();
        lastNineDays.setDate(lastNineDays.getDate() - 9);

        allClaimsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt;
          if (createdAt instanceof Timestamp) {
            const date = createdAt.toDate();
            if (date >= lastNineDays) {
              const dateKey = date.toISOString().split("T")[0];
              if (!claimsTrendMap[dateKey]) {
                claimsTrendMap[dateKey] = { approved: 0, rejected: 0, pending: 0 };
              }
              claimsTrendMap[dateKey][data.status as "approved" | "rejected" | "pending"]++;
            }
          }
        });

        const claimsTrend = Object.entries(claimsTrendMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, counts]) => ({ date, ...counts }));

        // Get signup trend for last 30 days
        const allProfilesSnapshot = await getDocs(collection(db, "profiles"));
        const signupTrendMap: { [date: string]: number } = {};

        allProfilesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt;
          if (createdAt instanceof Timestamp) {
            const date = createdAt.toDate();
            if (date >= thirtyDaysAgo) {
              const dateKey = date.toISOString().split("T")[0];
              signupTrendMap[dateKey] = (signupTrendMap[dateKey] || 0) + 1;
            }
          }
        });

        const monthlySignups = Object.entries(signupTrendMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count }));

        // Get initial count of unique users
        const allLoginLogsSnapshot = await getDocs(collection(db, "loginLogs"));
        const uniqueUserIds = new Set<string>();
        
        allLoginLogsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const loginTime = data.timestamp || data.lastLogin;
          if (loginTime instanceof Timestamp && loginTime.toDate() >= thirtyDaysAgo) {
            uniqueUserIds.add(data.userId);
          }
        });

        const initialActiveUsersMonth = uniqueUserIds.size;

        // Set initial data
        setData({
          totalUsers,
          activeUsersMonth: initialActiveUsersMonth,
          totalClaims,
          totalRevenue,
          claimsApproved,
          claimsPending,
          claimsRejected,
          planPopularity,
          monthlySignups,
          claimsTrend,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch analytics");
        setLoading(false);
      }
    };

    fetchAnalytics();

    return () => {
      if (unsubscribeActiveUsers) {
        unsubscribeActiveUsers();
      }
      if (unsubscribeProfiles) {
        unsubscribeProfiles();
      }
    };
  }, []);

  return { data, loading, error };
}
