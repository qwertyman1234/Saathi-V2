/**
 * AI Service Layer - Multi-provider support with fallback
 * Supports: Hugging Face, Mistral AI, Groq, Together AI
 * All have free tiers suitable for this application
 */

type AIProvider = "openrouter" | "huggingface" | "mistral" | "groq" | "together";

interface AIResponse {
  text: string;
  provider: AIProvider;
}

interface AIError {
  code: string;
  message: string;
}

// Get API keys from environment
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HF_API_KEY || "";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_KEY || "";
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || "";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const TOGETHER_API_KEY = import.meta.env.VITE_TOGETHER_API_KEY || "";

/**
 * OpenRouter API - Best free option (no CORS issues, works from browser)
 * Provides access to many free models: GPT-3.5, Mistral, Llama, etc.
 */
async function openrouterAI(prompt: string, context: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.href : "",
        "X-Title": "Health Insurance Saathi",
      },
      body: JSON.stringify({
        model: "openrouter/free",  // Dynamic free model routing
        messages: [
          { role: "system", content: context || "You are a helpful health insurance advisor." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter Response:", { status: response.status, data: errorData });
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const result: any = await response.json();
    
    if (result.choices?.[0]?.message?.content) {
      return result.choices[0].message.content.trim();
    }
    
    throw new Error("Invalid OpenRouter response format");
  } catch (error) {
    console.error("OpenRouter AI error:", error);
    throw error;
  }
}

/**
 * Hugging Face Inference API - Free tier
 * Uses text generation endpoint with better error handling
 */
async function huggingfaceAI(prompt: string, context: string): Promise<string> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error("Hugging Face API key not configured");
  }

  try {
    // Use a faster, more reliable model from Hugging Face
    const response = await fetch(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 256,
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("HF Response:", { status: response.status, data: errorData });
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }

    const result: any = await response.json();
    
    // HF returns array of objects with generated_text
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text.trim();
    }
    
    // Fallback error
    throw new Error("Invalid Hugging Face response format");
  } catch (error) {
    console.error("Hugging Face AI error:", error);
    throw error;
  }
}

/**
 * Mistral AI API - Free tier with good models
 */
async function mistralAI(prompt: string, context: string): Promise<string> {
  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "mistral-tiny",
        messages: [
          { role: "system", content: context },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const result: any = await response.json();
    return result.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Mistral AI error:", error);
    throw error;
  }
}

/**
 * Groq API - Ultra-fast free inference
 * Free tier available with great speed
 */
async function groqAI(prompt: string, context: string): Promise<string> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: context },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const result: any = await response.json();
    return result.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq AI error:", error);
    throw error;
  }
}

/**
 * Together AI - Free tier with multiple models
 */
