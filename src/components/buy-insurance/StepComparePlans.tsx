import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star, Check, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { insurancePlans, type InsurancePlan } from "@/data/insurancePlans";
import type { Preferences } from "./StepPreferences";
import { askClaudeJSON } from "@/lib/claude";
import ReactMarkdown from "react-markdown";

interface Props {
  prefs: Preferences;
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

type SortKey = "premium" | "coverage" | "rating" | "claimRatio" | "ai";

const fadeVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const StepComparePlans = ({ prefs, selectedPlanId, onSelectPlan, onNext, onBack }: Props) => {
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [aiVerdict, setAiVerdict] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRanking, setAiRanking] = useState<string[]>([]);

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

    if (sortBy === "ai" && aiRanking.length > 0) {
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
            <SelectItem value="ai">🤖 AI Ranked</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="premium">Premium (Low)</SelectItem>
            <SelectItem value="coverage">Coverage (High)</SelectItem>
            <SelectItem value="claimRatio">Claim Ratio</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
              aiRank={sortBy === "ai" && aiRanking.length > 0 ? idx + 1 : undefined}
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

const PlanCard = ({ plan, selected, onClick, aiRank }: { plan: InsurancePlan; selected: boolean; onClick: () => void; aiRank?: number }) => (
  <Card
    className={`cursor-pointer transition-all hover:shadow-md relative ${selected ? "ring-2 ring-primary" : ""} ${aiRank === 1 ? "border-primary/40" : ""}`}
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground text-sm truncate">{plan.name}</h3>
            <Badge className={`${plan.badgeColor} text-[10px] px-1.5 py-0 border-0 shrink-0`}>{plan.badge}</Badge>
            {aiRank && aiRank <= 3 && (
              <Badge className={`text-[10px] px-1.5 py-0 border-0 shrink-0 ${aiRank === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                🤖 #{aiRank} AI
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
