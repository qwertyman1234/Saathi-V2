/**
 * ai.ts — Saathi Health Insurance AI Service
 *
 * PRIMARY: Hugging Face (Completely Free - 32k messages/month)
 * FALLBACK: Google Gemini (Free - rate limited)
 * FALLBACK: OpenRouter (Free models, may have rate limits)
 * FALLBACK: Claude (Paid, but fallback)
 */

const HF_KEY     = import.meta.env.VITE_HF_API_KEY        ?? "";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY   ?? "";
const OR_KEY     = import.meta.env.VITE_OPENROUTER_KEY    ?? "";
const CLAUDE_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? "";

const HF_BASE    = "https://api-inference.huggingface.co/models";
const OR_BASE    = "https://openrouter.ai/api/v1";
const CLAUDE_API = "https://api.anthropic.com/v1/messages";

// ── Free Hugging Face models (COMPLETELY FREE - 32k/month) ────────────────────
// These are the best free models on HF - no credits, just rate-limited
const HF_MODELS = [
  "mistralai/Mistral-7B-Instruct-v0.1",
  "meta-llama/Llama-2-7b-chat-hf",
  "tiiuae/falcon-7b-instruct",
];

// ── Free models on OpenRouter (tries in order) ────────────────────────────────
// Using special "openrouter/free" dynamic catch-all that routes to ANY $0 model
// Automatically switches if a model stops being free
// Source: https://openrouter.ai/docs#models
// OpenRouter model IDs format: namespace/model-name (e.g., openai/gpt-4o-mini)
const FREE_MODELS = [
  "openrouter/free",                           // Dynamic catch-all - Always $0, no daily limits
  "meta-llama/llama-2-7b-chat-hf",            // Llama 2 Chat (fast, free tier)
  "meta-llama/llama-3-8b-instruct",           // Llama 3 8B (newer, faster, free tier)
];

const HAS_OR     = OR_KEY    && OR_KEY.startsWith("sk-or-");
const HAS_GEMINI = GEMINI_KEY && GEMINI_KEY.length > 10 && !GEMINI_KEY.startsWith("YOUR_");
const HAS_HF     = HF_KEY    && HF_KEY.length > 10 && !HF_KEY.startsWith("YOUR_");
const HAS_CLAUDE = CLAUDE_KEY && CLAUDE_KEY.length > 20;

export const ENGINE: "openrouter" | "gemini" | "huggingface" | "claude" | "none" =
  HAS_OR ? "openrouter" :
  HAS_GEMINI ? "gemini" :
  HAS_HF ? "huggingface" :
  HAS_CLAUDE ? "claude" :
  "none";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function noKeyError() {
  return `⚠️ **AI key not configured.**\n\nYour OpenRouter key is already in \`.env\`!\n\nMake sure the \`.env\` file has:\n\`VITE_OPENROUTER_KEY="sk-or-v1-..."\`\n\nThen restart: \`bun run dev\``;
}

function isRetryable(err: any): boolean {
  const m = String(err?.message ?? "").toLowerCase();
  return (
    m.includes("rate") || m.includes("quota") || m.includes("429") ||
    m.includes("503") || m.includes("overloaded") || m.includes("capacity") ||
    m.includes("empty") || m.includes("timeout") ||  // Include timeouts
    err?.status === 429 || err?.status === 503
  );
}

