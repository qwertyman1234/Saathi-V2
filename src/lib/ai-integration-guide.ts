/**
 * AI Integration Examples & Guide
 * 
 * This file provides example code snippets showing how to integrate
 * the free AI service from `/src/lib/aiService.ts` into your React components.
 * 
 * All examples use the hooks from `/src/hooks/useAIFeatures.ts`
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Gap Analysis Page
// ═══════════════════════════════════════════════════════════════════════════════

/*
import { useEffect } from "react";
import { useAIGapAnalysis } from "@/hooks/useAIFeatures";
import { useAuth } from "@/contexts/AuthContext";

export function GapAnalysisWithAI() {
  const { profile } = useAuth();
  const { analysis, loading, error, analyze } = useAIGapAnalysis();

  useEffect(() => {
    if (profile?.age && profile?.city) {
      // Call analyze with coverage types, age, and family size
      analyze(
        ["hospitalization", "maternity"],  // Current coverage types
        profile.age,
        3  // Family size
      );
    }
  }, [profile?.age, profile?.city]);

  if (loading) return <div>Analyzing coverage gaps with AI...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Coverage Gaps</h2>
      <p>{analysis}</p>
    </div>
  );
}
*/

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Compare Policies Page
// ═══════════════════════════════════════════════════════════════════════════════

/*
import { useAIPolicyComparison } from "@/hooks/useAIFeatures";
import { Button } from "@/components/ui/button";

export function ComparePoliciesWithAI() {
  const { comparison, loading, error, compare } = useAIPolicyComparison();
  const [selectedPlans, setSelectedPlans] = useState([]);

  const handleCompare = async () => {
    if (selectedPlans.length === 2) {
      await compare(selectedPlans[0], selectedPlans[1]);
    }
  };

  return (
    <div>
      <h2>Policy Comparison (AI Powered)</h2>
      <Button onClick={handleCompare} disabled={loading}>
        Compare Plans
      </Button>
      
      {loading && <p>Comparing plans...</p>}
      {comparison && (
        <div className="bg-blue-50 p-4 rounded">
          <pre>{comparison}</pre>
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
}
*/

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Explain Policy Terms
// ═══════════════════════════════════════════════════════════════════════════════

/*
import { useState } from "react";
import { useAIPolicyExplainer } from "@/hooks/useAIFeatures";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ExplainPolicyTerms() {
  const { explanation, loading, error, explain } = useAIPolicyExplainer();
  const [term, setTerm] = useState("");

  const handleExplain = async () => {
    if (term) {
      await explain(term, "Indian health insurance context");
    }
  };

  return (
    <div>
      <h2>Policy Term Explainer</h2>
      <Input 
        placeholder="Enter insurance term (e.g., Co-payment, PED, Room rent capping)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <Button onClick={handleExplain} disabled={loading}>
        Explain
      </Button>
      
      {loading && <p>Explaining term...</p>}
      {explanation && (
        <div className="bg-green-50 p-4 rounded mt-4">
          {explanation}
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
}
*/

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Cost Estimator with AI Insights
// ═══════════════════════════════════════════════════════════════════════════════

/*
import { useEffect } from "react";
import { useAICostInsights } from "@/hooks/useAIFeatures";

export function CostEstimatorWithAI() {
  const { insights, loading, error, generateInsights } = useAICostInsights();

  useEffect(() => {
    // Generate insights when component mounts or data changes
    generateInsights(
      [25000, 35000, 45000],  // Premiums to analyze
      [500000, 750000, 1000000],  // Coverage amounts
      35  // User age
    );
  }, []);

  return (
    <div>
      <h2>Cost Optimization Analysis</h2>
      
      {loading && <p>Analyzing cost optimization options...</p>}
      {insights && (
        <div className="bg-amber-50 p-4 rounded">
          <p>{insights}</p>
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
}
*/

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Health Tips on Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

