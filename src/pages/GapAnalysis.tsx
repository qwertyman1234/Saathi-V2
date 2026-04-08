import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, ArrowRight, UserCircle, Sparkles, Loader2, RefreshCw, Globe, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIGapAnalysis } from "@/hooks/useAIFeatures";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyMembers, usePolicies } from "@/hooks/useUserData";
import { askClaudeJSON, askClaudeWithSearch } from "@/lib/claude";
import ReactMarkdown from "react-markdown";
import { RevealHiddenThings } from "@/components/RevealHiddenThings";

type Gap = {
  title: string;
  member: string;
  severity: "high" | "medium" | "low";
  description: string;
  recommendation: string;
};

const GapAnalysis = () => {
  const { profile } = useAuth();
  const { members } = useFamilyMembers();
  const { policies } = usePolicies();
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<Record<string, string>>({});
  const [marketInsight, setMarketInsight] = useState("");
  const [marketLoading, setMarketLoading] = useState(false);
  const { analysis, analyze, loading: analysisLoading } = useAIGapAnalysis();

  const buildContext = () => {
    const name = profile?.fullName || "User";
    const city = profile?.city || "India";
    const memberList = [
      `${name} (Self, ${profile?.city || ""}${profile?.incomeRange ? ", income " + profile.incomeRange : ""})`,
      ...members.map(m => `${m.name} (${m.relation}${m.conditions?.filter((c: string) => c !== "None").length ? ", conditions: " + m.conditions.filter((c: string) => c !== "None").join(", ") : ""})`),
    ].join("\n");
    const policyList = policies.length > 0
      ? policies.map(p => `${p.name} by ${p.provider}, ₹${p.coverageAmount?.toLocaleString("en-IN")} cover, expires ${p.expiryDate}`).join("\n")
      : "No policies added yet.";
    return { name, city, memberList, policyList };
  };

  const analyzeGaps = async () => {
    setLoading(true);
    setGaps([]);
    const ctx = buildContext();
    try {
      const result = await askClaudeJSON<Gap[]>(
        `You are a health insurance gap analyst for India. Analyze the user's actual family and policies.
         Each gap: title, member, severity ("high"|"medium"|"low"), description (2 sentences), recommendation (1 actionable sentence).
         Return ONLY the JSON array.`,
        `Family:\n${ctx.memberList}\n\nPolicies:\n${ctx.policyList}\n\nCity: ${ctx.city}\n\nIdentify 4-5 real coverage gaps specific to this family. Be precise.`
      );
      setGaps(result);
    } catch {
      setGaps([{
        title: "Add Your Policies First",
        member: ctx.name,
        severity: "high",
        description: "We need your policy details to analyse coverage gaps accurately. Please add your policies via the Buy Insurance section.",
        recommendation: "Go to Buy Insurance → add your active health insurance policies."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getMarketInsight = async () => {
    setMarketLoading(true);
    const ctx = buildContext();
    try {
      const insight = await askClaudeWithSearch(
        "You are an Indian health insurance market analyst. Search for latest coverage recommendations and IRDAI guidelines relevant to the user's profile. Give a 2-3 sentence market insight.",
        `User in ${ctx.city}. Family size: ${members.length + 1}. Current coverage: ${ctx.policyList}. What does the latest IRDAI guidance and Indian health insurance market say about adequate coverage for this profile?`
      );
      setMarketInsight(insight);
    } catch {
      setMarketInsight("Based on current IRDAI guidelines, a family of this size should have minimum ₹5L per member in individual cover plus a floater top-up. Check irdai.gov.in for latest regulations.");
    } finally {
      setMarketLoading(false);
    }
  };

  const getFixAdvice = async (gap: Gap) => {
    setActionLoading(gap.title);
    try {
      const advice = await askClaudeWithSearch(
        "You are an Indian health insurance advisor. Search for the latest plans and pricing to fix this gap. Return a JSON object with: steps (array of 3 strings), estimatedCost (string), urgency (string), suggestedPlan (string). Return ONLY JSON.",
        `Fix this insurance gap:\nGap: ${gap.title}\nMember: ${gap.member}\nIssue: ${gap.description}\nCity: ${buildContext().city}\nSearch for specific Indian insurance products that address this gap.`
      );
      const clean = advice.replace(/```json|```/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setActionResult(prev => ({
          ...prev,
          [gap.title]: `**Plan:** ${parsed.suggestedPlan || "—"}\n**Steps:** ${parsed.steps?.join(" → ") || gap.recommendation}\n**Est. Cost:** ${parsed.estimatedCost || "—"}\n**Urgency:** ${parsed.urgency || "—"}`
        }));
      }
    } catch {
      setActionResult(prev => ({ ...prev, [gap.title]: gap.recommendation }));
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    console.log("[GapAnalysis] Policies loaded:", policies.length, "policies", policies);
    console.log("[GapAnalysis] Members loaded:", members.length, "members");
    console.log("[GapAnalysis] Profile loaded:", profile?.fullName);
    if (policies.length > 0 || members.length > 0 || profile) {
      console.log("[GapAnalysis] Triggering analyzeGaps and getMarketInsight");
      analyzeGaps();
      getMarketInsight();
    }
  }, [policies.length, members.length, profile?.userId]);

  // Generate AI analysis when gaps are found
  useEffect(() => {
    if (gaps.length > 0) {
      const ctx = buildContext();
      const coverage = policies.map(p => p.policyType || "general");
      const age = profile?.age || 35;
      const familySize = members.length + 1;
      analyze(coverage, age, familySize);
    }
  }, [gaps.length]);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Insurance Gap Analysis</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-primary" /> Analysing your actual family profile with live market data
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={analyzeGaps} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Re-analyze
        </Button>
      </div>

      {/* Live Market Insight */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-primary">Live Market Insight</span>
          {marketLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>
        {marketInsight
          ? <p className="text-sm text-muted-foreground">{marketInsight}</p>
          : <p className="text-sm text-muted-foreground italic">Fetching latest IRDAI guidelines and market data…</p>}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card rounded-lg p-5 card-shadow animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4 mb-3" />
              <div className="h-3 bg-secondary rounded w-1/2 mb-2" />
              <div className="h-3 bg-secondary rounded w-full" />
            </div>
          ))}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            AI is analysing your actual family profile and coverage…
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
          {gaps.map((gap, i) => (
            <motion.div key={gap.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className={`bg-card rounded-lg p-5 card-shadow border-l-4 ${
                gap.severity === "high" ? "border-l-destructive" : gap.severity === "medium" ? "border-l-warning" : "border-l-accent"
              }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {gap.severity === "high"
                      ? <ShieldAlert className="h-5 w-5 text-destructive" />
                      : <AlertTriangle className="h-5 w-5 text-warning" />}
                    <h3 className="font-semibold text-card-foreground">{gap.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      gap.severity === "high" ? "bg-destructive/10 text-destructive" :
                      gap.severity === "medium" ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"
                    }`}>{gap.severity.toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                    <UserCircle className="h-3 w-3" /> {gap.member}
                  </p>
                  <p className="text-sm text-card-foreground mb-2">{gap.description}</p>
                  {actionResult[gap.title] ? (
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs">
                      <div className="prose prose-xs dark:prose-invert max-w-none">
                        <ReactMarkdown>{actionResult[gap.title]}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">💡 {gap.recommendation}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="ml-4 gap-1 flex-shrink-0"
                  onClick={() => getFixAdvice(gap)} disabled={actionLoading === gap.title}>
                  {actionLoading === gap.title
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <><Globe className="h-3 w-3" /> Fix This</>}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Synthesis of all gaps */}
        {analysis && gaps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-700 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-200">AI Gap Analysis Summary</h3>
              {analysisLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto text-purple-600" />}
            </div>
            <p className="text-sm text-purple-900 dark:text-purple-200 whitespace-pre-wrap">{analysis}</p>
          </motion.div>
        )}

        {/* Reveal Hidden Things in current policies */}
        {policies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100">Check Your Current Policies</h3>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
              Your existing policies may have hidden restrictions or exclusions that contribute to coverage gaps. Let AI reveal what's hidden.
            </p>
            <div className="flex flex-wrap gap-2">
              {policies.map(policy => (
                <div key={policy.id} className="flex-1 min-w-[200px]">
                  <RevealHiddenThings 
                    policyDetails={{
                      name: policy.name,
                      provider: policy.provider,
                      coverage: policy.coverageAmount,
                      premium: policy.premiumAmount,
                      features: policy.features,
                    }}
                    buttonText={`🔍 ${policy.name}`}
                    buttonVariant="outline"
                    className="w-full text-xs"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
        </>
      )}
    </div>
  );
};

export default GapAnalysis;