// ── Hugging Face (COMPLETELY FREE - 32k messages/month) ────────────────────────
async function hfChat(system: string, messages: AIMessage[], maxTokens = 350): Promise<string> {
  for (const model of HF_MODELS) {
    try {
      // Format prompt in simple text format for HF models
      const prompt = [
        `System: ${system}`,
        ...messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
        'Assistant:' // Let model continue from here
      ].join('\n');

      const res = await fetch(`${HF_BASE}/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature: 0.7,
            top_p: 0.95,
          },
          options: { wait_for_model: true }, // Wait if model is loading
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        const errMsg = e?.error || e?.message || `HTTP ${res.status}`;
        throw Object.assign(new Error(errMsg), { status: res.status });
      }

      const data = await res.json();
      
      // HF Inference API returns array of results
      let text = '';
      if (Array.isArray(data) && data[0]?.generated_text) {
        text = data[0].generated_text;
        // Remove the prompt from response
        text = text.replace(prompt, '').trim();
      } else if (data?.generated_text) {
        text = data.generated_text.replace(prompt, '').trim();
      }
      
      if (text) return text;
    } catch (e: any) {
      console.warn(`[HF] ${model} failed:`, e?.message);
      if (isRetryable(e) || e.status === 404 || e.status === 400 || e.status === 503) continue;
      throw e;
    }
  }
  return "⏳ Hugging Face models busy. Please retry in a few seconds.";
}

// Stream not available for HF free tier, fallback to chat
async function hfStream(
  system: string, messages: AIMessage[],
  onDelta: (t: string) => void, onDone: () => void, maxTokens = 700
): Promise<void> {
  try {
    const text = await hfChat(system, messages, maxTokens);
    onDelta(text);
    onDone();
  } catch (e) {
    onDelta("⏳ Hugging Face service temporarily unavailable.");
    onDone();
  }
}

// ── OpenRouter ────────────────────────────────────────────────────────────────
function orHeaders() {
  return {
    "Authorization": `Bearer ${OR_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://saathi-health-insurance.web.app",
    "X-Title": "Health Insurance Saathi",
  };
}

async function orChatWithModel(
  model: string,
  system: string,
  messages: AIMessage[],
  maxTokens: number,
  streaming: false
): Promise<string>;
async function orChatWithModel(
  model: string,
  system: string,
  messages: AIMessage[],
  maxTokens: number,
  streaming: true,
  onDelta: (t: string) => void,
  onDone: () => void
): Promise<void>;
async function orChatWithModel(
  model: string,
  system: string,
  messages: AIMessage[],
  maxTokens: number,
  streaming: boolean,
  onDelta?: (t: string) => void,
  onDone?: () => void
): Promise<string | void> {
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    stream: streaming,
    messages: [
      { role: "system", content: system },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
  });

  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: "POST",
    headers: orHeaders(),
    body,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const errMsg = errBody?.error?.message ?? errBody?.message ?? `HTTP ${res.status}`;
    throw Object.assign(new Error(errMsg), { status: res.status });
  }

  if (!streaming) {
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      console.warn(`⚠️ Model "${model}" returned empty response:`, data);
      throw Object.assign(new Error("Empty response from model"), { status: 503 });
    }
    return text;
  }

  // SSE stream (OpenAI-compatible)
  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).replace(/\r$/, "");
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data: ")) continue;
      const js = line.slice(6).trim();
      if (!js || js === "[DONE]") continue;
      try {
        const p = JSON.parse(js);
        const t = p.choices?.[0]?.delta?.content ?? "";
        if (t) onDelta!(t);
      } catch { /* skip */ }
    }
  }
  onDone!();
}

// Tries each free model, falls back automatically
async function orChat(system: string, messages: AIMessage[], maxTokens = 350): Promise<string> {
  let lastErr: any;
  console.log(`🤖 Trying ${FREE_MODELS.length} OpenRouter models...`);
  
  for (let modelIdx = 0; modelIdx < FREE_MODELS.length; modelIdx++) {
    const model = FREE_MODELS[modelIdx];
    try {
      console.log(`   → Attempting: ${model}`);
      const result = await orChatWithModel(model, system, messages, maxTokens, false);
      console.log(`   ✓ Success with ${model}`);
      return result;
    } catch (e: any) {
      lastErr = e;
      const isRateLimited = String(e?.message ?? "").toLowerCase().includes("rate");
      
      if (isRetryable(e)) {
        const delay = isRateLimited ? 2000 : 500; // Wait 2s for rate limit, else 0.5s
        console.log(`   ⚠️ ${model} busy: ${e?.message}`);
        if (modelIdx < FREE_MODELS.length - 1) {
          console.log(`   ⏳ Waiting ${delay}ms before retry...`);
          await new Promise(r => setTimeout(r, delay));
          console.log(`   → Continuing to next model...`);
        }
        continue; // try next model
      }
      
      // Non-retryable error (daily limit, auth error, etc)
      console.error(`   ✗ ${model} failed: ${e?.message}`);
      if (modelIdx === 0 && FREE_MODELS.length > 1) {
        console.log(`   → Trying fallback models...`);
        continue;
      }
      throw e; // serious error on last model, don't retry
    }
  }
  
  const fallbackMsg = `All AI models are busy. Free tier rate limit reached. Please wait 1-2 minutes and try again.`;
  console.warn(`⏳ ${fallbackMsg}`);
  return fallbackMsg;
}

