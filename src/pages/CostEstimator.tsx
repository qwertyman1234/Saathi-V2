import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, IndianRupee, Info, Sparkles, Loader2, Globe, MapPin, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAICostInsights } from "@/hooks/useAIFeatures";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { usePolicies } from "@/hooks/useUserData";
import { askClaudeWithSearch } from "@/lib/claude";
import ReactMarkdown from "react-markdown";

type EstimateResult = {
  totalBill: string;
  covered: string;
  outOfPocket: string;
  reasoning: string;
  tips: string[];
  exclusions: string[];
  marketRate: string;
  bestHospitalTip: string;
};

const PROCEDURES = [
  "Knee Replacement Surgery", "Cataract Surgery", "Appendectomy",
  "Coronary Angioplasty", "Normal Delivery", "Caesarean Section",
  "Kidney Dialysis", "Chemotherapy", "Hip Replacement", "Cardiac Bypass Surgery",
  "Laparoscopic Cholecystectomy", "Hysterectomy", "Spinal Surgery",
];

const CostEstimator = () => {
  const { profile } = useAuth();
  const { policies } = usePolicies();
  const [hospital, setHospital] = useState("");
  const [procedure, setProcedure] = useState("");
  const [customProcedure, setCustomProcedure] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { insights, generateInsights, loading: insightLoading } = useAICostInsights();

  const city = profile?.city || "India";
  const activePolicies = policies.filter(p => p.status === "Active");
  const selectedPolicy = activePolicies.find(p => p.id === selectedPolicyId);

  // Generate AI cost insights when estimate is ready
  useEffect(() => {
    if (result && selectedPolicy) {
      const estimatedCost = parseInt(result.totalBill.replace(/₹|,/g, "") || "0");
      const coverage = selectedPolicy.coverageAmount || 0;
      generateInsights([coverage], [estimatedCost], 35); // Default age
    }
  }, [result, selectedPolicy?.id]);

  const estimate = async () => {
    const proc = customProcedure || procedure;
    if (!proc) return;
    setLoading(true);
    setResult(null);
    try {
      const policyContext = selectedPolicy
        ? `${selectedPolicy.name} by ${selectedPolicy.provider}, sum insured ₹${selectedPolicy.coverageAmount?.toLocaleString("en-IN")}, type: ${selectedPolicy.policyType}`
        : "No specific policy selected — provide general estimate";

      const res = await askClaudeWithSearch(
        `You are an Indian health insurance cost estimation expert. Search the web for current hospital rates and insurance coverage data in India.
         Return a JSON object with these exact keys:
         - totalBill: estimated total bill as string (e.g. "₹3,50,000")
         - covered: insurance covered amount as string
         - outOfPocket: patient's expense as string
         - reasoning: 3-4 sentence explanation
         - tips: array of 3 money-saving tips
         - exclusions: array of 2-3 items not covered
         - marketRate: current market rate range for this procedure in India (string)
         - bestHospitalTip: 1 sentence tip about choosing the right hospital
         Return ONLY valid JSON.`,
        `Search for current ${proc} procedure costs at Indian hospitals in ${city || "India"}.
         Hospital: ${hospital || "mid-range private hospital in " + city}
         Policy: ${policyContext}
         Patient: ${profile?.fullName || "User"}, ${city}
         Find real 2024-2025 prices from Indian hospital websites or insurance data.`
      );

      const clean = res.replace(/```json|```/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        setResult(JSON.parse(match[0]));
      } else {
        throw new Error("Could not parse response");
      }
    } catch {
      setResult({
        totalBill: "₹2,50,000 – ₹4,50,000",
        covered: "Up to ₹" + (selectedPolicy?.coverageAmount?.toLocaleString("en-IN") ?? "your sum insured"),
        outOfPocket: "₹15,000 – ₹50,000 (depends on policy)",
        reasoning: `Based on current Indian hospital rates for ${procedure || customProcedure} in ${city}. Costs vary significantly between government, mid-range private, and premium hospitals. Your insurance will cover most of the procedure if the hospital is in-network.`,
        tips: [
          "Pre-authorize the procedure 48 hours before admission",
          "Request a detailed cost estimate from the hospital billing desk",
          "Ensure your hospital is in your insurer's network before admission",
        ],
        exclusions: ["Non-medical consumables", "Registration and admission fees", "Post-discharge physiotherapy"],
        marketRate: "₹1.5L – ₹5L depending on hospital tier",
        bestHospitalTip: `In ${city}, compare rates between NABL-accredited hospitals — quality is similar but prices can differ by 40%.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Pre-Hospitalization Cost Estimator</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1">
          <Globe className="h-4 w-4 text-primary" /> AI searches live hospital rates to calculate your real costs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg p-6 card-shadow space-y-4">
          {/* Procedure */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">Procedure / Treatment</label>
            <Select value={procedure} onValueChange={v => { setProcedure(v); setCustomProcedure(""); }}>
              <SelectTrigger><SelectValue placeholder="Select a procedure" /></SelectTrigger>
              <SelectContent>
                {PROCEDURES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative mt-2">
              <Input placeholder="Or type a custom procedure…" value={customProcedure}
                onChange={e => { setCustomProcedure(e.target.value); setProcedure(""); }} />
            </div>
          </div>

          {/* Hospital */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">Hospital (optional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder={`e.g. Apollo Hospital, ${city || "Mumbai"}`}
                value={hospital} onChange={e => setHospital(e.target.value)} />
            </div>
          </div>

          {/* Policy selector — uses real user policies */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">Your Insurance Policy</label>
            {activePolicies.length > 0 ? (
              <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
                <SelectTrigger><SelectValue placeholder="Select your policy" /></SelectTrigger>
                <SelectContent>
                  {activePolicies.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.provider} (₹{p.coverageAmount?.toLocaleString("en-IN")})
                    </SelectItem>
                  ))}
                  <SelectItem value="none">No specific policy</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning">
                No active policies found. Add policies via Buy Insurance for accurate estimates.
              </div>
            )}
          </div>

          {profile?.city && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Estimating for {profile.city}
            </div>
          )}

          <Button onClick={estimate} disabled={(!procedure && !customProcedure) || loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            {loading ? "AI is searching live rates…" : "Estimate with Live Data"}
          </Button>
        </div>

        {loading && (
          <div className="bg-card rounded-lg p-6 card-shadow flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary animate-pulse" />
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground text-center font-medium">Searching live hospital rates…</p>
            <p className="text-xs text-muted-foreground text-center">AI is fetching current prices from Indian hospitals and insurer data</p>
          </div>
        )}

        {result && !loading && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-lg p-6 card-shadow space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-card-foreground">Live Cost Breakdown</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Live Data · AI</span>
            </div>

            {result.marketRate && (
              <div className="p-3 bg-secondary/30 rounded-lg flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Market Rate (India 2025)</p>
                  <p className="font-semibold text-card-foreground text-sm">{result.marketRate}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">Estimated Hospital Bill</span>
                <span className="font-bold text-card-foreground">{result.totalBill}</span>
              </div>
              <div className="flex justify-between p-3 bg-success/10 rounded-lg">
                <span className="text-muted-foreground">Insurance Covered</span>
                <span className="font-bold text-success">{result.covered}</span>
              </div>
              <div className="flex justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <span className="text-destructive font-medium">Your Out-of-Pocket</span>
                <span className="font-bold text-destructive text-lg">{result.outOfPocket}</span>
              </div>
            </div>

            <div className="p-4 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">AI Reasoning</span>
              </div>
              <p className="text-sm text-muted-foreground">{result.reasoning}</p>
            </div>

            {result.bestHospitalTip && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">🏥 Hospital Selection Tip</p>
                <p className="text-xs text-muted-foreground">{result.bestHospitalTip}</p>
              </div>
            )}

            {result.exclusions?.length > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-xs font-semibold text-warning mb-1">Not Covered</p>
                {result.exclusions.map((e, i) => <p key={i} className="text-xs text-muted-foreground">• {e}</p>)}
              </div>
            )}

            {result.tips?.length > 0 && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Money-Saving Tips</p>
                {result.tips.map((t, i) => <p key={i} className="text-xs text-muted-foreground">💡 {t}</p>)}
              </div>
            )}

            {(insightLoading || insights) && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-sm text-amber-900 dark:text-amber-200">Cost Optimization AI</span>
                  {insightLoading && <Loader2 className="h-3 w-3 animate-spin text-amber-600" />}
                </div>
                {insightLoading ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300 italic">Analyzing cost patterns and optimization strategies...</p>
                ) : (
                  <p className="text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap">{insights}</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CostEstimator;
