import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star, Check, Sparkles, Loader2, Users, User, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { type InsurancePlan } from "@/data/insurancePlans";
import { useInsurancePlans } from "@/hooks/useInsurancePlans";
import type { Preferences } from "./StepPreferences";
import type { HealthInsuranceFormData } from "./HealthInsuranceForm";
import { askClaudeJSON } from "@/lib/claude";
import ReactMarkdown from "react-markdown";

interface Props {
  prefs: Preferences;
  formData: HealthInsuranceFormData | null;
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

type SortKey = "premium" | "coverage" | "rating" | "claimRatio" | "ai" | "health";

interface HealthRecommendation {
  ranking: string[];
  verdict: string;
  planType: "family" | "individual";
  typeReason: string;
  healthFocus: string;
}

const fadeVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const StepComparePlans = ({ prefs, formData, selectedPlanId, onSelectPlan, onNext, onBack }: Props) => {
  const { plans: insurancePlans } = useInsurancePlans();
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [aiVerdict, setAiVerdict] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRanking, setAiRanking] = useState<string[]>([]);
  const [healthRecommendation, setHealthRecommendation] = useState<HealthRecommendation | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const filtered = useMemo(() => {
    let results = insurancePlans.filter(p =>
      p.premium <= prefs.maxPremium &&
      p.coverage >= prefs.minCoverage &&
      p.pedWait <= prefs.maxPedWait
    );

    if (prefs.selectedFeatures.length > 0) {
      results = results.sort((a, b) => {
        const aMatch = a.features.filter(f => prefs.selectedFeatures.some(sf => f.toLowerCase().includes(sf.toLowerCase()))).length;
        const bMatch = b.features.filter(f => prefs.selectedFeatures.some(sf => f.toLowerCase().includes(sf.toLowerCase()))).length;
        return bMatch - aMatch;
      });
    }

    if ((sortBy === "ai" || sortBy === "health") && aiRanking.length > 0) {
      results = [...results].sort((a, b) => {
        const aIdx = aiRanking.indexOf(a.id);
        const bIdx = aiRanking.indexOf(b.id);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    } else {
      results = [...results].sort((a, b) => {
        switch (sortBy) {
          case "premium": return a.premium - b.premium;
          case "coverage": return b.coverage - a.coverage;
          case "rating": return b.rating - a.rating;
          case "claimRatio": return b.claimRatio - a.claimRatio;
          default: return 0;
        }
      });
    }

    return results;
  }, [prefs, sortBy, aiRanking]);

  const getAIRecommendation = async () => {
    setAiLoading(true);
    setAiVerdict("");
    try {
      const planSummaries = insurancePlans.slice(0, 6).map(p =>
        `ID: ${p.id}, Name: ${p.name} by ${p.insurer}, Premium: ₹${p.premium}/mo, Coverage: ${p.coverageLabel}, PED Wait: ${p.pedWait} yrs, Claim Ratio: ${p.claimRatio}%, Features: ${p.features.join(", ")}`
      ).join("\n");

      const result = await askClaudeJSON<{ ranking: string[]; verdict: string }>(
        `You are an AI health insurance advisor for India. Rank the plans for this user and return JSON with:
         - ranking: array of plan IDs in order of recommendation (best first)
         - verdict: 2-3 sentence markdown explanation of your top pick and why
         Return ONLY valid JSON.`,
        `User preferences:
         Max premium: ₹${prefs.maxPremium}/month
         Min coverage: ₹${prefs.minCoverage.toLocaleString()}
         Max PED wait: ${prefs.maxPedWait} years
         Important features: ${prefs.selectedFeatures.join(", ") || "None specified"}
         
         Available plans:
         ${planSummaries}`
      );
      setAiRanking(result.ranking);
      setAiVerdict(result.verdict);
      setSortBy("ai");
    } catch {
      setAiVerdict("Based on your preferences, I recommend prioritizing plans with high claim settlement ratios and no room rent capping. Consider Optima Restore or Health Guard Gold for best value.");
    } finally {
      setAiLoading(false);
    }
  };

  const getHealthBasedRecommendation = async () => {
    if (!formData) return;
    
    setHealthLoading(true);
    setHealthRecommendation(null);
    try {
      const planSummaries = insurancePlans.map(p =>
        `ID: ${p.id}, Name: ${p.name} by ${p.insurer}, Premium: ₹${p.premium}/mo, Coverage: ${p.coverageLabel}, PED Wait: ${p.pedWait} yrs, Claim Ratio: ${p.claimRatio}%, Features: ${p.features.join(", ")}`
      ).join("\n");

      const isFamilyCoverage = formData.coverageType === "family";
      const dependentAges = formData.dependentAges ? formData.dependentAges.split(",").map(a => parseInt(a.trim())).filter(a => !isNaN(a)) : [];
      const hasConditions = formData.hasPreExistingConditions;

      const result = await askClaudeJSON<HealthRecommendation>(
        `You are an expert AI health insurance advisor for India. Analyze this user's health profile and provide personalized recommendations.
         Return ONLY valid JSON with:
         - ranking: array of TOP 5 plan IDs in order of recommendation (best first)
         - verdict: 2-3 sentence markdown explanation of the top pick based on their health
         - planType: "family" or "individual" 
         - typeReason: 1 sentence markdown explanation for family vs individual (e.g., "Family floater recommended because multiple family members have pre-existing conditions")
         - healthFocus: 1 sentence about what health aspects to prioritize`,
        `User Health Profile:
         Age: ${formData.age} years
         Gender: ${formData.gender}
         BMI: ${formData.bmi} (${formData.bmi < 18.5 ? "Underweight" : formData.bmi < 25 ? "Normal" : formData.bmi < 30 ? "Overweight" : "Obese"})
         Blood Pressure: ${formData.systolicBP}/${formData.diastolicBP} mmHg
         Smoker: ${formData.isSmoker ? `Yes (${formData.smokerFrequency})` : "No"}
         Alcohol: ${formData.alcoholConsumption}
         Pre-existing Conditions: ${hasConditions ? formData.preExistingConditions.join(", ") : "None"}
         Condition Details: ${formData.conditionDetails || "N/A"}
         
         Family Coverage:
         Type: ${isFamilyCoverage ? "Family" : "Individual"}
         ${isFamilyCoverage ? `Number of Dependents: ${dependentAges.length}\nDependent Ages: ${formData.dependentAges}` : ""}
         
         Coverage Preferences:
         Desired Coverage: ₹${formData.desiredSumInsured} Lakhs
         Budget: ₹${prefs.maxPremium}/month
         Max PED Wait: ${prefs.maxPedWait} years
         
         Available Plans:
         ${planSummaries}`
      );
      setHealthRecommendation(result);
      setAiRanking(result.ranking);
      setSortBy("health");
    } catch (error) {
      console.error("Error getting health recommendation:", error);
      setHealthRecommendation({
        ranking: ["mediguard-plus", "wellnessfirst-gold", "familycare-pro"],
        verdict: "Based on your health profile, prioritize plans with strong pre-existing disease coverage and high claim settlement ratios.",
        planType: formData.coverageType === "family" ? "family" : "individual",
        typeReason: formData.coverageType === "family" ? "Family floater provides better cost coverage for multiple family members" : "Individual plan offers personalized coverage for your specific needs",
        healthFocus: "Look for plans with quick PED coverage and comprehensive health benefits"
      });
      setAiRanking(["mediguard-plus", "wellnessfirst-gold", "familycare-pro"]);
      setSortBy("health");
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <motion.div key="step-compare" {...fadeVariants} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Compare Plans</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} plans match your criteria</p>
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {formData && <SelectItem value="health">🏥 Health Analysis</SelectItem>}
            <SelectItem value="ai">🤖 AI Ranked</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="premium">Premium (Low)</SelectItem>
            <SelectItem value="coverage">Coverage (High)</SelectItem>
            <SelectItem value="claimRatio">Claim Ratio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Health-Based Recommendation */}
      {formData && (
        <div className="mb-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm text-emerald-900 dark:text-emerald-100 flex items-center gap-1 font-medium">
                  Personalized Health Analysis
                </span>
                <p className="text-xs text-emerald-700 dark:text-emerald-200 mt-0.5">Get AI recommendation based on your health profile</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={getHealthBasedRecommendation} disabled={healthLoading} className="gap-1 h-7 text-xs">
              {healthLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {healthLoading ? "Analyzing…" : "Analyze Health"}
            </Button>
          </div>
          {healthRecommendation && (
            <div className="mt-4 space-y-3">
              {/* Plan Type Recommendation */}
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
                <div className="flex items-center gap-2 mb-1">
                  {healthRecommendation.planType === "family" ? (
                    <Users className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <User className="h-4 w-4 text-emerald-600" />
                  )}
                  <p className="text-xs font-semibold text-foreground">
                    Recommended: {healthRecommendation.planType === "family" ? "Family Floater Plan" : "Individual Plan"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {healthRecommendation.typeReason}
                </p>
              </div>

              {/* Health Focus */}
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  <span className="font-semibold text-foreground">Health Priority:</span> {healthRecommendation.healthFocus}
                </p>
              </div>

              {/* AI Verdict */}
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{healthRecommendation.verdict}</ReactMarkdown>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Recommendation Button */}
      <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-primary flex items-center gap-1 font-medium">
            <Sparkles className="h-4 w-4" /> AI Plan Recommendation
          </span>
          <Button size="sm" variant="outline" onClick={getAIRecommendation} disabled={aiLoading} className="gap-1 h-7 text-xs">
            {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {aiLoading ? "Analyzing…" : "Get AI Pick"}
          </Button>
        </div>
        {aiVerdict && (
          <div className="mt-2 text-xs text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{aiVerdict}</ReactMarkdown>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg card-shadow">
          <p className="text-muted-foreground">No plans match your criteria. Try adjusting your preferences.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {filtered.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlanId === plan.id}
              onClick={() => onSelectPlan(plan.id)}
              aiRank={(sortBy === "ai" || sortBy === "health") && aiRanking.length > 0 ? idx + 1 : undefined}
              isHealthRanked={sortBy === "health"}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={onNext} disabled={!selectedPlanId}>
          Review & Purchase
        </Button>
      </div>
    </motion.div>
  );
};

const PlanCard = ({ plan, selected, onClick, aiRank, isHealthRanked }: { plan: InsurancePlan; selected: boolean; onClick: () => void; aiRank?: number; isHealthRanked?: boolean }) => (
  <Card
    className={`cursor-pointer transition-all hover:shadow-md relative ${selected ? "ring-2 ring-primary" : ""} ${aiRank === 1 ? (isHealthRanked ? "border-emerald-400/40" : "border-primary/40") : ""}`}
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground text-sm truncate">{plan.name}</h3>
            <Badge className={`${plan.badgeColor} text-[10px] px-1.5 py-0 border-0 shrink-0`}>{plan.badge}</Badge>
            {aiRank && aiRank <= 3 && (
              <Badge className={`text-[10px] px-1.5 py-0 border-0 shrink-0 ${aiRank === 1 ? (isHealthRanked ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground") : "bg-secondary text-secondary-foreground"}`}>
                {isHealthRanked ? "🏥" : "🤖"} #{aiRank}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{plan.insurer}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {plan.features.map(f => (
              <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{f}</span>
            ))}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-extrabold text-foreground">₹{plan.premium.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">/month</p>
          <div className="flex items-center gap-0.5 justify-end mt-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-foreground">{plan.rating}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
        <span>Coverage: <strong className="text-foreground">{plan.coverageLabel}</strong></span>
        <span>PED Wait: <strong className="text-foreground">{plan.pedWait} yr{plan.pedWait !== 1 ? "s" : ""}</strong></span>
        <span>Claim: <strong className="text-foreground">{plan.claimRatio}%</strong></span>
      </div>

      {selected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export default StepComparePlans;
