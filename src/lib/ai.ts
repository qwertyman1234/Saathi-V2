/**
 * ai.ts — Saathi Health Insurance AI Service
 *
 * Uses OpenRouter (https://openrouter.ai) — works with your existing key.
 * OpenRouter provides access to 100+ models including free ones.
 *
 * Free models used (no credits needed):
 *   - google/gemini-2.0-flash-exp:free
 *   - meta-llama/llama-3.1-8b-instruct:free
 *   - mistralai/mistral-7b-instruct:free
 *   - google/gemma-3-27b-it:free
 */

const OR_KEY    = import.meta.env.VITE_OPENROUTER_KEY    ?? "";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY   ?? "";
const CLAUDE_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? "";

const OR_BASE    = "https://openrouter.ai/api/v1";
const CLAUDE_API = "https://api.anthropic.com/v1/messages";

// ── Free models on OpenRouter (tries in order) ────────────────────────────────
const FREE_MODELS = [
  "meta-llama/llama-3.1-70b-instruct",
  "meta-llama/llama-3-70b-instruct",
  "mistralai/mistral-large",
  "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
  "meta-llama/llama-2-70b-chat",
  "mistralai/mistral-7b-instruct",
];

const HAS_OR     = OR_KEY    && OR_KEY.startsWith("sk-or-");
const HAS_GEMINI = GEMINI_KEY && GEMINI_KEY.length > 10 && !GEMINI_KEY.startsWith("YOUR_");
const HAS_CLAUDE = CLAUDE_KEY && CLAUDE_KEY.length > 20;

export const ENGINE: "openrouter" | "gemini" | "claude" | "none" =
  HAS_OR ? "openrouter" :
  HAS_GEMINI ? "gemini" :
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
    err?.status === 429 || err?.status === 503
  );
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
    if (!text) throw new Error("Empty response");
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
async function orChat(system: string, messages: AIMessage[], maxTokens = 1200): Promise<string> {
  let lastErr: any;
  for (const model of FREE_MODELS) {
    try {
      return await orChatWithModel(model, system, messages, maxTokens, false);
    } catch (e: any) {
      lastErr = e;
      if (isRetryable(e) || e.status === 400) continue; // try next model
      throw e;
    }
  }
  return `⏳ All free AI models are busy right now. Please wait 10 seconds and try again.\n\n_${lastErr?.message}_`;
}

async function orStream(
  system: string,
  messages: AIMessage[],
  onDelta: (t: string) => void,
  onDone: () => void,
  maxTokens = 1200
): Promise<void> {
  let lastErr: any;
  for (const model of FREE_MODELS) {
    try {
      return await orChatWithModel(model, system, messages, maxTokens, true, onDelta, onDone);
    } catch (e: any) {
      lastErr = e;
      if (isRetryable(e) || e.status === 400) continue;
      throw e;
    }
  }
  onDelta(`⏳ All free AI models are busy. Please wait 10 seconds and try again.\n\n_${lastErr?.message}_`);
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

async function geminiChat(system: string, messages: AIMessage[], maxTokens = 1200): Promise<string> {
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
  onDelta: (t: string) => void, onDone: () => void, maxTokens = 1200
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

async function claudeChat(system: string, messages: AIMessage[], maxTokens = 1200): Promise<string> {
  const res = await fetch(CLAUDE_API, {
    method: "POST", headers: claudeHdrs(),
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message); }
  return (await res.json()).content?.[0]?.text ?? "";
}

async function claudeStream(
  system: string, messages: AIMessage[],
  onDelta: (t: string) => void, onDone: () => void, maxTokens = 1200
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

// ── Route to right engine ─────────────────────────────────────────────────────
function chatFn(system: string, messages: AIMessage[], maxTokens: number): Promise<string> {
  if (ENGINE === "openrouter") return orChat(system, messages, maxTokens);
  if (ENGINE === "gemini")     return geminiChat(system, messages, maxTokens);
  if (ENGINE === "claude")     return claudeChat(system, messages, maxTokens);
  return Promise.resolve(noKeyError());
}

function streamFn(
  system: string, messages: AIMessage[], maxTokens: number,
  onDelta: (t: string) => void, onDone: () => void
): Promise<void> {
  if (ENGINE === "openrouter") return orStream(system, messages, onDelta, onDone, maxTokens);
  if (ENGINE === "gemini")     return geminiStream(system, messages, onDelta, onDone, maxTokens);
  if (ENGINE === "claude")     return claudeStream(system, messages, onDelta, onDone, maxTokens);
  onDelta(noKeyError()); onDone(); return Promise.resolve();
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function askAI(system: string, prompt: string, maxTokens = 1200): Promise<string> {
  return chatFn(system, [{ role: "user", content: prompt }], maxTokens);
}

export async function askAIJSON<T = unknown>(system: string, prompt: string, maxTokens = 1200): Promise<T> {
  const text = await askAI(
    system + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, no code fences.",
    prompt, maxTokens
  );
  const clean = text.replace(/```json|```/g, "").trim();
  const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return JSON.parse(match?.[0] ?? clean) as T;
}

export async function streamAI({
  system, messages, onDelta, onDone, maxTokens = 1200,
}: {
  system: string; messages: AIMessage[];
  onDelta: (t: string) => void; onDone: () => void; maxTokens?: number;
}): Promise<void> {
  return streamFn(system, messages, maxTokens, onDelta, onDone);
}

export async function askAIWithSearch(system: string, prompt: string, maxTokens = 2000): Promise<string> {
  // OpenRouter doesn't have built-in web search so we add an instruction
  const enhancedSystem = system + "\n\nNote: For questions about latest news or current data, use your training knowledge about Indian health insurance and IRDAI regulations up to 2025.";
  return chatFn(enhancedSystem, [{ role: "user", content: prompt }], maxTokens);
}

export function getActiveEngine(): string {
  if (ENGINE === "openrouter") return "OpenRouter · Gemini 2.0 Flash (Free)";
  if (ENGINE === "gemini")     return "Google Gemini (Free)";
  if (ENGINE === "claude")     return "Claude Sonnet 4";
  return "No AI key configured";
}

// ── Legacy shims ──────────────────────────────────────────────────────────────
export const askClaude            = askAI;
export const askClaudeJSON        = askAIJSON;
export const askClaudeWithSearch  = askAIWithSearch;
export const streamClaude         = (a: Parameters<typeof streamAI>[0]) => streamAI(a);
export type  ClaudeMessage        = AIMessage;