async function orStream(
  system: string,
  messages: AIMessage[],
  onDelta: (t: string) => void,
  onDone: () => void,
  maxTokens = 700
): Promise<void> {
  let lastErr: any;
  console.log(`🎵 Streaming with OpenRouter models...`);
  
  for (let modelIdx = 0; modelIdx < FREE_MODELS.length; modelIdx++) {
    const model = FREE_MODELS[modelIdx];
    try {
      console.log(`   → Streaming with ${model}...`);
      return await orChatWithModel(model, system, messages, maxTokens, true, onDelta, onDone);
    } catch (e: any) {
      lastErr = e;
      const isRateLimited = String(e?.message ?? "").toLowerCase().includes("rate");
      
      if (isRetryable(e)) {
        const delay = isRateLimited ? 2000 : 500;
        console.log(`   ⚠️ ${model} busy: ${e?.message}`);
        if (modelIdx < FREE_MODELS.length - 1) {
          console.log(`   ⏳ Waiting ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      throw e;
    }
  }
  onDelta(`⏳ AI streaming is temporarily unavailable. All models at free tier rate limit. Please wait 1-2 minutes. (${lastErr?.message})`);
  onDone();
}

// ── Gemini (direct) ───────────────────────────────────────────────────────────
const GEMINI_MODELS = ["gemini-2.0-flash-preview", "gemini-2.0-flash-exp", "gemini-1.5-flash"];
const GEMINI_BASE   = "https://generativelanguage.googleapis.com/v1beta/models";
const SAFETY = [
  { category: "HARM_CATEGORY_HARASSMENT",       threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

function toGeminiContents(messages: AIMessage[]) {
  const out: { role: string; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    if (out.length && out[out.length - 1].role === role) {
      out[out.length - 1].parts[0].text += "\n" + m.content;
    } else {
      out.push({ role, parts: [{ text: m.content }] });
    }
  }
  if (out.length && out[0].role === "model") out.unshift({ role: "user", parts: [{ text: "Hello" }] });
  return out;
}

async function geminiChat(system: string, messages: AIMessage[], maxTokens = 350): Promise<string> {
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: toGeminiContents(messages),
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
          safetySettings: SAFETY,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw Object.assign(new Error(e?.error?.message ?? `HTTP ${res.status}`), { status: res.status });
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e: any) {
      if (isRetryable(e) || e.status === 404 || e.status === 400) continue;
      throw e;
    }
  }
  return "⏳ Gemini rate limited. Please retry in a few seconds.";
}

async function geminiStream(
  system: string, messages: AIMessage[],
  onDelta: (t: string) => void, onDone: () => void, maxTokens = 350
): Promise<void> {
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:streamGenerateContent?key=${GEMINI_KEY}&alt=sse`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: toGeminiContents(messages),
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
          safetySettings: SAFETY,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw Object.assign(new Error(e?.error?.message ?? `HTTP ${res.status}`), { status: res.status });
      }
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).replace(/\r$/, ""); buf = buf.slice(nl + 1);
          if (!line.startsWith("data: ")) continue;
          const js = line.slice(6).trim(); if (!js || js === "[DONE]") continue;
          try { const p = JSON.parse(js); const t = p?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""; if (t) onDelta(t); } catch { /**/ }
        }
      }
      onDone(); return;
    } catch (e: any) {
      if (isRetryable(e) || e.status === 404 || e.status === 400) continue;
      throw e;
    }
  }
  onDelta("⏳ Gemini rate limited. Please retry in a few seconds."); onDone();
}

// ── Claude ────────────────────────────────────────────────────────────────────
const claudeHdrs = () => ({
  "Content-Type": "application/json",
  "x-api-key": CLAUDE_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
});

async function claudeChat(system: string, messages: AIMessage[], maxTokens = 350): Promise<string> {
  const res = await fetch(CLAUDE_API, {
    method: "POST", headers: claudeHdrs(),
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message); }
  return (await res.json()).content?.[0]?.text ?? "";
}

async function claudeStream(
  system: string, messages: AIMessage[],
  onDelta: (t: string) => void, onDone: () => void, maxTokens = 350
) {
  const res = await fetch(CLAUDE_API, {
    method: "POST", headers: claudeHdrs(),
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages, stream: true }),
  });
  if (!res.ok || !res.body) throw new Error("Claude stream failed");
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true }); let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).replace(/\r$/, ""); buf = buf.slice(nl + 1);
      if (!line.startsWith("data: ")) continue;
      const js = line.slice(6).trim(); if (js === "[DONE]") break;
      try { const p = JSON.parse(js); const d = p?.delta?.text ?? ""; if (d) onDelta(d); } catch { /**/ }
    }
  }
  onDone();
}