async function togetherAI(prompt: string, context: string): Promise<string> {
  try {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "mistralai/Mistral-7B-Instruct-v0.1",
        messages: [
          { role: "system", content: context },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Together API error: ${response.statusText}`);
    }

    const result: any = await response.json();
    return result.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Together AI error:", error);
    throw error;
  }
}

/**
 * Main AI function with fallback support
 * Tries multiple providers in order: OpenRouter → Hugging Face → Mistral → Groq → Together
 */
export async function askAI(
  prompt: string,
  context: string = "",
  preferredProvider?: AIProvider
): Promise<string> {
  // Only use OpenRouter (no fallbacks)
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured. Add VITE_OPENROUTER_KEY to .env");
  }

  try {
    console.log("Using OpenRouter...");
    const result = await openrouterAI(prompt, context);
    
    if (result && result.length > 0) {
      console.log("✓ OpenRouter succeeded");
      return result;
    }
    
    throw new Error("OpenRouter returned empty response");
  } catch (error) {
    console.error("✗ OpenRouter failed:", error);
    throw error;
  }
}

/**
 * Specialized functions for different features
 */

export async function analyzeGaps(
  existingCoverage: string[],
  age: number,
  familySize: number
): Promise<string> {
  const context = `You're a health insurance advisor. Spot coverage gaps quickly and give practical advice.`;
  const prompt = `I have: ${existingCoverage.join(", ")}. I'm ${age}, family of ${familySize}. What coverage gaps should I fix? (Keep it to 3 key points)`;
  return askAI(prompt, context);
}

export async function compareInsurancePlans(
  plan1: any,
  plan2: any
): Promise<string> {
  const context = `Compare plans honestly. Be brief. Highlight key differences only.`;
  const prompt = `Compare Plan 1 vs Plan 2. What's better? (3-4 sentence max)\n\nPlan 1: ${JSON.stringify(plan1)}\n\nPlan 2: ${JSON.stringify(plan2)}`;
  return askAI(prompt, context);
}

export async function estimateClaimOutcome(
  claimDetails: string,
  policyDetails: string
): Promise<string> {
  const context = `Assess the claim. Be realistic. Keep it short.`;
  const prompt = `Likely outcome for this claim? Will it be approved or denied?\n\nClaim: ${claimDetails}\n\nPolicy: ${policyDetails}`;
  return askAI(prompt, context);
}

export async function generateCostInsights(
  premiums: number[],
  coverageAmounts: number[],
  age: number
): Promise<string> {
  const context = `Give money-smart advice. Be practical and brief.`;
  const prompt = `Premiums: ${premiums.join(", ")}, Coverage: ${coverageAmounts.join(", ")}, Age: ${age}. How can I save money? (2-3 tips max)`;
  return askAI(prompt, context);
}

export async function generateHealthTips(
  userProfile: { age: number; gender: string; conditions?: string[] }
): Promise<string> {
  const context = `Give quick, practical health tips. No fluff.`;
  const prompt = `${userProfile.age}yo ${userProfile.gender}${userProfile.conditions ? ` with ${userProfile.conditions.join(", ")}` : ""}. Give me 2-3 health tips I can actually use.`;
  return askAI(prompt, context);
}

export async function explainPolicyTerm(term: string, context?: string): Promise<string> {
  const systemContext = `Explain insurance terms simply. Like you're talking to a friend. Keep it to 1-2 sentences.`;
  const prompt = `What does "${term}" mean?${context ? ` (Think: ${context})` : ""}`;
  return askAI(prompt, systemContext);
}

/**
 * TRANSPARENCY FEATURE: Reveal Hidden Things in Insurance Policies
 * This function exposes hidden clauses, restrictions, exclusions, and unfavorable terms
 * that insurance companies often hide in fine print or complex language.
 */
export async function revealHiddenInsuranceThings(policyDetails: any): Promise<string> {
  const context = `You're a straight-talking insurance expert. Reveal the real deal - what's hidden, what's not covered, and the gotchas. Be direct, not formal. Keep it brief (3-4 main points max).`;

  const policyStr = typeof policyDetails === 'string' 
    ? policyDetails 
    : JSON.stringify(policyDetails, null, 2);

  const prompt = `What's the catch with this policy? Any hidden limits, exclusions, or waiting periods I should know about?

${policyStr}`;

  return askAI(prompt, context);
}

/**
 * Compare hidden things between two policies
 */
export async function compareHiddenThings(plan1: any, plan2: any): Promise<string> {
  const context = `Compare two policies. Tell which is more transparent and which has more hidden gotchas. Keep it brief and honest.`;

  const plan1Str = typeof plan1 === 'string' ? plan1 : JSON.stringify(plan1, null, 2);
  const plan2Str = typeof plan2 === 'string' ? plan2 : JSON.stringify(plan2, null, 2);

  const prompt = `Which is better - Plan 1 or Plan 2? What hidden issues does each have?

PLAN 1:
${plan1Str}

PLAN 2:
${plan2Str}`;

  return askAI(prompt, context);
}