/*
import { useEffect } from "react";
import { useAIHealthTips } from "@/hooks/useAIFeatures";
import { useAuth } from "@/contexts/AuthContext";

export function HealthTipsWidget() {
  const { profile } = useAuth();
  const { tips, loading, error, generate } = useAIHealthTips();

  useEffect(() => {
    if (profile?.age && profile?.gender) {
      generate({
        age: profile.age,
        gender: profile.gender,
        conditions: profile.conditions || []
      });
    }
  }, [profile?.age, profile?.gender]);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
      <h3 className="font-semibold mb-3">AI Health Tips</h3>
      
      {loading && <p className="text-sm text-gray-600">Generating personalized tips...</p>}
      {tips && (
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {tips}
        </div>
      )}
      {error && <p className="text-sm text-red-500">Error loading tips</p>}
    </div>
  );
}
*/

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Claim Outcome Estimation
// ═══════════════════════════════════════════════════════════════════════════════

/*
import { useAIClaimEstimator } from "@/hooks/useAIFeatures";
import { Button } from "@/components/ui/button";

export function ClaimOutcomePredictor() {
  const { prediction, loading, error, estimate } = useAIClaimEstimator();

  const handleEstimate = async () => {
    const claimDetails = "Hospitalization for appendix surgery, 3 days stay, ₹2,50,000 total cost";
    const policyDetails = "Mediclaim Plus, ₹5L coverage, 0% co-payment, 45 days waiting period completed";
    
    await estimate(claimDetails, policyDetails);
  };

  return (
    <div>
      <Button onClick={handleEstimate} disabled={loading}>
        Estimate Claim Outcome
      </Button>
      
      {loading && <p>Analyzing claim outcome...</p>}
      {prediction && (
        <div className="bg-purple-50 p-4 rounded mt-4">
          <p>{prediction}</p>
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
}
*/

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: General AI Query (Chat-style)
// ═══════════════════════════════════════════════════════════════════════════════

/*
import { useState } from "react";
import { useAIService } from "@/hooks/useAIFeatures";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChatWithAI() {
  const { response, loading, error, ask } = useAIService();
  const [query, setQuery] = useState("");

  const handleAsk = async () => {
    if (query) {
      await ask(
        query,
        "You are a helpful Indian health insurance advisor. Answer questions clearly and practically."
      );
      setQuery("");
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input 
          placeholder="Ask me anything about health insurance..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
        />
        <Button onClick={handleAsk} disabled={loading}>
          Ask
        </Button>
      </div>
      
      {loading && <p>Thinking...</p>}
      {response && (
        <div className="bg-gray-50 p-4 rounded mt-4">
          <p>{response}</p>
        </div>
      )}
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
}
*/

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════════

/*
Before integrating AI into your features:

1. ✅ Confirm .env.local has at least ONE API key:
   VITE_HF_API_KEY=hf_xxxxxxxxxxxx
   OR
   VITE_MISTRAL_API_KEY=xxxxxx
   OR
   VITE_GROQ_API_KEY=gsk_xxxxxxx
   OR
   VITE_TOGETHER_API_KEY=xxxxx

2. ✅ Import the relevant hook from /src/hooks/useAIFeatures.ts

3. ✅ Call the hook's main function (analyze, compare, explain, etc.) with appropriate parameters

4. ✅ Display loading state while AI is processing

5. ✅ Handle error cases gracefully (show fallback text or retry button)

6. ✅ Display the AI response in a formatted, readable way

7. ✅ (Optional) Add retry logic in case one provider fails


HOOK REFERENCE:

useAIGapAnalysis()
  → analyze(coverage: string[], age: number, familySize: number): Promise<string>
  → Returns: {analysis, loading, error, analyze}

useAIPolicyComparison()
  → compare(plan1: any, plan2: any): Promise<string>
  → Returns: {comparison, loading, error, compare}

useAIClaimEstimator()
  → estimate(claimDetails: string, policyDetails: string): Promise<string>
  → Returns: {prediction, loading, error, estimate}

useAICostInsights()
  → generateInsights(premiums: number[], coverages: number[], age: number): Promise<string>
  → Returns: {insights, loading, error, generateInsights}

useAIHealthTips()
  → generate(userProfile: {age, gender, conditions?}): Promise<string>
  → Returns: {tips, loading, error, generate}

useAIPolicyExplainer()
  → explain(term: string, context?: string): Promise<string>
  → Returns: {explanation, loading, error, explain}

useAIService()
  → ask(prompt: string, context?: string): Promise<string>
  → Returns: {response, loading, error, ask}
*/

// For actual implementation, uncomment the examples above and adapt to your components!