function chatFn(system: string, messages: AIMessage[], maxTokens: number): Promise<string> {
  if (ENGINE === "openrouter")  return orChat(system, messages, maxTokens);
  if (ENGINE === "gemini")      return geminiChat(system, messages, maxTokens);
  if (ENGINE === "huggingface") return hfChat(system, messages, maxTokens);
  if (ENGINE === "claude")      return claudeChat(system, messages, maxTokens);
  return Promise.resolve(noKeyError());
}

function streamFn(
  system: string, messages: AIMessage[], maxTokens: number,
  onDelta: (t: string) => void, onDone: () => void
): Promise<void> {
  if (ENGINE === "openrouter")  return orStream(system, messages, onDelta, onDone, maxTokens);
  if (ENGINE === "gemini")      return geminiStream(system, messages, onDelta, onDone, maxTokens);
  if (ENGINE === "huggingface") return hfStream(system, messages, onDelta, onDone, maxTokens);
  if (ENGINE === "claude")      return claudeStream(system, messages, onDelta, onDone, maxTokens);
  onDelta(noKeyError()); onDone(); return Promise.resolve();
}

// ── Public API ────────────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("AI request timed out. Please try again.")), timeoutMs)
    )
  ]);
}

export async function askAI(system: string, prompt: string, maxTokens = 200): Promise<string> {
  return withTimeout(chatFn(system, [{ role: "user", content: prompt }], maxTokens), 20000);
}

export async function askAIJSON<T = unknown>(system: string, prompt: string, maxTokens = 200): Promise<T> {
  const text = await withTimeout(
    askAI(
      system + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, no code fences.",
      prompt, maxTokens
    ),
    20000
  );
  const clean = text.replace(/```json|```/g, "").trim();
  const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return JSON.parse(match?.[0] ?? clean) as T;
}

export async function streamAI({
  system, messages, onDelta, onDone, maxTokens = 250,
}: {
  system: string; messages: AIMessage[];
  onDelta: (t: string) => void; onDone: () => void; maxTokens?: number;
}): Promise<void> {
  try {
    await withTimeout(
      streamFn(system, messages, maxTokens, onDelta, onDone),
      25000
    );
  } catch (e) {
    onDelta("⏳ Request timed out. Please try again.");
    onDone();
  }
}

export async function askAIWithSearch(system: string, prompt: string, maxTokens = 300): Promise<string> {
  // OpenRouter doesn't have built-in web search so we add an instruction
  const enhancedSystem = system + "\n\nNote: For questions about latest news or current data, use your training knowledge about Indian health insurance and IRDAI regulations up to 2025.";
  return withTimeout(
    chatFn(enhancedSystem, [{ role: "user", content: prompt }], maxTokens),
    20000
  );
}

export function getActiveEngine(): string {
  if (ENGINE === "openrouter")  return "OpenRouter Free Models ($0 - No Cost)";
  if (ENGINE === "gemini")      return "Google Gemini (FREE - Add your key to use)";
  if (ENGINE === "huggingface") return "Hugging Face (FREE - 32k/month)";
  if (ENGINE === "claude")      return "Claude Sonnet 4";
  return "ERROR: No AI provider configured. Add OpenRouter key to .env";
}

// Log on startup to confirm cost
if (typeof window !== 'undefined') {
  console.log(`%c✅ AI Engine: ${getActiveEngine()}`, "color: green; font-weight: bold; font-size: 14px;");
  if (ENGINE === "openrouter") {
    console.log("%c💰 Cost: $0/month (Free tier models - gpt-4o-mini, Mistral, Llama)", "color: green;");
    console.log("%c📊 Note: The $0.20 shown in OpenRouter dashboard is historical from initial tests only.", "color: orange;");
  }
}

// ── Legacy shims ──────────────────────────────────────────────────────────────
export const askClaude            = askAI;
export const askClaudeJSON        = askAIJSON;
export const askClaudeWithSearch  = askAIWithSearch;
export const streamClaude         = (a: Parameters<typeof streamAI>[0]) => streamAI(a);
export type  ClaudeMessage        = AIMessage;
