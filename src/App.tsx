import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AdminLayout } from "@/components/AdminLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { VaultProvider } from "@/contexts/VaultContext";
import { Loader2, Shield } from "lucide-react";
import { isAdmin } from "@/lib/utils";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ClaimsTracker from "./pages/ClaimsTracker";
import ComparePolicies from "./pages/ComparePolicies";
import FamilyWallet from "./pages/FamilyWallet";
import HyperlocalSearch from "./pages/HyperlocalSearch";
import GapAnalysis from "./pages/GapAnalysis";
import CostEstimator from "./pages/CostEstimator";
import CheckClaim from "./pages/CheckClaim";
import ExplainPolicy from "./pages/ExplainPolicy";
import ChatAssistant from "./pages/ChatAssistant";
import BuyInsurance from "./pages/BuyInsurance";
import InsuranceVault from "./pages/InsuranceVault";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import ManagePlans from "./pages/admin/ManagePlans";
import ManageUsers from "./pages/admin/ManageUsers";
import ReviewClaims from "./pages/admin/ReviewClaims";
import AccountSettings from "./pages/admin/AccountSettings";

const queryClient = new QueryClient();

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Shield className="h-7 w-7 text-primary-foreground" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Saathi…</p>
      </div>
    </div>
  );
}

// Require user to be logged in
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Require login + completed onboarding
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  // Wait for profile to load before deciding
  if (profile === null) return <FullPageLoader />;
  if (!profile.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

// If already logged in, skip login/signup
function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user && profile !== null) {
    if (!profile.onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// Require admin role
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile === null) return <FullPageLoader />;
  if (!isAdmin(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages */}
      <Route path="/login"  element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/signup" element={<RedirectIfAuthed><SignUp /></RedirectIfAuthed>} />

      {/* Onboarding — requires auth, redirects to dashboard when done */}
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

      {/* Protected app */}
      <Route path="/dashboard" element={<RequireOnboarding><Layout><Dashboard /></Layout></RequireOnboarding>} />
      <Route path="/claims"    element={<RequireOnboarding><Layout><ClaimsTracker /></Layout></RequireOnboarding>} />
      <Route path="/compare"   element={<RequireOnboarding><Layout><ComparePolicies /></Layout></RequireOnboarding>} />
      <Route path="/family"    element={<RequireOnboarding><Layout><FamilyWallet /></Layout></RequireOnboarding>} />
      <Route path="/search"    element={<RequireOnboarding><Layout><HyperlocalSearch /></Layout></RequireOnboarding>} />
      <Route path="/gaps"      element={<RequireOnboarding><Layout><GapAnalysis /></Layout></RequireOnboarding>} />
      <Route path="/cost"      element={<RequireOnboarding><Layout><CostEstimator /></Layout></RequireOnboarding>} />
      <Route path="/check"     element={<RequireOnboarding><Layout><CheckClaim /></Layout></RequireOnboarding>} />
      <Route path="/explain"   element={<RequireOnboarding><Layout><ExplainPolicy /></Layout></RequireOnboarding>} />
      <Route path="/chat"      element={<RequireOnboarding><Layout><ChatAssistant /></Layout></RequireOnboarding>} />
      <Route path="/buy-insurance" element={<RequireAuth><Layout><BuyInsurance /></Layout></RequireAuth>} />
      <Route path="/buy-insurance/:step" element={<RequireAuth><Layout><BuyInsurance /></Layout></RequireAuth>} />
      <Route path="/profile"   element={<RequireOnboarding><Layout><UserProfile /></Layout></RequireOnboarding>} />
      <Route path="/vault"     element={<RequireAuth><Layout><InsuranceVault /></Layout></RequireAuth>} />

      {/* Admin routes */}
      <Route path="/admin/*" element={<RequireAdmin><AdminRoutes /></RequireAdmin>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboardPlaceholder />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/plans" element={<ManagePlans />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/claims" element={<ReviewClaims />} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AdminLayout>
  );
}

function AdminDashboardPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome to Admin Panel</h1>
        <p className="text-muted-foreground">Manage insurance plans, users, claims, and view analytics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Analytics", desc: "View dashboards & reports", href: "/admin/analytics" },
          { title: "Insurance Plans", desc: "Manage plan catalog", href: "/admin/plans" },
          { title: "Users", desc: "View & manage users", href: "/admin/users" },
          { title: "Claims Review", desc: "Approve/reject claims", href: "/admin/claims" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <h3 className="font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <VaultProvider>
            <AppRoutes />
          </VaultProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
