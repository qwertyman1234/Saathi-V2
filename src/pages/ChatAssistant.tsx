import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Globe, Sparkles, Trash2, Shield,
  FileText, Hospital, IndianRupee, Clock, AlertCircle,
  RefreshCw, Zap, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { useAIService } from "@/hooks/useAIFeatures";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyMembers, usePolicies, useClaims } from "@/hooks/useUserData";

type AIMessage = { role: "user" | "assistant"; content: string };

// ── Language config ───────────────────────────────────────────────────────────
const LANGS = {
  en: { label: "EN",     placeholder: "Ask about your health insurance…" },
  hi: { label: "हिंदी", placeholder: "अपना बीमा सवाल पूछें…" },
  mr: { label: "मराठी", placeholder: "तुमचा विमा प्रश्न विचारा…" },
} as const;
type Lang = keyof typeof LANGS;

// ── Quick prompts ─────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: Hospital,     label: "Cashless claim",       q: "How do I file a cashless claim at a hospital?" },
  { icon: RefreshCw,    label: "Policy renewal",        q: "How do I renew my health insurance policy?" },
  { icon: Clock,        label: "Waiting period",        q: "What is a waiting period in health insurance?" },
  { icon: AlertCircle,  label: "Coverage gaps",         q: "What coverage gaps should I watch out for?" },
  { icon: Shield,       label: "PMJAY eligibility",     q: "Am I eligible for PMJAY Ayushman Bharat?" },
  { icon: FileText,     label: "Claim rejection",       q: "Why do insurance claims get rejected in India?" },
  { icon: IndianRupee,  label: "How much coverage?",    q: "How much health insurance coverage is enough for my family?" },
  { icon: User,         label: "Senior citizen tips",   q: "What are the best health insurance options for senior citizens in India?" },
];

