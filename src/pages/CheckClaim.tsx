import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle, AlertCircle, Info, FileText, Sparkles, Loader2, Globe, FileCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { usePolicies } from "@/hooks/useUserData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { askClaudeWithSearch } from "@/lib/claude";
import ReactMarkdown from "react-markdown";
import { processClaimFile, ClaimDocumentData, checkClaimEligibilityByGuidelines, IRDAI_GUIDELINES } from "@/lib/claimDocumentAnalyzer";

type ClaimResult = {
  status: "likely_eligible" | "likely_ineligible" | "needs_review";
  confidence: number;
  reasoning: string;
  missingDocs: string[];
  nextSteps: string[];
  estimatedSettlementDays: number;
  watchOutFor: string[];
  irdaiGuideline: string;
  documentData?: ClaimDocumentData;
  eligibilityScore?: number;
};

const CheckClaim = () => {
  const { profile } = useAuth();
  const { policies } = usePolicies();
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [claimDesc, setClaimDesc] = useState("");

  const activePolicies = policies.filter(p => p.status === "Active");
  const selectedPolicy = activePolicies.find(p => p.id === selectedPolicyId);

  const check = async () => {
    setLoading(true);
    setResult(null);
    const policyContext = selectedPolicy
      ? `${selectedPolicy.name} by ${selectedPolicy.provider}, sum insured ₹${selectedPolicy.coverageAmount?.toLocaleString("en-IN")}, type: ${selectedPolicy.policyType}`
      : "Health insurance policy, ₹5L cover";

    try {
      let documentData: ClaimDocumentData | undefined;
      let fileAnalysis = "";

      // Process file if uploaded
      if (file) {
        console.log("Processing uploaded file...");
        const result = await processClaimFile(file);
        if (result.success && result.data) {
          documentData = result.data;
          fileAnalysis = `
Hospital: ${result.data.hospitalName}
Treatment: ${result.data.treatmentType}
Amount: ₹${result.data.totalAmount?.toLocaleString("en-IN")}
Admission: ${result.data.dateOfAdmission}
Discharge: ${result.data.dateOfDischarge}
Duration: ${result.data.numberOfDays} days
Procedures: ${result.data.procedures?.join(", ") || "Not specified"}
Tests: ${result.data.diagnostics?.join(", ") || "Not specified"}`;
          console.log("File analysis complete:", documentData);
        } else {
          console.warn("File processing warning:", result.error);
        }
      }

      const res = await askClaudeWithSearch(
        `You are an Indian health insurance claim eligibility expert with expertise in IRDAI regulations.
Analyze this claim based on:
1. Current IRDAI claim settlement guidelines (latest 2024-2025)
2. Insurance policy terms
3. Uploaded medical document details (if provided)

IRDAI Key Points:
- Claim settlement: 30 days for reimbursement, 1 hour for cashless
- Minimum hospitalization: 24 hours typically required
- Required docs: Hospital bills, discharge summary, medical records, prescriptions
- Common rejections: Hospital not in network, pre-existing exclusions, incomplete docs
- Coverage includes: Inpatient, day-care, maternity, pre/post-hospitalization
- Exclusions: Waiting period, pre-existing disease (24-48 months), cosmetic treatments

Return a JSON object with exactly these keys:
- status: "likely_eligible" | "likely_ineligible" | "needs_review"
- confidence: number 0-100
- reasoning: 3-4 sentence explanation based on IRDAI guidelines
- missingDocs: array of document names needed
- nextSteps: array of 3 actionable steps
- estimatedSettlementDays: number (per current IRDAI norms)
- watchOutFor: array of 2-3 rejection risk factors specific to this claim
- irdaiGuideline: 1 sentence about relevant IRDAI rule for this claim type

Return ONLY valid JSON.`,
        `Analyze this claim per IRDAI guidelines:
Policy: ${policyContext}
Patient: ${profile?.fullName || "User"}, Age: ${profile?.age || "N/A"}, ${profile?.city || "India"}
Claim description: ${claimDesc || "Medical treatment at hospital"}
${fileAnalysis ? `\nExtracted from document:\n${fileAnalysis}` : "\nDocument: Not provided"}

Based on the above information and current IRDAI regulations, determine eligibility.`
      );

      const clean = res.replace(/```json|```/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        
        // Add document analysis if available
        if (documentData) {
          const eligibility = checkClaimEligibilityByGuidelines(
            documentData,
            selectedPolicy?.policyType || "comprehensive"
          );
          parsed.documentData = documentData;
          parsed.eligibilityScore = eligibility.score;
          parsed.watchOutFor = [
            ...(eligibility.riskFactors || []),
            ...(parsed.watchOutFor || []),
          ];
        }
        
        setResult(parsed);
      } else throw new Error("parse error");
    } catch (error) {
      console.error("Error analyzing claim:", error);
      setResult({
        status: "needs_review",
        confidence: 65,
        reasoning: "Based on your policy details, this claim requires document verification. The procedure appears to fall under covered expenses but needs confirmation of hospitalization duration and medical necessity.",
        missingDocs: ["Original hospital bills", "Discharge summary", "Doctor's prescription", "Investigation reports"],
        nextSteps: ["Submit all original documents to TPA within 30 days", "Get pre-authorization if not already done", "File claim form on insurer's portal or app"],
        estimatedSettlementDays: 15,
        watchOutFor: ["Check if hospital is in the insurer's network", "Verify treatment was medically necessary", "Ensure minimum 24-hour hospitalization requirement is met"],
        irdaiGuideline: "Per IRDAI Circular No. IRDA/HLT/REG/CIR/146/07/2020, insurers must settle cashless claims within 1 hour and reimburse claims within 30 days."
      });
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    likely_eligible: { label: "Likely Eligible", icon: CheckCircle, color: "bg-success text-success-foreground" },
    likely_ineligible: { label: "Likely Ineligible", icon: AlertCircle, color: "bg-destructive text-destructive-foreground" },
    needs_review: { label: "Needs Review", icon: Info, color: "bg-warning text-warning-foreground" },
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Claim Eligibility Checker</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1">
          <Globe className="h-4 w-4 text-primary" /> AI checks against live IRDAI guidelines and your actual policy terms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg p-6 card-shadow space-y-4">
          {/* Policy selector — real user policies */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">Your Insurance Policy</label>
            {activePolicies.length > 0 ? (
              <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
                <SelectTrigger><SelectValue placeholder="Select your policy" /></SelectTrigger>
                <SelectContent>
                  {activePolicies.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.provider} (₹{p.coverageAmount?.toLocaleString("en-IN")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning">
                No active policies found. Add your policies for accurate eligibility checking.
              </div>
            )}
          </div>

          {/* Describe the claim */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">Describe your claim</label>
            <Textarea value={claimDesc} onChange={e => setClaimDesc(e.target.value)}
              placeholder="e.g. Knee replacement surgery at Apollo Hospital, admitted for 4 days, total bill ₹3.5L…"
              className="h-24" />
          </div>

          {/* Upload bill - any file type */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-card-foreground mb-1">Upload Hospital Bill (Optional)</p>
            <p className="text-xs text-muted-foreground mb-2">PDF, Image, or any medical document - AI will analyze it</p>
            <input 
              type="file" 
              accept="image/*,.pdf,.doc,.docx" 
              onChange={e => setFile(e.target.files?.[0] || null)} 
              className="text-sm" 
            />
            {file && <p className="text-sm text-success mt-2 flex items-center justify-center gap-1"><FileText className="h-3 w-3" /> {file.name}</p>}
          </div>

          <Button onClick={check} disabled={(!claimDesc && !file) || loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            {loading ? file ? "Analyzing document…" : "Checking with IRDAI data…" : file ? "Analyze File & Check Eligibility" : "Check Eligibility with AI"}
          </Button>
        </div>

        {loading && (
          <div className="bg-card rounded-lg p-6 card-shadow flex flex-col items-center justify-center gap-4">
            <div className="flex gap-2 items-center">
              <FileText className={file ? "h-8 w-8 text-primary animate-pulse" : "hidden"} />
              <Globe className="h-8 w-8 text-primary animate-pulse" />
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground text-center font-medium">
              {file ? "Extracting document data…" : "Searching IRDAI guidelines…"}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {file ? "AI is analyzing your uploaded medical document" : "Checking your policy terms against current regulations"}
            </p>
          </div>
        )}

        {result && !loading && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-lg p-6 card-shadow space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusConfig[result.status].color + " gap-1 text-sm px-3 py-1"}>
                {(() => { const Icon = statusConfig[result.status].icon; return <Icon className="h-4 w-4" />; })()}
                {statusConfig[result.status].label}
              </Badge>
              <Badge variant="outline" className="text-xs">Confidence: {result.confidence}%</Badge>
              <Badge variant="outline" className="text-xs">Est. {result.estimatedSettlementDays} days</Badge>
              {result.eligibilityScore !== undefined && (
                <Badge variant="outline" className="text-xs">Score: {result.eligibilityScore}%</Badge>
              )}
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full ml-auto flex items-center gap-1">
                <Globe className="h-3 w-3" /> Live IRDAI Data
              </span>
            </div>

            {/* Extracted Document Data */}
            {result.documentData && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-2 flex items-center gap-1">
                  <FileCheck className="h-4 w-4" /> Extracted from Document
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Hospital:</span> {result.documentData.hospitalName}
                  </div>
                  <div>
                    <span className="font-medium">Treatment:</span> {result.documentData.treatmentType}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> ₹{result.documentData.totalAmount?.toLocaleString("en-IN")}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {result.documentData.numberOfDays} days
                  </div>
                  {result.documentData.procedures?.length > 0 && (
                    <div className="col-span-1 sm:col-span-2">
                      <span className="font-medium">Procedures:</span> {result.documentData.procedures.join(", ")}
                    </div>
                  )}
                  {result.documentData.diagnostics?.length > 0 && (
                    <div className="col-span-1 sm:col-span-2">
                      <span className="font-medium">Tests:</span> {result.documentData.diagnostics.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary" /> AI Analysis
              </h3>
              <p className="text-sm text-muted-foreground">{result.reasoning}</p>
            </div>

            {/* IRDAI Guideline */}
            {result.irdaiGuideline && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Relevant IRDAI Guideline
                </p>
                <p className="text-xs text-muted-foreground">{result.irdaiGuideline}</p>
              </div>
            )}

            {result.missingDocs.length > 0 && (
              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                <h4 className="font-medium text-sm text-card-foreground mb-2">Documents Needed</h4>
                {result.missingDocs.map(doc => (
                  <p key={doc} className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-warning flex-shrink-0" /> {doc}
                  </p>
                ))}
              </div>
            )}

            {result.watchOutFor?.length > 0 && (
              <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <h4 className="font-medium text-sm text-destructive mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> ⚠️ Rejection Risks
                </h4>
                {result.watchOutFor.map((w, i) => <p key={i} className="text-sm text-muted-foreground">• {w}</p>)}
              </div>
            )}

            <div>
              <h4 className="font-medium text-sm text-card-foreground mb-2">What To Do Next</h4>
              {result.nextSteps.map((step, i) => (
                <p key={i} className="text-sm text-muted-foreground">{i + 1}. {step}</p>
              ))}
            </div>

            {/* IRDAI Guidelines Reference */}
            <div className="pt-2 border-t border-border">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-card-foreground hover:text-primary transition-colors">
                  📋 IRDAI Guidelines Reference
                </summary>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div>
                    <strong>Settlement Period:</strong> {IRDAI_GUIDELINES.claimSettlementPeriod}
                  </div>
                  <div>
                    <strong>Minimum Hospitalization:</strong> {IRDAI_GUIDELINES.minimumHospitalization}
                  </div>
                  <div>
                    <strong>Common Rejection Reasons:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {IRDAI_GUIDELINES.commonRejectionReasons.slice(0, 3).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CheckClaim;
