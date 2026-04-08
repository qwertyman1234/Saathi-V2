import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Search, Hospital, Shield, Sparkles, Loader2, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePolicies } from "@/hooks/useUserData";
import { askClaudeWithSearch, askClaudeJSON } from "@/lib/claude";
import {
  searchHospitalsRealTime,
  getLocationFromPostalCode,
  getSupportedCities,
  type HospitalFromAPI,
} from "@/lib/firebase/realHospitals";
import ReactMarkdown from "react-markdown";

type HospitalResult = HospitalFromAPI & {
  aiTip?: string;
  matchScore?: number;
  networks?: string[];
};

type PlanResult = {
  name: string;
  insurer: string;
  coverage: string;
  premium: string;
  highlight: string;
};

const INDIAN_STATES = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat",
  "Rajasthan", "Uttar Pradesh", "West Bengal", "Telangana",
  "Kerala", "Punjab", "Madhya Pradesh", "Odisha", "Assam", "Haryana",
];

const HyperlocalSearch = () => {
  const { profile } = useAuth();
  const { policies } = usePolicies();

  const [state, setState] = useState(profile?.state ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [pin, setPin] = useState(profile?.pincode ?? "");
  const [specialty, setSpecialty] = useState("");

  const [hospitals, setHospitals] = useState<HospitalResult[]>([]);
  const [plans, setPlans] = useState<PlanResult[]>([]);
  const [govScheme, setGovScheme] = useState("");
  const [locationInsight, setLocationInsight] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hospitalTips, setHospitalTips] = useState<Record<string, string>>({});
  const [tipLoading, setTipLoading] = useState<string | null>(null);

  const userPoliciesContext = policies.length > 0
    ? policies.map(p => `${p.name} by ${p.provider} (₹${p.coverageAmount?.toLocaleString("en-IN")})`).join(", ")
    : "No active policies";

  const doSearch = async () => {
    const location = city || state;
    if (!location) return;
    setLoading(true);
    setHospitals([]); setPlans([]); setGovScheme(""); setLocationInsight("");
    setSearched(true);

    try {
      // 1. Get REAL hospitals from Overpass API (OpenStreetMap - completely free)
      const hospitalsData = await searchHospitalsRealTime(
        city || undefined,
        pin || undefined,
        15 // 15 km radius
      );

      if (hospitalsData.length === 0) {
        setLocationInsight(`No hospitals found in ${city || state}. Try expanding your search radius or checking your location.`);
        setHospitals([]);
      } else {
        // Add network info (for display, user can add their networks)
        const enhancedHospitals: HospitalResult[] = hospitalsData.map(h => ({
          ...h,
          networks: ["Check your policy for accepted networks"],
          matchScore: 75, // Default score for real hospitals
        }));

        setHospitals(enhancedHospitals);

        // Generate AI insurance tips for top hospitals (parallel execution)
        const aiTipsPromises = enhancedHospitals.slice(0, 3).map(async h => {
          try {
            const tip = await askClaudeWithSearch(
              "You are a health insurance cashless claim expert. Give a 2-sentence practical tip about using cashless insurance at hospitals.",
              `Hospital: ${h.name}, ${h.address}. Located in ${h.city}, ${h.state}. Emergency services: ${h.emergency ? "Yes" : "No"}. User policies: ${userPoliciesContext}. What is the best way to use cashless insurance at this hospital?`
            );
            return { hospitalId: h.id, tip };
          } catch {
            return { hospitalId: h.id, tip: undefined };
          }
        });

        try {
          const aiTips = await Promise.all(aiTipsPromises);
          const tipsMap = Object.fromEntries(
            aiTips.map(t => [t.hospitalId, t.tip]).filter(([_, tip]) => tip)
          );

          setHospitals(prev =>
            prev.map(h => ({
              ...h,
              aiTip: tipsMap[h.id],
            }))
          );
        } catch {
          // Tips loading failed, continue without them
          console.warn("Could not load AI tips");
        }
      }

      // 2. Get recommended plans & schemes (parallel)
      const [plansRes, schemeInsight] = await Promise.all([
        askClaudeWithSearch(
          `You are an Indian health insurance plan recommender. Return a JSON array of 3 best plans for this location, each with: {name, insurer, coverage, premium, highlight}.`,
          `What are the best health insurance plans available in ${state || city}, India? User currently has: ${userPoliciesContext}.`
        ),
        askClaudeWithSearch(
          "You are an Indian health insurance expert. Give a 2-sentence insight about government schemes and cashless facilities.",
          `What government health insurance schemes are available in ${state || city}, India? PMJAY status? Give practical insight for finding cashless hospitals.`
        ),
      ]);

      // Parse plans
      try {
        const pClean = plansRes.replace(/```json|```/g, "").trim();
        const pMatch = pClean.match(/\[[\s\S]*\]/);
        if (pMatch) setPlans(JSON.parse(pMatch[0]));
      } catch { setPlans([]); }

      setLocationInsight(schemeInsight);

    } catch (e) {
      console.error("Search error:", e);
      setLocationInsight("Unable to fetch hospital data. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const getHospitalTip = async (hospital: HospitalResult) => {
    setTipLoading(hospital.id);
    try {
      const tip = await askClaudeWithSearch(
        "You are a health insurance cashless claim expert. Search for specific tips about using insurance at this hospital. Give a 2-sentence practical tip.",
        `User has: ${userPoliciesContext}. Hospital: ${hospital.name}, ${hospital.address}. Located in ${hospital.city}, ${hospital.state}. What is the best way to use cashless insurance at this specific hospital?`
      );
      setHospitalTips(prev => ({ ...prev, [hospital.id]: tip }));
    } catch {
      setHospitalTips(prev => ({ ...prev, [hospital.id]: hospital.aiTip || "" }));
    } finally {
      setTipLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hyperlocal Hospital & Plan Finder</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1">
          <Globe className="h-4 w-4 text-primary" /> Live search for cashless hospitals and best plans in your area
        </p>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg p-6 card-shadow space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">City</label>
            <Input placeholder="e.g. Pune, Mumbai, Delhi" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">State</label>
            <Input list="states" placeholder="e.g. Maharashtra" value={state} onChange={e => setState(e.target.value)} />
            <datalist id="states">{INDIAN_STATES.map(s => <option key={s} value={s} />)}</datalist>
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">PIN Code (optional)</label>
            <Input placeholder="e.g. 411001" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">Specialty (optional)</label>
            <Input placeholder="e.g. Cardiology, Ortho" value={specialty} onChange={e => setSpecialty(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={doSearch} disabled={(!city && !state) || loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            {loading ? "Searching live data…" : "Search with AI"}
          </Button>
          {profile?.city && (
            <Button variant="outline" size="sm" onClick={() => { setCity(profile.city); setState(profile.state || ""); setPin(profile.pincode || ""); }}
              className="gap-1 text-xs">
              <MapPin className="h-3 w-3" /> Use my location ({profile.city})
            </Button>
          )}
        </div>

        {policies.length > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Searching for hospitals that accept: {policies.map(p => p.provider).join(", ")}
          </p>
        )}
      </div>

      {loading && (
        <div className="bg-card rounded-lg p-8 card-shadow text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Globe className="h-8 w-8 text-primary animate-pulse" />
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="font-medium text-card-foreground">Searching live hospital data…</p>
          <p className="text-sm text-muted-foreground mt-1">Finding cashless hospitals, government schemes, and best plans for {city || state}</p>
        </div>
      )}

      {searched && !loading && (
        <div className="space-y-6">
          {/* Government scheme / location insight */}
          {locationInsight && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-primary">Government Schemes & Market Insight</span>
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">Live</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{locationInsight}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hospitals */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Hospital className="h-5 w-5" />
                Cashless Hospitals in {city || state}
                {hospitals.length > 0 && <Badge variant="secondary">{hospitals.length} found</Badge>}
              </h2>

              {hospitals.length === 0 ? (
                <div className="bg-card rounded-lg p-8 card-shadow text-center text-muted-foreground">
                  <p>No hospitals found. Try searching by city or state.</p>
                </div>
              ) : hospitals.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-card rounded-lg p-5 card-shadow hover:shadow-md transition-all border border-muted/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground">{h.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {h.address || "Location info available"}
                      </p>
                    </div>
                    {h.distance && (
                      <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                        {h.distance} km away
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {h.emergency && (
                      <Badge className="bg-destructive text-destructive-foreground text-xs gap-1">
                        🚨 24/7 Emergency
                      </Badge>
                    )}
                    {h.website && (
                      <a href={h.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        Website <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {h.phone && (
                    <p className="text-xs text-muted-foreground mb-3">📞 {h.phone}</p>
                  )}

                  {/* AI tip */}
                  <div className="p-2 bg-primary/5 rounded border border-primary/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Tip</span>
                      {!hospitalTips[h.id] && !h.aiTip && (
                        <Button variant="ghost" size="sm" className="h-5 text-xs px-2"
                          onClick={() => getHospitalTip(h)} disabled={tipLoading === h.id}>
                          {tipLoading === h.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Load"}
                        </Button>
                      )}
                    </div>
                    {(hospitalTips[h.id] || h.aiTip) && (
                      <p className="text-xs text-muted-foreground mt-1">{hospitalTips[h.id] || h.aiTip}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recommended Plans */}
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5" /> Best Plans in {state || city}
              </h2>

              {plans.length === 0 ? (
                <div className="bg-card rounded-lg p-4 card-shadow text-sm text-muted-foreground">
                  Plan data loading…
                </div>
              ) : plans.map((p, i) => (
                <div key={i} className="bg-card rounded-lg p-4 card-shadow">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-card-foreground text-sm">{p.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{p.insurer}</p>
                  <div className="space-y-1 text-sm mb-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Coverage</span><span className="font-medium text-card-foreground">{p.coverage}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Premium</span><span className="font-medium text-success">{p.premium}</span></div>
                  </div>
                  {p.highlight && (
                    <p className="text-xs text-primary bg-primary/5 rounded p-1.5 flex items-start gap-1">
                      <Sparkles className="h-3 w-3 flex-shrink-0 mt-0.5" />{p.highlight}
                    </p>
                  )}
                </div>
              ))}

              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-xs text-muted-foreground">
                <strong className="text-card-foreground block mb-1">PMJAY — Free ₹5L/year</strong>
                Check eligibility at <span className="text-primary">pmjay.gov.in</span> — covers 10 crore+ families across India.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HyperlocalSearch;