// ── Build system prompt ───────────────────────────────────────────────────────
function buildSystem(lang: Lang, profile: any, members: any[], policies: any[], claims: any[]): string {
  const name   = profile?.fullName || "User";
  const city   = profile?.city    || "India";
  const income = profile?.incomeRange || "not specified";

  const familyStr = [
    `${name} (Self, ${city})`,
    ...members.map((m: any) => {
      const conds = (m.conditions ?? []).filter((c: string) => c !== "None");
      return `${m.name} (${m.relation}${conds.length ? ", " + conds.join(", ") : ""})`;
    }),
  ].join("; ");

  const policyStr = policies.length
    ? policies.map((p: any) =>
        `• ${p.name} by ${p.provider} — ₹${p.coverageAmount?.toLocaleString("en-IN")} cover, expires ${p.expiryDate || "N/A"} (${p.status})`
      ).join("\n")
    : "No policies added yet.";

  const pendingClaims = claims.filter((c: any) => !["Settled","Rejected"].includes(c.status));
  const claimStr = pendingClaims.length
    ? pendingClaims.map((c: any) =>
        `• ${c.claimNumber}: ${c.procedureName} at ${c.hospitalName} — ₹${c.claimAmount?.toLocaleString("en-IN")} (${c.status})`
      ).join("\n")
    : "No pending claims.";

  const langRule = {
    en: "Always respond in English.",
    hi: "हमेशा हिंदी में जवाब दें। सरल और स्पष्ट भाषा का उपयोग करें।",
    mr: "नेहमी मराठीत उत्तर द्या. सोपी आणि स्पष्ट भाषा वापरा.",
  }[lang];

  return `You are **Health Insurance Saathi** — a specialised AI advisor for Indian health insurance.

## User's Real Data (always reference this)
- Name: ${name} | City: ${city} | Income: ${income}
- Family: ${familyStr}

## Current Policies
${policyStr}

## Pending Claims
${claimStr}

## Your Strict Domain
You ONLY answer questions about:
✅ Indian health insurance (IRDAI regulations, policy terms, claim processes)
✅ Cashless & reimbursement claims
✅ Policy comparison, features (PED waiting, restoration, NCB, room rent, copay)
✅ Coverage gaps and recommendations for this specific family
✅ Hospital networks, TPAs, cashless hospitals
✅ Government schemes: PMJAY, state schemes, CGHS, ESIC
✅ Premium calculations, renewal, porting
✅ Medical cost estimates for procedures in India
✅ Insurance documents: discharge summary, claim forms, policy wording

❌ For NON-insurance topics say: "I'm your dedicated health insurance advisor. I can only help with insurance-related questions. What would you like to know about your coverage?"

## Response Rules
- ${langRule}
- Reference user's actual policies and family members BY NAME when relevant
- Use ₹ and Indian number format (₹5,00,000)
- Be concise (under 200 words) unless asked for detail
- Use markdown: **bold** key terms, bullet points for lists
- Cite IRDAI guidelines where applicable
- Be warm, helpful, and practical`;
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, isLast, loading }: { msg: AIMessage; isLast: boolean; loading: boolean }) {
  const isUser  = msg.role === "user";
  const isEmpty = msg.content === "" && isLast && loading;
  const isQuota = !isEmpty && msg.role === "assistant" && msg.content.startsWith("⏳");
  const isSetup = !isEmpty && msg.role === "assistant" && msg.content.startsWith("⚠️");

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? "bg-accent" : isQuota ? "bg-warning" : isSetup ? "bg-destructive/80" : "bg-primary"
      }`}>
        {isUser ? <User className="h-3.5 w-3.5 text-accent-foreground" />
          : <Bot className="h-3.5 w-3.5 text-primary-foreground" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : isQuota
          ? "bg-warning/10 border border-warning/30 text-card-foreground rounded-tl-sm"
          : isSetup
          ? "bg-destructive/5 border border-destructive/20 text-card-foreground rounded-tl-sm"
          : "bg-secondary text-secondary-foreground rounded-tl-sm"
      }`}>
        {isEmpty ? (
          <span className="flex gap-1 items-center h-5">
            {[0,150,300].map(d => (
              <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: `${d}ms` }} />
            ))}
          </span>
        ) : isUser ? (
          <p>{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none
            [&>p]:mb-1.5 [&>ul]:mb-1.5 [&>ol]:mb-1.5 [&>p:last-child]:mb-0">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Setup banner ──────────────────────────────────────────────────────────────
function SetupBanner() {
  return (
    <div className="mx-1 mb-3 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-700 rounded-xl text-xs">
      <p className="font-semibold text-green-800 dark:text-green-200 mb-1">✅ Free OpenRouter AI Active</p>
      <p className="text-green-700 dark:text-green-300">Your chat is powered by OpenRouter AI with 100+ free models. All features ready!</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const ChatAssistant = () => {
  const { profile }  = useAuth();
  const { members }  = useFamilyMembers();
  const { policies } = usePolicies();
  const { claims }   = useClaims();
  const { ask: askAI, loading: aiLoading, error: aiError } = useAIService();

  const [lang, setLang]     = useState<"en" | "hi" | "mr">("en");
  const [input, setInput]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [messages, setMsgs] = useState<AIMessage[]>([]);
  const [lastFailed, setLastFailed] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement>(null);

  // Build personalised welcome
  const welcome = useCallback((): AIMessage => {
    const firstName = profile?.fullName?.split(" ")[0] || "there";
    const pCount    = policies.length;
    const pending   = claims.filter(c => !["Settled","Rejected"].includes(c.status)).length;

    const body: Record<"en" | "hi" | "mr", string> = {
      en: `Namaste ${firstName}! 🙏 I'm **Health Insurance Saathi**, your personal insurance advisor.\n\n${
        pCount
          ? `You have **${pCount} polic${pCount > 1 ? "ies" : "y"}**${pending ? ` and **${pending} pending claim${pending > 1 ? "s" : ""}**` : ""}. I know your real data — ask me anything.\n\n`
          : ""
      }I specialise in:\n- 📋 Policy terms & conditions\n- 🏥 Cashless claim guidance\n- 💰 Pre-hospitalisation cost estimates\n- ⚠️ Coverage gap analysis\n- 🏛️ PMJAY & government schemes\n\nWhat would you like to know?`,
      hi: `नमस्ते ${firstName}! 🙏 मैं **Health Insurance Saathi** हूं।\n${pCount ? `आपकी ${pCount} पॉलिसी है।` : ""} मैं आपकी बीमा सम्बंधित हर सवाल का जवाब दे सकता हूं।`,
      mr: `नमस्कार ${firstName}! 🙏 मी **Health Insurance Saathi** आहे.\n${pCount ? `तुमच्याकडे ${pCount} पॉलिसी आहेत.` : ""} तुमच्या विम्याबद्दल मला विचारा.`,
    };
    return { role: "assistant", content: body[lang] };
  }, [profile, policies, claims, lang]);

  // Reset on lang change or profile load
  useEffect(() => {
    setMsgs([welcome()]);
  }, [lang, profile?.userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const system = buildSystem(lang, profile, members, policies, claims);

  // ── Send ──────────────────────────────────────────────────────────────────
  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setInput("");
    setLastFailed("");

    const userMsg: AIMessage = { role: "user", content: t };
    const history = [...messages, userMsg];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setLoad(true);

    try {
      const reply = await askAI(t, system);
      setMsgs(prev => { const u = [...prev]; u[u.length-1] = { role:"assistant", content: reply }; return u; });
      setLoad(false);
    } catch (err: any) {
      const errText = `Sorry, something went wrong. Please try again.`;
      setMsgs(prev => { const u = [...prev]; u[u.length-1] = { role:"assistant", content: errText }; return u; });
      setLastFailed(t);
      setLoad(false);
    }
  };

  const retry = () => { if (lastFailed) send(lastFailed); };
  const clear = () => { setMsgs([welcome()]); setLastFailed(""); };

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 5rem)" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground leading-tight">Health Insurance Saathi</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">OpenRouter AI (Free)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lang switcher */}
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
            {(["en", "hi", "mr"] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${
                  lang === l
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {LANGS[l].label}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={clear} title="Clear chat">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Setup banner */}
      <SetupBanner />

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto bg-card rounded-2xl border border-border p-4 space-y-3 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <Bubble key={i} msg={msg} isLast={i === messages.length - 1} loading={loading} />
          ))}
        </AnimatePresence>

        {/* Retry button after quota error */}
        {lastFailed && !loading && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex justify-center">
            <Button variant="outline" size="sm" onClick={retry} className="gap-2 text-xs h-7">
              <RefreshCw className="h-3 w-3" /> Retry: "{lastFailed.slice(0, 30)}{lastFailed.length > 30 ? "…" : ""}"
            </Button>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick prompts (shown when chat is fresh) ── */}
      {messages.length <= 1 && (
        <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
          className="flex flex-wrap gap-1.5 pt-3">
          {QUICK_PROMPTS.map(q => (
            <button key={q.q} onClick={() => send(q.q)} disabled={loading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-secondary hover:bg-muted
                         rounded-full border border-border transition-colors disabled:opacity-40">
              <q.icon className="h-3 w-3 text-primary" />
              {q.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* ── Input ── */}
      <div className="flex gap-2 pt-3 flex-shrink-0">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder={loading ? "AI is thinking…" : LANGS[lang].placeholder}
          className="flex-1 min-h-[44px] max-h-28 resize-none py-3 text-sm rounded-xl"
          disabled={loading}
          rows={1}
        />
        <Button onClick={() => send(input)} disabled={!input.trim() || loading}
          className="h-11 w-11 rounded-xl flex-shrink-0 p-0">
          {loading
            ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* ── Footer ── */}
      <p className="text-center text-xs text-muted-foreground pt-2 pb-0.5 flex-shrink-0">
        <Shield className="h-3 w-3 inline mr-1 text-primary" />
        Specialised in Indian health insurance · IRDAI · Your real policy data
      </p>
    </div>
  );
};

export default ChatAssistant;
