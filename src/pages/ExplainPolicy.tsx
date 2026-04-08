import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, User, Loader2, Globe, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIPolicyExplainer } from "@/hooks/useAIFeatures";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyMembers, usePolicies } from "@/hooks/useUserData";
import { askAI } from "@/lib/aiService";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { RevealHiddenThings } from "@/components/RevealHiddenThings";

const SAMPLE_CLAUSES = [
  { label: "PED Waiting Period", text: "The policy shall not cover any claims arising out of pre-existing diseases until 48 months of continuous coverage have elapsed since inception." },
  { label: "Room Rent Capping", text: "Room rent is limited to 1% of sum insured per day. If the insured opts for a higher category room, all other charges shall be proportionately reduced." },
  { label: "Co-payment Clause", text: "A co-payment of 20% shall be applicable for all claims where the insured is above 60 years of age at the time of hospitalisation." },
  { label: "Restoration Benefit", text: "Upon exhaustion of the sum insured during the policy year, the basic sum insured shall be automatically restored once, subject to the restoration not being used for the same illness." },
];

const ExplainPolicy = () => {
  const { profile } = useAuth();
  const { members } = useFamilyMembers();
  const { policies } = usePolicies();
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [explanation, setExplanation] = useState("");
  const [personalized, setPersonalized] = useState("");
  const [liveContext, setLiveContext] = useState("");
  const [loading, setLoading] = useState(false);
  const { explanation: aiExplanation, explain, loading: explanationLoading } = useAIPolicyExplainer();

  // Log when policies and family data are loaded
  useEffect(() => {
    console.log("[ExplainPolicy] Policies loaded:", policies.length, "policies", policies);
    console.log("[ExplainPolicy] Family members loaded:", members.length, "members");
  }, [policies.length, members.length]);

  const familyContext = [
    `${profile?.fullName || "User"} (Self${profile?.city ? ", " + profile.city : ""})`,
    ...members.map((m: any) => `${m.name} (${m.relation}${m.conditions?.filter((c: string) => c !== "None").length ? ", " + m.conditions.filter((c: string) => c !== "None").join(", ") : ""})`),
  ].join(", ");

  const policyContext = policies.length > 0
    ? policies.map(p => `${p.name} by ${p.provider}, ₹${p.coverageAmount?.toLocaleString("en-IN")}`).join("; ")
    : "No policies added";

  const handleExplain = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setExplanation(""); setPersonalized(""); setLiveContext("");

    try {
      const [exp, pers, live] = await Promise.all([
        // Plain English explanation
        askAI(
          `You are a friendly Indian health insurance expert. Explain policy clauses simply and clearly.
           
For the given insurance clause, provide:
1. **In Simple Words** — plain language explanation without jargon
2. **Real Example** — relatable Indian example (e.g., diabetic patient, BP condition)
3. **Key Takeaways** — 3-5 bullet point summaries
4. **Potential Traps** — hidden issues or gotchas to watch out for
5. **Your Rights** — what policyholders should know

Use markdown formatting with clear sections. Be warm and conversational.`,
          `Explain this insurance clause:\n\n"${text}"`
        ),
        // Personalized to user's actual family/policies
        askAI(
          `You are a personalized health insurance advisor for Indian families.
           
User Profile:
- Family: ${familyContext}
- Current Policies: ${policyContext}

For the given insurance clause, explain:
1. How it specifically affects this family based on their profile
2. Which family members are most impacted
3. Practical implications for their situation
4. Steps they should take (if any)
5. Questions to ask their insurance provider

Be specific, practical, and use markdown. Include numbers and examples relevant to Indian healthcare costs.`,
          `How does this clause affect my family?\n\nClause: "${text}"\n\nFamily: ${familyContext}\nPolicies: ${policyContext}`
        ),
        // IRDAI/legal context
        askAI(
          `You are an Indian insurance law and IRDAI regulations expert.
           
For the given insurance clause, provide:
1. **IRDAI Regulations** — relevant IRDAI guidelines that apply (if any)
2. **Recent Updates** — any new regulations or clarifications (2024-2025)
3. **Court Rulings** — what Indian courts have ruled on similar clauses
4. **Industry Standard** — how other insurers handle this
5. **Consumer Rights** — what policyholders should know about their rights

Provide a comprehensive analysis with regulatory basis. Use markdown formatting.`,
          `What are the regulations and legal position on: ${text.slice(0, 300)}`
        ),
      ]);

      setExplanation(exp);
      setPersonalized(pers);
      setLiveContext(live);
      
      // Generate AI explanation from hook
      explain(text.slice(0, 500), policyContext);
    } catch (err) {
      console.error("Explanation error:", err);
      toast.error("AI explanation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const searchTerm = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setExplanation(""); setPersonalized(""); setLiveContext("");
    try {
      const result = await askAI(
        `You are an expert Indian health insurance advisor. Explain this insurance term or concept clearly and comprehensively.
         
Context: This is about Indian health insurance, IRDAI regulations, and insurance terminology.

Please provide:
1. **Simple Explanation** - in plain language
2. **Key Points** - 3-4 important facts
3. **Common Misconceptions** - what people get wrong
4. **Practical Tips** - actionable advice for policyholders
5. **IRDAI/Regulatory** - relevant regulations or guidelines

Use markdown formatting with clear sections.`,
        `Explain this Indian health insurance concept: "${searchQuery}"`
      );
      setExplanation(result);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <h1 className="text-2xl font-bold text-foreground">AI Policy Explainer</h1>

      {/* Search any insurance term */}
      <div className="bg-card rounded-lg p-4 card-shadow">
        <label className="text-sm font-medium text-card-foreground mb-2 block flex items-center gap-1">
          <Globe className="h-4 w-4 text-primary" /> Search any insurance term or concept
        </label>
        <div className="flex gap-2">
          <Input placeholder="e.g. IRDAI cashless claim rules 2025, copay waiver, restoration benefit..." 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchTerm()} />
          <Button onClick={searchTerm} disabled={!searchQuery || loading} className="gap-2">
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
      </div>

      {/* Paste clause */}
      <div className="bg-card rounded-lg p-6 card-shadow space-y-4">
        <label className="text-sm font-medium text-card-foreground block">Or paste a policy clause</label>
        <Textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="Paste a clause from your policy document here..." className="min-h-[120px]" />
        <div className="flex gap-2 flex-wrap">
          {SAMPLE_CLAUSES.map(s => (
            <Button key={s.label} variant="outline" size="sm" onClick={() => setText(s.text)} className="text-xs">
              {s.label}
            </Button>
          ))}
        </div>
        <Button onClick={handleExplain} disabled={!text || loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "AI is explaining…" : "Explain with AI + Live IRDAI Data"}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 p-4 bg-card rounded-lg card-shadow">
          <div className="flex gap-2">
            <Globe className="h-5 w-5 text-primary animate-pulse" />
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Claude is explaining your clause, personalising it for your family, and searching IRDAI guidelines…</p>
        </div>
      )}

      {explanation && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Plain explanation */}
          <div className="bg-card rounded-lg p-6 card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-card-foreground">Simplified Explanation</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">AI</span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
              <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
          </div>

          {/* Personalized */}
          {personalized && (
            <div className="bg-card rounded-lg p-6 card-shadow border-l-4 border-l-primary">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-card-foreground">What This Means for Your Family</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">Personalised</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
                <ReactMarkdown>{personalized}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Live IRDAI context */}
          {liveContext && (
            <div className="bg-card rounded-lg p-6 card-shadow border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-5 w-5 text-blue-500" />
                <h2 className="font-semibold text-card-foreground">Latest IRDAI Regulatory Position</h2>
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full ml-auto">Live Data</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
                <ReactMarkdown>{liveContext}</ReactMarkdown>
              </div>
            </div>
          )}

          {(explanationLoading || aiExplanation) && (
            <div className="bg-card rounded-lg p-6 card-shadow border-l-4 border-l-green-500">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-green-500" />
                <h2 className="font-semibold text-card-foreground">Quick Summary by AI</h2>
                {explanationLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto text-green-500" />}
              </div>
              {explanationLoading ? (
                <p className="text-sm text-muted-foreground italic">Generating quick summary...</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
                  <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {(explanation || personalized || liveContext || aiExplanation) && (
            <div className="flex flex-col gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Want to know what insurance companies try to hide?
              </p>
              <RevealHiddenThings 
                policyDetails={{
                  clause: text || searchQuery,
                  context: policyContext,
                  familyProfile: familyContext,
                }}
                buttonText="🔍 Reveal What's Hidden in This Clause"
                buttonVariant="default"
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ExplainPolicy;
