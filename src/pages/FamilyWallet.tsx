import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Plus, FileDown, User, Sparkles, Loader2, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyMembers, usePolicies } from "@/hooks/useUserData";
import { askClaudeJSON, askClaudeWithSearch } from "@/lib/claude";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const CONDITIONS = ["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Cancer", "Kidney Disease", "None"];

type RiskAssessment = {
  memberId: string;
  risk: "high" | "warning" | "good";
  aiScore: number;
  note: string;
};

const FamilyWallet = () => {
  const { profile } = useAuth();
  const { members, addMember, removeMember, loading: membersLoading } = useFamilyMembers();
  const { policies } = usePolicies();
  const [riskData, setRiskData] = useState<Record<string, RiskAssessment>>({});
  const [riskLoading, setRiskLoading] = useState(false);
  const [familySummary, setFamilySummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", relation: "", dateOfBirth: "", gender: "Male", conditions: [] as string[] });
  const [saving, setSaving] = useState(false);

  const allMembers = [
    { id: "self", name: profile?.fullName || "You", relation: "Self", gender: profile?.gender || "", conditions: [], dateOfBirth: profile?.dateOfBirth || "" },
    ...members,
  ];

  // Debug logging
  useEffect(() => {
    console.log("FamilyWallet Debug:", {
      membersLoading,
      membersCount: members.length,
      allMembersCount: allMembers.length,
      riskDataCount: Object.keys(riskData).length,
      profileName: profile?.fullName,
      members: members.map(m => ({ id: m.id, name: m.name })),
    });
  }, [membersLoading, members, allMembers.length, profile]);

  const analyzeRisks = async () => {
    if (allMembers.length === 0) return;
    setRiskLoading(true);
    try {
      const calculateAge = (dob: string) => {
        if (!dob) return null;
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
      };

      const memberList = allMembers.map(m => ({
        id: m.id,
        name: m.name,
        relation: m.relation,
        gender: (m as any).gender || "Unknown",
        age: calculateAge((m as any).dateOfBirth) || "Unknown",
        dateOfBirth: (m as any).dateOfBirth || "",
        conditions: (m as any).conditions?.filter((c: string) => c !== "None") || [],
      }));
      const policyList = policies.map(p => `${p.name} by ${p.provider}, ₹${p.coverageAmount?.toLocaleString("en-IN")} coverage, expires ${p.expiryDate}`).join("\n") || "No policies";

      const results = await askClaudeJSON<RiskAssessment[]>(
        `You are an expert Indian health insurance risk analyst. Assess each family member's individual insurance adequacy considering their age, gender, health conditions, and family role.

For EACH member provide:
- memberId: the member's ID
- risk: "high" (critical coverage gaps), "warning" (inadequate), or "good" (adequate)
- aiScore: 0-100 (0=critical risk, 100=excellent coverage)
- note: 1 sentence specific AI insight for THIS member (mention their name and specific coverage need)

Consider: age group health needs, gender-specific medical costs in India, existing conditions, family support role, and current coverage.
Return ONLY valid JSON array, one assessment per member.`,
        `FAMILY PROFILE:
Members: ${JSON.stringify(memberList, null, 2)}
Current Policies: ${policyList || "None yet"}
Location: ${profile?.city || "India"}
Income Level: ${profile?.incomeRange || "Unknown"}
Family Size: ${allMembers.length} members

Analyze EACH member individually for insurance adequacy. Consider:
- Age-appropriate coverage (children need immunization coverage, elderly need critical care)
- Health risks from existing conditions for each member
- Family economics and coverage overlap
- Market recommendations for each member's demographic
- Priority member who needs coverage urgently`
      );

      const map: Record<string, RiskAssessment> = {};
      results.forEach(r => { map[r.memberId] = r; });
      setRiskData(map);
      console.log("[FamilyWallet] Risk analysis completed for", Object.keys(map).length, "members:", map);
    } catch (error) {
      console.error("Risk analysis failed:", error);
      // fallback: mark all as warning
      const map: Record<string, RiskAssessment> = {};
      allMembers.forEach(m => {
        map[m.id] = { memberId: m.id, risk: "warning", aiScore: 60, note: "Add your policies for a detailed risk assessment." };
      });
      setRiskData(map);
    } finally {
      setRiskLoading(false);
    }
  };

  const getFamilySummary = async () => {
    setSummaryLoading(true);
    try {
      const calculateAge = (dob: string) => {
        if (!dob) return null;
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
      };

      const memberDetails = allMembers.map(m => ({
        name: m.name,
        relation: m.relation,
        age: calculateAge((m as any).dateOfBirth),
        conditions: (m as any).conditions?.filter((c: string) => c !== "None").join(", ") || "None",
      }));

      const summary = await askClaudeWithSearch(
        "You are a family health insurance advisor specializing in Indian families. Search for current 2025 Indian family health insurance recommendations and trends. Provide strategic advice for families with multiple members.",
        `FAMILY COMPOSITION & INSURANCE STATUS:
Members: ${memberDetails.map(m => `${m.name} (${m.relation}, ${m.age ? m.age + ' yrs' : 'age unknown'}, conditions: ${m.conditions})`).join(" | ")}
Current Coverage: ${policies.length > 0 ? policies.map(p => `${p.name} ₹${p.coverageAmount?.toLocaleString("en-IN")}`).join(", ") : "No active policies"}
Location: ${profile?.city || "India"}
Family Income: ${profile?.incomeRange || "Unknown"}

REQUEST:
Based on this family composition, provide a 4-sentence executive summary addressing:
1. Critical coverage gaps (if any) by member type (children/elderly/adults with conditions)
2. Recommended priority action for this specific family
3. Current market recommendations for family coverage in ${profile?.city || "India"} 2025
4. Estimated annual cost vs risk assessment

Be specific to their family structure - don't give generic advice.`
      );
      setFamilySummary(summary);
      console.log("[FamilyWallet] Family summary generated");
    } catch (error) {
      console.error("Summary generation failed:", error);
      setFamilySummary("Add your policies and family details to get a personalised AI risk assessment for your family.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.relation || !newMember.dateOfBirth) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    const { error } = await addMember({
      name: newMember.name,
      relation: newMember.relation,
      dateOfBirth: newMember.dateOfBirth,
      gender: newMember.gender,
      conditions: newMember.conditions,
    });
    setSaving(false);
    if (error) { toast.error("Failed to add member"); return; }
    toast.success(`${newMember.name} added to your family!`);
    setNewMember({ name: "", relation: "", dateOfBirth: "", gender: "Male", conditions: [] });
    setShowAddMember(false);
    // Trigger analysis after member is added (run in parallel)
    setTimeout(() => {
      Promise.all([analyzeRisks(), getFamilySummary()]).catch(err => 
        console.error("Analysis failed:", err)
      );
    }, 500);
  };

  const handleRemove = async (id: string) => {
    const { error } = await removeMember(id);
    if (error) toast.error("Failed to remove member");
    else toast.success("Member removed");
  };

  useEffect(() => {
    // Only run initial analysis on first load (when profile loads)
    if (profile?.userId) {
      // Run both AI operations in parallel for speed
      Promise.all([analyzeRisks(), getFamilySummary()]).catch(err => 
        console.error("Initial analysis failed:", err)
      );
    }
  }, [profile?.userId]);

  // Re-analyze when family members change (new member added via real-time listener)
  useEffect(() => {
    // Only trigger if we have members loaded and have completed initial load
    if (allMembers.length > 1 && profile?.userId && !membersLoading) {
      console.log("[FamilyWallet] Members changed, re-analyzing risks for", allMembers.length, "members");
      // Slight delay to ensure Firestore has latest data
      const timer = setTimeout(() => {
        analyzeRisks().catch(err => console.error("Re-analysis failed:", err));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [members.length, membersLoading]);

  const highRisk = Object.values(riskData).filter(r => r.risk === "high").length;
  const warnings = Object.values(riskData).filter(r => r.risk === "warning").length;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Family Risk Dashboard</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-primary" /> AI-powered coverage analysis for your real family data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { analyzeRisks(); getFamilySummary(); }} disabled={riskLoading} className="gap-1">
            {riskLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-analyze
          </Button>
          <Button onClick={() => setShowAddMember(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>

      {/* AI Summary with live data */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-primary">AI Family Insurance Summary</span>
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">Live Data</span>
          {summaryLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>
        <p className="text-sm text-muted-foreground">{familySummary || "Generating AI summary…"}</p>
      </div>

      {(highRisk > 0 || warnings > 0) && (
        <div className="flex gap-3 flex-wrap">
          {highRisk > 0 && <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> {highRisk} High Risk</Badge>}
          {warnings > 0 && <Badge className="gap-1 bg-warning text-warning-foreground"><AlertTriangle className="h-3 w-3" /> {warnings} Warnings</Badge>}
        </div>
      )}

      {/* Family members grid */}
      <div className="space-y-4">
        {membersLoading ? (
          <div className="bg-card rounded-lg p-8 card-shadow border border-dashed border-border text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading family members...</p>
          </div>
        ) : !profile?.fullName ? (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <p className="text-blue-900 dark:text-blue-100 font-medium">Profile loading...</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Your profile data is still loading. Please wait a moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMembers && allMembers.length > 0 ? (
              allMembers.map((m, i) => {
                const risk = riskData[m.id];
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`bg-card rounded-lg p-5 card-shadow ${
                      risk?.risk === "high" ? "border-2 border-destructive" :
                      risk?.risk === "warning" ? "border border-warning/30" : "border border-success/30"
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              {m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          {risk && (
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                              risk.aiScore >= 70 ? "bg-success" : risk.aiScore >= 50 ? "bg-warning" : "bg-destructive"
                            }`}>{risk.aiScore}</div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-card-foreground">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.relation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {risk && (
                          <Badge className={risk.risk === "high" ? "bg-destructive text-destructive-foreground" : risk.risk === "warning" ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}>
                            {risk.risk === "high" ? "High Risk" : risk.risk === "warning" ? "Warning" : "Good"}
                          </Badge>
                        )}
                        {m.id !== "self" && (
                          <button onClick={() => handleRemove(m.id)} className="text-muted-foreground hover:text-destructive ml-1">
                            <Plus className="h-3 w-3 rotate-45" />
                          </button>
                        )}
                      </div>
                    </div>

                    {(m as any).conditions?.filter((c: string) => c !== "None").length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(m as any).conditions.filter((c: string) => c !== "None").map((c: string) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    )}

                    {riskLoading ? (
                      <div className="h-8 bg-secondary/30 rounded animate-pulse" />
                    ) : risk?.note ? (
                      <p className="text-xs text-muted-foreground bg-secondary/50 rounded p-2 flex gap-1">
                        <Sparkles className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                        {risk.note}
                      </p>
                    ) : null}
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No family members added yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Click "Add Member" to get started</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Policy documents */}
      {policies.length > 0 && (
        <div className="bg-card rounded-lg p-6 card-shadow">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Policy Documents Vault</h2>
          <div className="space-y-3">
            {policies.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileDown className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{p.name} — {p.provider}</p>
                    <p className="text-xs text-muted-foreground">₹{p.coverageAmount?.toLocaleString("en-IN")} · Expires {p.expiryDate}</p>
                  </div>
                </div>
                <Badge variant={p.status === "Active" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Family Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name *</Label><Input className="mt-1" placeholder="e.g. Sunita Kumar" value={newMember.name} onChange={e => setNewMember(n => ({ ...n, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Relationship *</Label>
                <Select value={newMember.relation} onValueChange={v => setNewMember(n => ({ ...n, relation: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Spouse","Son","Daughter","Father","Mother","Father-in-Law","Mother-in-Law","Sibling"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={newMember.gender} onValueChange={v => setNewMember(n => ({ ...n, gender: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Date of Birth *</Label><Input type="date" className="mt-1" value={newMember.dateOfBirth} onChange={e => setNewMember(n => ({ ...n, dateOfBirth: e.target.value }))} /></div>
            <div>
              <Label>Health Conditions</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CONDITIONS.map(c => (
                  <label key={c} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer text-xs transition-colors ${newMember.conditions.includes(c) ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                    <Checkbox checked={newMember.conditions.includes(c)} className="h-3 w-3"
                      onCheckedChange={() => setNewMember(n => ({
                        ...n, conditions: c === "None" ? ["None"] :
                          n.conditions.includes(c) ? n.conditions.filter(x => x !== c) : [...n.conditions.filter(x => x !== "None"), c]
                      }))} />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleAddMember} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Adding…" : "Add Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyWallet;
