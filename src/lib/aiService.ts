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
        model: "gpt-3.5-turbo",  // Free tier available
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
  const providers: AIProvider[] = preferredProvider
    ? [preferredProvider, "openrouter", "huggingface", "mistral", "groq", "together"]
    : ["openrouter", "huggingface", "mistral", "groq", "together"];

  const providerFunctions: Record<AIProvider, (p: string, c: string) => Promise<string>> = {
    openrouter: openrouterAI,
    huggingface: huggingfaceAI,
    mistral: mistralAI,
    groq: groqAI,
    together: togetherAI,
  };

  const availableProviders: string[] = [];
  
  if (OPENROUTER_API_KEY) availableProviders.push("OpenRouter");
  if (HUGGINGFACE_API_KEY) availableProviders.push("Hugging Face");
  if (MISTRAL_API_KEY) availableProviders.push("Mistral");
  if (GROQ_API_KEY) availableProviders.push("Groq");
  if (TOGETHER_API_KEY) availableProviders.push("Together");

  console.log("Available AI providers:", availableProviders);

  for (const provider of providers) {
    try {
      if (provider === "openrouter" && !OPENROUTER_API_KEY) {
        console.log("Skipping OpenRouter (no API key)");
        continue;
      }
      if (provider === "huggingface" && !HUGGINGFACE_API_KEY) {
        console.log("Skipping Hugging Face (no API key)");
        continue;
      }
      if (provider === "mistral" && !MISTRAL_API_KEY) {
        console.log("Skipping Mistral (no API key)");
        continue;
      }
      if (provider === "groq" && !GROQ_API_KEY) {
        console.log("Skipping Groq (no API key)");
        continue;
      }
      if (provider === "together" && !TOGETHER_API_KEY) {
        console.log("Skipping Together (no API key)");
        continue;
      }

      console.log(`Trying ${provider}...`);
      const result = await providerFunctions[provider](prompt, context);
      
      if (result && result.length > 0) {
        console.log(`✓ Success with ${provider}`);
        return result;
      }
      
      console.log(`${provider} returned empty result`);
    } catch (error) {
      console.error(`✗ ${provider} failed:`, error);
      continue;
    }
  }

  // Fallback if all fail
  const errorMsg = availableProviders.length === 0
    ? "No AI API key configured. Please add VITE_OPENROUTER_KEY or VITE_HF_API_KEY to .env file."
    : `All AI providers failed (${availableProviders.join(", ")} tried). Please try again in a few moments.`;
  
  console.error(errorMsg);
  throw new Error(errorMsg);
}

/**
 * Specialized functions for different features
 */

export async function analyzeGaps(
  existingCoverage: string[],
  age: number,
  familySize: number
): Promise<string> {
  const context = `You are an Indian health insurance expert. Provide gap analysis recommendations.`;
  const prompt = `My existing coverage includes: ${existingCoverage.join(", ")}. I'm ${age} years old with a family of ${familySize}. What coverage gaps should I address?`;
  return askAI(prompt, context);
}

export async function compareInsurancePlans(
  plan1: any,
  plan2: any
): Promise<string> {
  const context = `You are an insurance comparison expert. Provide clear, concise comparisons.`;
  const prompt = `Compare these two plans:\n\nPlan 1: ${JSON.stringify(plan1)}\n\nPlan 2: ${JSON.stringify(plan2)}\n\nProvide a brief comparison highlighting pros and cons.`;
  return askAI(prompt, context);
}

export async function estimateClaimOutcome(
  claimDetails: string,
  policyDetails: string
): Promise<string> {
  const context = `You are an insurance claim assessment expert. Provide realistic predictions based on policy terms.`;
  const prompt = `Claim Details: ${claimDetails}\n\nPolicy Details: ${policyDetails}\n\nWhat is the likely claim outcome?`;
  return askAI(prompt, context);
}

