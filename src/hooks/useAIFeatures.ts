import { useState } from "react";
import {
  analyzeGaps,
  compareInsurancePlans,
  estimateClaimOutcome,
  generateCostInsights,
  generateHealthTips,
  explainPolicyTerm,
  askAI,
  revealHiddenInsuranceThings,
  compareHiddenThings,
} from "@/lib/aiService";

/**
 * Hook for gap analysis with AI
 */
export function useAIGapAnalysis() {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (coverage: string[], age: number, familySize: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeGaps(coverage, age, familySize);
      setAnalysis(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze gaps";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analysis, loading, error, analyze };
}

/**
 * Hook for policy comparison with AI
 */
export function useAIPolicyComparison() {
  const [comparison, setComparison] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = async (plan1: any, plan2: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await compareInsurancePlans(plan1, plan2);
      setComparison(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to compare plans";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { comparison, loading, error, compare };
}

/**
 * Hook for claim outcome estimation
 */
export function useAIClaimEstimator() {
  const [prediction, setPrediction] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = async (claimDetails: string, policyDetails: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await estimateClaimOutcome(claimDetails, policyDetails);
      setPrediction(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to estimate claim outcome";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { prediction, loading, error, estimate };
}

/**
 * Hook for cost optimization insights
 */
export function useAICostInsights() {
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async (premiums: number[], coverages: number[], age: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateCostInsights(premiums, coverages, age);
      setInsights(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate insights";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { insights, loading, error, generateInsights };
}

/**
 * Hook for health tips
 */
export function useAIHealthTips() {
  const [tips, setTips] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (userProfile: { age: number; gender: string; conditions?: string[] }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateHealthTips(userProfile);
      setTips(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate tips";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { tips, loading, error, generate };
}

/**
 * Hook for explaining policy terms
 */
export function useAIPolicyExplainer() {
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = async (term: string, context?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await explainPolicyTerm(term, context);
      setExplanation(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to explain term";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { explanation, loading, error, explain };
}

/**
 * Hook for general AI queries (free API service)
 */
export function useAIService() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (prompt: string, context?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await askAI(prompt, context);
      setResponse(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get AI response";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { response, loading, error, ask };
}

/**
 * Hook for revealing hidden insurance policy terms and restrictions
 */
export function useRevealHiddenThings() {
  const [hiddenThings, setHiddenThings] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reveal = async (policyDetails: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await revealHiddenInsuranceThings(policyDetails);
      setHiddenThings(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reveal hidden things";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { hiddenThings, loading, error, reveal };
}

/**
 * Hook for comparing hidden things between two policies
 */
export function useCompareHiddenThings() {
  const [comparison, setComparison] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = async (plan1: any, plan2: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await compareHiddenThings(plan1, plan2);
      setComparison(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to compare hidden things";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { comparison, loading, error, compare };
}
