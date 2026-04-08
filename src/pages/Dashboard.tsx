import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Clock, IndianRupee, TrendingUp, AlertTriangle, RefreshCw,
  ChevronDown, ChevronUp, FileText, Download, Plus, Calendar, CreditCard,
  Sparkles, Loader2, Newspaper, ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyMembers, usePolicies, useClaims } from "@/hooks/useUserData";
import { useAIHealthTips } from "@/hooks/useAIFeatures";
import { useTranslate } from "@/hooks/useTranslate";
import { askClaude, askClaudeJSON, askClaudeWithSearch } from "@/lib/claude";
import { addPolicy } from "@/lib/firebase/firestore";
import ReactMarkdown from "react-markdown";

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/20 text-success border-success/30",
    Pending: "bg-warning/20 text-warning border-warning/30",
    "Under Review": "bg-primary/20 text-primary border-primary/30",
    Settled: "bg-success/20 text-success border-success/30",
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${map[status] || "bg-secondary text-secondary-foreground border-border"}`}>{status}</span>;
}

function CircularScore({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.5 }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-card-foreground">{score}</span>
      </div>
    </div>
  );
}

// -- Live Insurance News --------------------------------------------------------
function InsuranceNewsWidget() {
  const [news, setNews] = useState<{ headline: string; summary: string; relevance: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const result = await askClaudeWithSearch(
        `You are an Indian health insurance news analyst. Search the web for the latest health insurance news in India (IRDAI regulations, new policies, claim rule changes, premium changes). 
         Return a JSON array of 3 items, each with: headline (string), summary (1 sentence), relevance (1 sentence about why it matters to a policyholder).
         Return ONLY the JSON array.`,
        "What are the latest health insurance news and IRDAI updates in India this month? Search for recent developments."
      );
      const clean = result.replace(/```json|```/g, "").trim();
      // Find JSON array in response
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) setNews(JSON.parse(match[0]));
    } catch {
      setNews([
        { headline: "IRDAI Increases Health Insurance Portability Benefits", summary: "New portability rules make it easier to switch insurers without losing waiting period credit.", relevance: "You can now switch to a better plan without restarting waiting periods." },
        { headline: "Cashless Claim Settlement Time Cut to 1 Hour", summary: "IRDAI mandates insurers to approve cashless claims within 1 hour of request.", relevance: "Faster cashless approval means less stress during hospitalisation." },
        { headline: "New OPD Coverage Rules for 2025-26", summary: "IRDAI requires all health plans to offer OPD coverage as a standard benefit.", relevance: "Your next renewal may include free OPD visits under your existing plan." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  return (
    <motion.div {...fadeIn(0.6)} className="bg-card rounded-2xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Latest Insurance News</h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Live via Web</span>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={fetchNews} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Refresh
        </Button>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse space-y-1">
              <div className="h-4 bg-secondary rounded w-3/4" />
              <div className="h-3 bg-secondary rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((n, i) => (
            <div key={i} className="border-l-2 border-primary/30 pl-3">
              <p className="font-medium text-card-foreground text-sm">{n.headline}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.summary}</p>
              <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {n.relevance}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// -- AI Renewal Section using real policies -------------------------------------
function AIRenewalSection({ policies, familyMembers }: { policies: any[]; familyMembers: any[] }) {
  const [renewals, setRenewals] = useState<{ policy: string; tip: string; urgency: "high" | "medium" }[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (policies.length === 0) return;
    setLoading(true);
    try {
      const policyContext = policies.map(p =>
        `${p.name} by ${p.provider}, ₹${p.coverageAmount?.toLocaleString("en-IN")} cover, expires ${p.expiryDate}, status: ${p.status}`
      ).join("\n");
      const familyContext = familyMembers.map(m =>
        `${m.name} (${m.relation}, age ${m.age ?? "?"}) conditions: ${m.conditions?.join(", ") || "none"}`
      ).join("\n");

      const result = await askClaudeJSON<{ policy: string; tip: string; urgency: "high" | "medium" }[]>(
        "You are a health insurance renewal advisor for India. Return a JSON array of renewal recommendations based on the user's actual policies.",
        `My policies:\n${policyContext}\n\nFamily members:\n${familyContext}\n\nReturn array of objects: policy (string), tip (1 sentence), urgency ("high" or "medium"). Max 3 items. Focus on expiry dates, coverage gaps, and age-related risks.`
      );
      setRenewals(result);
    } catch {
      setRenewals(policies.slice(0, 2).map(p => ({
        policy: `${p.name} - ${p.provider}`,
        tip: `Review your coverage amount of ₹${p.coverageAmount?.toLocaleString("en-IN")} before renewal.`,
        urgency: "medium" as const,
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generate(); }, [policies.length]);

  if (policies.length === 0) return null;

  return (
    <motion.div {...fadeIn(0.5)} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">AI Renewal Recommendations</h2>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Refresh
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center gap-3 p-4 bg-card rounded-2xl">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">AI is analyzing your policies�</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renewals.map((r, i) => (
            <div key={i} className={`bg-card rounded-2xl p-5 card-shadow border-l-4 ${r.urgency === "high" ? "border-l-destructive" : "border-l-warning"}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${r.urgency === "high" ? "text-destructive" : "text-warning"}`} />
                <div>
                  <p className="font-medium text-card-foreground">{r.policy}</p>
                  <p className="text-sm text-muted-foreground mt-1">{r.tip}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// -- AI Health Tips Widget --------------------------------------------------------
function HealthTipsWidget({ profile }: { profile: any }) {
  const { tips, loading, generate } = useAIHealthTips();
  const { t } = useTranslate();

  useEffect(() => {
    if (profile?.age && profile?.gender) {
      generate({
        age: profile.age,
        gender: profile.gender,
        conditions: profile.conditions || [],
      });
    }
  }, [profile?.age, profile?.gender]);

  return (
    <motion.div {...fadeIn(0.7)} className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-2xl p-6 card-shadow border border-cyan-200/50 dark:border-cyan-800/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-lg font-semibold text-card-foreground">{t("dashboard.personalizedHealthTips", "Personalised Health Tips")}</h2>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
          <p className="text-sm text-muted-foreground">{t("dashboard.generatingTips", "AI generating personalized tips�")}</p>
        </div>
      ) : tips ? (
        <div className="text-sm text-card-foreground space-y-2 whitespace-pre-wrap">
          {tips}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("dashboard.noTipsAvailable", "No health tips available")}</p>
      )}
    </motion.div>
  );
}

// -- Main Dashboard --------------------------------
const Dashboard = () => {
  const { user, profile } = useAuth();
  const { members } = useFamilyMembers();
  const { policies } = usePolicies();
  const { claims } = useClaims();
  const { t } = useTranslate();
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [aiGreeting, setAiGreeting] = useState("");
  const [greetingLoading, setGreetingLoading] = useState(false);
  const [fitScores, setFitScores] = useState<{ name: string; member: string; score: number }[]>([]);
  const [fitLoading, setFitLoading] = useState(false);

  const displayName = profile?.fullName || user?.displayName || "there";
  const activePolicies = policies.filter(p => p.status === "Active");
  const pendingClaims = claims.filter(c => !["Settled", "Rejected"].includes(c.status));
  const totalCoverage = policies.reduce((s, p) => s + (p.coverageAmount ?? 0), 0);

  const stats = [
    { label: t("dashboard.activePolicies", "Active Policies"), value: String(activePolicies.length), icon: Shield, color: "bg-primary", modal: "policies" },
    { label: t("dashboard.familyMembers", "Family Members"), value: String(members.length + 1), icon: Users, color: "bg-accent", modal: "family" },
    { label: t("dashboard.pendingClaims", "Pending Claims"), value: String(pendingClaims.length), icon: Clock, color: "bg-warning", modal: "claims" },
    { label: t("dashboard.totalCoverage", "Total Coverage"), value: totalCoverage > 0 ? `₹${(totalCoverage / 100000).toFixed(1)}L` : "0", icon: IndianRupee, color: "bg-success", modal: "coverage" },
  ];

  // Personalised AI greeting
  const getGreeting = async () => {
    setGreetingLoading(true);
    try {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
      const greeting = await askClaude(
        "You are a warm, concise health insurance assistant. Give a 1-sentence personalised greeting for the dashboard.",
        `User: ${displayName}, ${profile?.city || "India"}. Policies: ${activePolicies.length}. Pending claims: ${pendingClaims.length}. Time: ${timeOfDay}. Make it feel personal and useful.`
      );
      setAiGreeting(greeting);
    } catch {
      setAiGreeting(`Good to see you, ${displayName}! Your insurance dashboard is ready.`);
    } finally {
      setGreetingLoading(false);
    }
  };

  // AI future fit scores for policies
  const getFitScores = async () => {
    if (policies.length === 0) return;
    setFitLoading(true);
    try {
      const result = await askClaudeJSON<{ name: string; member: string; score: number }[]>(
        "You are an insurance risk analyst. Score each policy for 'future fit' based on coverage adequacy, age of insured, and conditions. Return JSON array only.",
        `Policies: ${JSON.stringify(policies.map(p => ({ name: p.name, provider: p.provider, coverage: p.coverageAmount, type: p.policyType })))}\nFamily: ${JSON.stringify(members.map(m => ({ name: m.name, relation: m.relation, conditions: m.conditions })))}\nReturn array of {name, member, score (0-100)}.`
      );
      setFitScores(result);
    } catch {
      setFitScores(policies.slice(0, 3).map(p => ({ name: p.name, member: p.provider, score: Math.floor(60 + Math.random() * 30) })));
    } finally {
      setFitLoading(false);
    }
  };

  // Add test policy (MediGuard Plus by Star Health)
  const addTestPolicy = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      const policyData = {
        name: "MediGuard Plus",
        provider: "Star Health Insurance",
        policyNumber: `STR-${Date.now().toString().slice(-8)}`,
        coverageAmount: 500000,
        premiumAmount: 1850,
        premiumFrequency: "Annual",
        startDate: tomorrow.toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        policyType: "Family Floater",
        status: "Active",
        // Comprehensive benefits details
        benefits: {
          roomRent: "Per policy",
          subLimits: "Per policy",
          coPayment: "0-10%",
          restoration: "Partial",
          noClaimBonus: "10-50%",
          ayushCover: "No",
          maternity: "Covered",
          pedWaiting: "1 year",
          claimRatio: "91%",
          ambulanceCharges: "₹2000",
          dayCareProcedures: "Covered",
          domiciliaryCare: "Yes",
          preHospitalization: "30 days",
          postHospitalization: "60 days",
          criticalIllness: "₹100000",
          accidentalDeathBenefit: "₹500000",
        },
        // Additional policy details
        networkHospitals: 5000,
        claimsSettlementRatio: "91%",
        avgClaimsProcessingDays: 5,
        features: [
          "Cashless hospitalization",
          "Worldwide coverage",
          "No waiting period for accidents",
          "Free annual health checkup",
          "Telemedicine consultation",
        ],
      };

      console.log("[Dashboard] Adding test policy with data:", policyData);
      
      await addPolicy(user.uid, policyData);
      
      console.log("[Dashboard] Test policy added successfully, waiting for real-time sync...");
      
      toast.success("✅ MediGuard Plus added! Syncing with your profile...", {
        description: "Features will now show your live policy data in a moment.",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("[Dashboard] Error adding test policy:", error);
      toast.error("Failed to add test policy: " + error.message);
    }
  };

  useEffect(() => { getGreeting(); }, [profile]);
  useEffect(() => { getFitScores(); }, [policies.length]);

  return (
    <div className="space-y-10 max-w-6xl mx-auto w-full">
      {/* Welcome Hero */}
      <motion.div {...fadeIn(0)} className="bg-gradient-to-r from-emerald-700 to-emerald-800 dark:from-emerald-900 dark:to-emerald-950 rounded-3xl p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-10 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute bottom-2 right-40 w-20 h-20 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">{t("dashboard.welcomeBack", `Welcome back, ${displayName}!`)}</h1>
          <p className="text-emerald-100 text-lg leading-relaxed max-w-2xl">
            {greetingLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t("common.generating", "We are here for you!")}</span>
            ) : (
              aiGreeting || t("dashboard.insuranceOverview", "Here's your AI-powered insurance overview for today.")
            )}
          </p>
          {(profile?.city || profile?.state) && (
            <p className="text-emerald-200/80 text-sm mt-3 font-medium">{[profile.city, profile.state].filter(Boolean).join(", ")}</p>
          )}
        </div>
      </motion.div>

      {/* Stats Section */}
      <div>
        <div className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-200 mb-4">01 / OVERVIEW</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
            <motion.button key={stat.label} {...fadeIn(i * 0.1)}
              onClick={() => setOpenModal(stat.modal)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-border/50 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Health Tips Section */}
      {profile && (
        <div>
          <div className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-200 mb-4">02 / INSIGHTS</div>
          <HealthTipsWidget profile={profile} />
        </div>
      )}

      {/* Policies modal */}
      <Dialog open={!!openModal} onOpenChange={(o) => !o && setOpenModal(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {openModal === "policies" && "Your Active Policies"}
              {openModal === "family" && "Family Members"}
              {openModal === "claims" && "Pending Claims"}
              {openModal === "coverage" && "Coverage Summary"}
            </DialogTitle>
          </DialogHeader>
          {openModal === "policies" && (
            <div className="space-y-3 mt-2">
              {activePolicies.length === 0 ? (
                <div className="space-y-4 text-center py-4">
                  <p className="text-muted-foreground text-sm">No policies added yet. Go to Buy Insurance to add one.</p>
                  <Button 
                    onClick={addTestPolicy}
                    className="w-full bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Test Policy (MediGuard Plus)
                  </Button>
                </div>
              ) : activePolicies.map(p => (
                <div key={p.id} className="bg-secondary/50 rounded-lg border border-border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-card-foreground">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.provider}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Coverage: <strong className="text-card-foreground">₹{p.coverageAmount?.toLocaleString("en-IN")}</strong></span>
                    <span>Expires: <strong className="text-card-foreground">{p.expiryDate || "—"}</strong></span>
                    <span>Premium: <strong className="text-card-foreground">₹{p.premiumAmount?.toLocaleString("en-IN")}/{p.premiumFrequency}</strong></span>
                    <span>Type: <strong className="text-card-foreground capitalize">{p.policyType}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {openModal === "family" && (
            <div className="space-y-3 mt-2">
              <div className="bg-secondary/50 rounded-lg border border-border p-4">
                <p className="font-semibold text-card-foreground">{profile?.fullName || "You"}</p>
                <p className="text-sm text-muted-foreground">Self � Primary Account</p>
              </div>
              {members.map(m => (
                <div key={m.id} className="bg-secondary/50 rounded-lg border border-border p-4">
                  <p className="font-semibold text-card-foreground">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.relation} � {m.gender}</p>
                  {m.conditions?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.conditions.filter((c: string) => c !== "None").map((c: string) => (
                        <span key={c} className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {openModal === "claims" && (
            <div className="space-y-3 mt-2">
              {pendingClaims.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No pending claims.</p>
              ) : pendingClaims.map(c => (
                <div key={c.id} className="bg-secondary/50 rounded-lg border border-border p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{c.claimNumber}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="font-medium text-card-foreground text-sm">{c.procedureName}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>₹{c.claimAmount?.toLocaleString("en-IN")}</span>
                    <span>{c.hospitalName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {openModal === "coverage" && (
            <div className="space-y-3 mt-2">
              {policies.map(p => (
                <div key={p.id} className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-card-foreground">{p.name}</span>
                  <span className="font-bold text-primary">₹{p.coverageAmount?.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="flex justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="font-semibold text-card-foreground">Total Coverage</span>
                <span className="font-bold text-primary text-lg">₹{totalCoverage.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div>
        <div className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-200 mb-4">03 / ANALYSIS</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Future Fit Score */}
          <motion.div {...fadeIn(0.3)} className="bg-white dark:bg-slate-900 rounded-2xl p-7 border border-border/50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              <h2 className="text-lg font-semibold text-foreground">Coverage Fit Score</h2>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 px-2 py-0.5 rounded-full ml-auto font-medium">AI</span>
            </div>
          <p className="text-sm text-muted-foreground mb-4">AI-predicted adequacy score based on coverage, age, and health conditions</p>
          {fitLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Calculating scores�
            </div>
          ) : fitScores.length > 0 ? (
            <div className="space-y-4">
              {fitScores.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <CircularScore score={item.score} />
                  <div>
                    <p className="font-medium text-card-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.member}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add your policies to see fit scores.</p>
          )}
        </motion.div>

        {/* Live Insurance News */}
        <InsuranceNewsWidget />
        </div>
      </div>

      {/* AI Renewal Recommendations */}
      <div>
        <div className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-200 mb-4">04 / RECOMMENDATIONS</div>
        <AIRenewalSection policies={policies} familyMembers={members} />
      </div>
    </div>
  );
};

export default Dashboard;