export async function generateCostInsights(
  premiums: number[],
  coverageAmounts: number[],
  age: number
): Promise<string> {
  const context = `You are a health insurance cost analyst. Provide practical financial insights.`;
  const prompt = `My premiums: ${premiums.join(", ")}, Coverages: ${coverageAmounts.join(", ")}, Age: ${age}. Give cost optimization suggestions.`;
  return askAI(prompt, context);
}

export async function generateHealthTips(
  userProfile: { age: number; gender: string; conditions?: string[] }
): Promise<string> {
  const context = `You are a health and wellness advisor. Provide practical, evidence-based health tips.`;
  const prompt = `Person: ${userProfile.age}yo ${userProfile.gender}${userProfile.conditions ? ` with ${userProfile.conditions.join(", ")}` : ""}. Give 3 health tips.`;
  return askAI(prompt, context);
}

export async function explainPolicyTerm(term: string, context?: string): Promise<string> {
  const systemContext = `You are an expert at explaining insurance terms in simple, non-technical language.`;
  const prompt = `Explain this insurance term in simple terms: "${term}"${context ? ` in the context of: ${context}` : ""}.`;
  return askAI(prompt, systemContext);
}

/**
 * TRANSPARENCY FEATURE: Reveal Hidden Things in Insurance Policies
 * This function exposes hidden clauses, restrictions, exclusions, and unfavorable terms
 * that insurance companies often hide in fine print or complex language.
 */
export async function revealHiddenInsuranceThings(policyDetails: any): Promise<string> {
  const context = `You are an expert health insurance transparency analyst who specializes in revealing hidden restrictions, unfavorable terms, and fine print that insurance companies want customers to miss. Your goal is to help people understand what they're REALLY getting (and NOT getting).

Be specific, practical, and highlight:
1. Hidden Restrictions: Coverage limits, sub-limits, caps that apply to specific treatments
2. Exclusions: What's NOT covered (pre-existing conditions, cosmetic, experimental treatments, etc.)
3. Waiting Periods: Initial waiting periods, specific waiting periods for certain diseases
4. Common Rejection Reasons: How claims get rejected under this policy
5. What's Missing: Important coverages that seem missing
6. Unfavorable Terms: Co-pays, deductibles, co-insurance percentages that hurt patients
7. Network Restrictions: Hospital network limitations
8. Claim Process Red Flags: Complex claim processes or strict documentation requirements

Format your response with clear sections using markdown headers and bullet points.`;

  const policyStr = typeof policyDetails === 'string' 
    ? policyDetails 
    : JSON.stringify(policyDetails, null, 2);

  const prompt = `Analyze this insurance policy and REVEAL all the hidden things that insurance companies don't want customers to know:

${policyStr}

Be brutally honest about what's actually covered vs what sounds good in marketing. Include specific percentages, limits, and conditions. Help the customer understand the REAL deal with this policy.`;

  return askAI(prompt, context);
}

/**
 * Compare hidden things between two policies
 */
export async function compareHiddenThings(plan1: any, plan2: any): Promise<string> {
  const context = `You are an insurance transparency expert. Compare the hidden restrictions, exclusions, and unfavorable terms between two policies. Help people understand which is MORE transparent and which has HIDDEN gotchas.`;

  const plan1Str = typeof plan1 === 'string' ? plan1 : JSON.stringify(plan1, null, 2);
  const plan2Str = typeof plan2 === 'string' ? plan2 : JSON.stringify(plan2, null, 2);

  const prompt = `Compare these two plans and reveal the hidden things in each:

PLAN 1:
${plan1Str}

PLAN 2:
${plan2Str}

For each plan, identify:
- Hidden restrictions and limits
- Exclusions and what's NOT covered
- Waiting periods and conditions
- Unfavorable terms
- Which plan is MORE transparent with fewer hidden gotchas

Format clearly with Plan 1 and Plan 2 sections.`;

  return askAI(prompt, context);
}
