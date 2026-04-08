import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Square, Star, Sparkles, Loader2, Globe, Plus, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAIPolicyComparison, useCompareHiddenThings } from "@/hooks/useAIFeatures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePolicies } from "@/hooks/useUserData";
import { askClaude, askClaudeWithSearch, askClaudeJSON } from "@/lib/claude";
import ReactMarkdown from "react-markdown";
import { RevealHiddenThings } from "@/components/RevealHiddenThings";
import { useInsurancePlans } from "@/hooks/useInsurancePlans";


const FIELDS = [
  { key: "roomRent", label: "Room Rent" },
  { key: "subLimits", label: "Sub-limits" },
  { key: "coPay", label: "Co-payment" },
  { key: "restoration", label: "Restoration" },
  { key: "ncb", label: "No-Claim Bonus" },
  { key: "ayush", label: "Ayush Cover" },
  { key: "maternity", label: "Maternity" },
  { key: "pedWaiting", label: "PED Waiting" },
  { key: "claimSettlement", label: "Claim Ratio" },
] as const;

const ComparePolicies = () => {
  const { profile } = useAuth();
  const { policies: userPolicies } = usePolicies();
  const { plans: insurancePlans } = useInsurancePlans();
  const [selected, setSelected] = useState<string[]>([]);
  const [aiVerdict, setAiVerdict] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [liveRates, setLiveRates] = useState("");
  const [ratesLoading, setRatesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { comparison, compare, loading: comparisonLoading } = useAIPolicyComparison();

  // Merge user policies into display format
  const userPolicyCards = userPolicies.map(p => ({
    id: p.id,
    name: p.name,
    insurer: p.provider,
    premium: `₹${p.premiumAmount?.toLocaleString("en-IN")}/${p.premiumFrequency}`,
    coverage: `₹${p.coverageAmount?.toLocaleString("en-IN")}`,
    hospitals: "Your network",
    waiting: "Ongoing",
    details: {
      roomRent: "Per policy", subLimits: "Per policy", coPay: "Per policy",
      restoration: "Per policy", ncb: "Per policy", ayush: "Per policy",
      maternity: "Per policy", pedWaiting: "Per policy",
      claimSettlement: "Per policy",
    },
    isUserPolicy: true,
  }));

  // Transform insurancePlans data to market policy format
  const MARKET_POLICIES = insurancePlans.map((plan, idx) => ({
    id: `m${idx + 1}`,
    name: plan.name,
    insurer: plan.insurer,
    premium: `₹${(plan.premium * 12).toLocaleString("en-IN")}/yr`,
    coverage: `₹${(plan.coverage / 100000).toFixed(1)}L`,
    hospitals: "10,000+",
    waiting: plan.pedWait === 0 ? "Zero" : `${plan.pedWait} yrs`,
    details: {
      roomRent: "Varies",
      subLimits: "Minimal",
      coPay: "0-10%",
      restoration: `${plan.features.includes("Restore Benefit") ? "100%" : "Partial"}`,
      ncb: "10-50%",
      ayush: plan.features.includes("AYUSH") ? "Yes" : "No",
      maternity: plan.features.includes("Maternity") ? "Covered" : "Extra",
      pedWaiting: `${plan.pedWait} yrs`,
      claimSettlement: `${plan.claimRatio}%`,
    },
  }));

  const allPolicies = [...userPolicyCards, ...MARKET_POLICIES];
  const selectedPolicies = allPolicies.filter(p => selected.includes(p.id));

  // Log when policies are loaded
  useEffect(() => {
    console.log("[ComparePolicies] User policies loaded:", userPolicies.length, "policies", userPolicies);
  }, [userPolicies.length]);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
    setAiVerdict(""); setLiveRates("");
  };

  const getAIVerdict = async () => {
    if (selectedPolicies.length < 2) return;
    setAiLoading(true);
    setAiVerdict("");
    const summary = selectedPolicies.map(p =>
      `${p.name} (${p.insurer}): Premium ${p.premium}, Coverage ${p.coverage}, CSR ${p.details.claimSettlement}, Restoration ${p.details.restoration}, Co-pay ${p.details.coPay}, NCB ${p.details.ncb}, Maternity ${p.details.maternity}`
    ).join("\n");

    const familyCtx = `User: ${profile?.fullName || "User"}, ${profile?.city || "India"}, age ${profile?.age || "unknown"}, income ${profile?.incomeRange || "unknown"}`;
    try {
      const verdict = await askClaude(
        `You are an expert Indian health insurance advisor. Compare the given policies for this user's specific situation. Use markdown with clear sections. Be specific and practical.`,
        `${familyCtx}\n\nCompare these policies:\n${summary}\n\nWhich is best for this user and why? Include pros/cons, hidden gotchas, and a clear winner.`
      );
      setAiVerdict(verdict);
      console.log("✅ AI Verdict generated successfully");
      
      // Generate AI comparison
      if (selectedPolicies.length >= 2) {
        compare(selectedPolicies[0], selectedPolicies[1]).catch(err => 
          console.warn("⚠️ Comparison generation failed:", err)
        );
      }
    } catch (error: any) {
      console.error("❌ AI Verdict failed:", error);
      const errorMsg = error?.message || String(error) || "Unknown error";
      setAiVerdict(`⚠️ Error: ${errorMsg}\n\nTrying alternative approach...Please check browser console for details.`);
    } finally {
      setAiLoading(false);
    }
  };

  const getLiveRates = async () => {
    if (selectedPolicies.length < 2) return;
    setRatesLoading(true);
    setLiveRates("");
    try {
      const policyNames = selectedPolicies.map(p => `${p.name} by ${p.insurer}`).join(", ");
      const rates = await askClaudeWithSearch(
        "You are an Indian health insurance market analyst. Provide factual comparison of these policies based on available knowledge about Indian health insurance plans. Give a 3-4 sentence comparison with claim settlement ratios and key features.",
        `Compare these Indian health insurance policies: ${policyNames}. Include claim settlement ratios, key features, and recommendations.`
      );
      setLiveRates(rates);
      console.log("✅ Live rates fetched successfully");
    } catch (error: any) {
      console.error("❌ Live rates fetch failed:", error);
      const errorMsg = error?.message || String(error) || "Unknown error";
      setLiveRates(`⚠️ Error: ${errorMsg}\n\nUsing policy data from our database. Check console for details.`);
    } finally {
      setRatesLoading(false);
    }
  };

  const searchNewPolicy = async () => {
    if (!searchQuery) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const result = await askClaudeWithSearch(
        `You are an Indian health insurance expert. For the given policy name, provide details in JSON format. Return a JSON array with 1-3 matching policies. Each object should have: {name, insurer, coverage, premium, claimSettlement, highlight}. Return ONLY the JSON array, no markdown.`,
        `Find Indian health insurance policy matching: "${searchQuery}". Provide pricing, claim settlement ratio, and key features in JSON format.`
      );
      const clean = result.replace(/```json|```/g, "").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setSearchResults(Array.isArray(parsed) ? parsed : []);
        console.log("✅ Policy search results:", parsed);
      } else {
        console.warn("⚠️ Could not parse search results:", clean);
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error("❌ Policy search failed:", error);
      setSearchResults([]);
    }
    finally { setSearchLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <div>
        <div className="text-sm font-medium tracking-widest text-emerald-700 dark:text-emerald-200 mb-3">01 / COMPARE</div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compare Policies</h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-700 dark:text-emerald-300" /> Side-by-side comparison with live market data and AI insights
            </p>
          </div>
        <Button variant="outline" size="sm" onClick={() => setShowSearch(true)} className="gap-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200/30">
          <Globe className="h-4 w-4" /> Search Any Policy
        </Button>
      </div>

      </div>

      {/* Your policies section */}
      {userPolicyCards.length > 0 && (
        <div>
          <div className="text-xs font-medium tracking-widest text-emerald-700/60 dark:text-emerald-200/60 mb-4">YOUR POLICIES</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPolicyCards.map(p => {
              const isSel = selected.includes(p.id);
              return (
                <motion.div key={p.id} whileHover={{ scale: 1.02 }} onClick={() => toggle(p.id)}
                  className={`bg-card rounded-lg p-5 card-shadow cursor-pointer transition-all border-2 ${isSel ? "border-primary" : "border-success/30"}`}>
                  <div className="flex items-center justify-between mb-2">
                    {isSel ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">{p.insurer}</Badge>
                      <Badge className="text-xs bg-success/10 text-success border-success/20">Your Policy</Badge>
                    </div>
                  </div>
                  <h3 className="font-semibold text-card-foreground">{p.name}</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Coverage</span><span className="font-medium">{p.coverage}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Premium</span><span className="font-medium">{p.premium}</span></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Market policies */}
      <div>
        <div className="text-xs font-medium tracking-widest text-emerald-700/60 dark:text-emerald-200/60 mb-4">MARKET PLANS</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {MARKET_POLICIES.map(p => {
            const isSel = selected.includes(p.id);
            return (
              <motion.div key={p.id} whileHover={{ scale: 1.02 }} onClick={() => toggle(p.id)}
                className={`bg-card rounded-lg p-4 card-shadow cursor-pointer transition-all ${isSel ? "ring-2 ring-primary" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  {isSel ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                  <Badge variant="secondary" className="text-xs">{p.insurer}</Badge>
                </div>
                <h3 className="font-semibold text-card-foreground text-sm">{p.name}</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Premium</span><span className="font-medium">{p.premium}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Coverage</span><span className="font-medium">{p.coverage}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CSR</span><span className="font-medium text-success">{p.details.claimSettlement}</span></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {selected.length >= 2 && (
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button onClick={getAIVerdict} disabled={aiLoading} className="gap-2">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? "Analysing…" : "Get AI Verdict"}
            </Button>
            <Button variant="outline" onClick={getLiveRates} disabled={ratesLoading} className="gap-2">
              {ratesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              {ratesLoading ? "Fetching live data…" : "Get Live Rates & CSR"}
            </Button>
            {selectedPolicies.length === 2 && (
              <RevealHiddenThings 
                policyDetails={{
                  plan1: selectedPolicies[0],
                  plan2: selectedPolicies[1],
                }}
                buttonText="⚠️ Reveal Hidden Things"
                buttonVariant="destructive"
              />
            )}
          </div>

          {/* Comparison table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg card-shadow overflow-x-auto">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">Side-by-Side Comparison</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Feature</th>
                  {selectedPolicies.map(p => (
                    <th key={p.id} className="text-left p-3 font-semibold text-card-foreground">
                      {p.name}
                      {(p as any).isUserPolicy && <Badge className="ml-1 text-[10px] bg-success/10 text-success border-success/20">Yours</Badge>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELDS.map(field => (
                  <tr key={field.key} className="border-b border-border last:border-0">
                    <td className="p-3 text-muted-foreground">{field.label}</td>
                    {selectedPolicies.map(p => (
                      <td key={p.id} className="p-3 text-card-foreground font-medium">{p.details[field.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Live rates */}
          {liveRates && (
            <div className="bg-card rounded-lg p-4 card-shadow border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-card-foreground">Live Market Data</h3>
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">Real-time</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{liveRates}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* AI Verdict */}
          {(aiLoading || aiVerdict) && (
            <div className="bg-card rounded-lg p-6 card-shadow border-l-4 border-l-primary">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-card-foreground">AI Recommendation</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">AI</span>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Comparing policies for your profile…
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{aiVerdict}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* AI Comparison Summary */}
          {(comparisonLoading || comparison) && (
            <div className="bg-card rounded-lg p-6 card-shadow border-l-4 border-l-orange-500">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-orange-500" />
                <h2 className="font-semibold text-card-foreground">Deep Comparison Analysis</h2>
                {comparisonLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto text-orange-500" />}
              </div>
              {comparisonLoading ? (
                <p className="text-sm text-muted-foreground italic">Analyzing policy features and generating comprehensive comparison...</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{comparison}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search any policy dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Search Any Indian Insurance Policy</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="e.g. Niva Bupa Reassure, Max Bupa, New India Mediclaim…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchNewPolicy()} />
              <Button onClick={searchNewPolicy} disabled={!searchQuery || searchLoading} className="gap-2">
                {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              </Button>
            </div>
            {searchResults.map((r, i) => (
              <div key={i} className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-card-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.insurer}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">CSR: {r.claimSettlement}</Badge>
                </div>
                <div className="flex gap-4 text-xs mt-2 text-muted-foreground">
                  <span>Coverage: <strong className="text-card-foreground">{r.coverage}</strong></span>
                  <span>Premium: <strong className="text-card-foreground">{r.premium}</strong></span>
                </div>
                {r.highlight && <p className="text-xs text-primary mt-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> {r.highlight}</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComparePolicies;
