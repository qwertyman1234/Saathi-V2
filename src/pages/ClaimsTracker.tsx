import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, CheckCircle, AlertCircle, ArrowRight, Sparkles,
  Loader2, Plus, X, Calendar, IndianRupee, Hospital, User,
  Clock, RefreshCw, Eye, Trash2, ChevronDown, ChevronUp,
  ClipboardList, BadgeCheck, Send, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useClaims } from "@/hooks/useUserData";
import { useAIGapAnalysis } from "@/hooks/useAIFeatures";
import { addDocumentToClaim, fileToBase64, updateClaim } from "@/lib/firebase/firestore";
import { askClaude } from "@/lib/claude";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { RevealHiddenThings } from "@/components/RevealHiddenThings";

// ── Types ──────────────────────────────────────────────────────────────────────
type UploadedDoc = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
};

type TimelineStep = { step: string; date: string; done: boolean };

interface Claim {
  id: string;
  claimNumber: string;
  procedureName: string;
  patientName: string;
  hospitalName: string;
  claimAmount: number;
  approvedAmount?: number;
  incidentDate: string;
  status: string;
  progress: number;
  timeline: TimelineStep[];
  missingDocuments: string[];
  uploadedDocuments: UploadedDoc[];
  notes?: string;
  policyName?: string;
  createdAt: any;
  updatedAt: any;
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  "Submitted":           { color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",   icon: <Send className="h-3 w-3" /> },
  "Under Review":        { color: "text-amber-600",  bg: "bg-amber-50 border-amber-200", icon: <Clock className="h-3 w-3" /> },
  "Information Requested": { color: "text-red-600", bg: "bg-red-50 border-red-200",     icon: <AlertCircle className="h-3 w-3" /> },
  "Documents Verified":  { color: "text-purple-600", bg: "bg-purple-50 border-purple-200", icon: <BadgeCheck className="h-3 w-3" /> },
  "Approved":            { color: "text-green-600",  bg: "bg-green-50 border-green-200", icon: <CheckCircle className="h-3 w-3" /> },
  "Settled":             { color: "text-green-700",  bg: "bg-green-100 border-green-300", icon: <BadgeCheck className="h-3 w-3" /> },
  "Rejected":            { color: "text-red-700",    bg: "bg-red-100 border-red-300",    icon: <X className="h-3 w-3" /> },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg}`}>
      {cfg.icon}{status}
    </span>
  );
}

// ── File Upload Row ────────────────────────────────────────────────────────────
function DocUploadRow({
  docName, claimId, alreadyUploaded, onUploaded,
}: {
  docName: string; claimId: string; alreadyUploaded: boolean; onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 900_000) {
      toast.error("File too large. Please use a file under 900 KB.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToBase64(file);
      await addDocumentToClaim(claimId, {
        name: file.name,
        type: docName,
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toLocaleString("en-IN"),
      });
      toast.success(`"${docName}" uploaded successfully!`);
      onUploaded();
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${alreadyUploaded ? "bg-success/5 border-success/30" : "bg-destructive/5 border-destructive/20"}`}>
      <div className="flex items-center gap-2 min-w-0">
        {alreadyUploaded
          ? <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
          : <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
        <span className="text-sm text-card-foreground truncate">{docName}</span>
      </div>
      {alreadyUploaded ? (
        <span className="text-xs text-success font-medium ml-2">Uploaded ✓</span>
      ) : (
        <>
          <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <Button size="sm" variant="outline" className="ml-2 gap-1.5 flex-shrink-0 h-7 text-xs"
            onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </>
      )}
    </div>
  );
}

// ── New Claim Form ─────────────────────────────────────────────────────────────
function NewClaimForm({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const { submitClaim } = useClaims();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    procedureName: "",
    patientName: profile?.fullName ?? "",
    hospitalName: "",
    claimAmount: "",
    incidentDate: "",
    policyName: "",
    notes: "",
  });
  const [missingDocs, setMissingDocs] = useState<string[]>([
    "Original hospital bill",
    "Discharge summary",
    "Doctor's prescription",
  ]);
  const [newDoc, setNewDoc] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const getAISuggestedDocs = async () => {
    if (!form.procedureName) { toast.error("Enter the procedure name first"); return; }
    setAiLoading(true);
    try {
      const result = await askClaude(
        "You are an Indian health insurance claim expert. Return a JSON array of strings — document names typically required for this claim. Return ONLY the JSON array, nothing else.",
        `What documents are typically required for a health insurance claim for: ${form.procedureName} at an Indian hospital?`
      );
      const clean = result.replace(/```json|```/g, "").trim();
      const docs = JSON.parse(clean);
      if (Array.isArray(docs)) setMissingDocs(docs);
    } catch {
      toast.error("Could not fetch AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.procedureName || !form.patientName || !form.hospitalName || !form.claimAmount || !form.incidentDate) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    const { error } = await submitClaim({
      procedureName: form.procedureName,
      patientName: form.patientName,
      hospitalName: form.hospitalName,
      claimAmount: parseFloat(form.claimAmount.replace(/,/g, "")),
      incidentDate: form.incidentDate,
      policyName: form.policyName,
      notes: form.notes,
      missingDocuments: missingDocs,
      uploadedDocuments: [],
      progress: 10,
    } as any);
    setSaving(false);
    if (error) { toast.error("Failed to submit claim: " + error.message); return; }
    toast.success("Claim submitted successfully!");
    onClose();
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Procedure / Treatment *</Label>
          <Input placeholder="e.g. Knee Replacement Surgery" className="mt-1"
            value={form.procedureName} onChange={e => upd("procedureName", e.target.value)} />
        </div>
        <div>
          <Label>Patient Name *</Label>
          <Input placeholder="Full name" className="mt-1"
            value={form.patientName} onChange={e => upd("patientName", e.target.value)} />
        </div>
        <div>
          <Label>Hospital Name *</Label>
          <Input placeholder="e.g. Sahyadri Hospital, Pune" className="mt-1"
            value={form.hospitalName} onChange={e => upd("hospitalName", e.target.value)} />
        </div>
        <div>
          <Label>Claim Amount (₹) *</Label>
          <Input placeholder="e.g. 85000" className="mt-1" type="number"
            value={form.claimAmount} onChange={e => upd("claimAmount", e.target.value)} />
        </div>
        <div>
          <Label>Date of Treatment *</Label>
          <Input type="date" className="mt-1"
            value={form.incidentDate} onChange={e => upd("incidentDate", e.target.value)} />
        </div>
        <div>
          <Label>Insurance Policy</Label>
          <Input placeholder="e.g. Health Guard Gold – Bajaj" className="mt-1"
            value={form.policyName} onChange={e => upd("policyName", e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Notes / Description</Label>
        <Textarea placeholder="Any additional details about the treatment..." className="mt-1 h-20"
          value={form.notes} onChange={e => upd("notes", e.target.value)} />
      </div>

      {/* Required documents */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Documents Required</Label>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={getAISuggestedDocs} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Suggest
          </Button>
        </div>
        <div className="space-y-2">
          {missingDocs.map((d, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm flex-1 text-card-foreground">{d}</span>
              <button onClick={() => setMissingDocs(prev => prev.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Add a required document..." value={newDoc}
              onChange={e => setNewDoc(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newDoc.trim()) { setMissingDocs(p => [...p, newDoc.trim()]); setNewDoc(""); }}} />
            <Button variant="outline" size="icon" onClick={() => { if (newDoc.trim()) { setMissingDocs(p => [...p, newDoc.trim()]); setNewDoc(""); }}}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2 h-11">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {saving ? "Submitting Claim…" : "Submit Claim"}
      </Button>
    </div>
  );
}

// ── Claim Detail Panel ─────────────────────────────────────────────────────────
function ClaimDetailPanel({ claim, onRefresh }: { claim: Claim; onRefresh: () => void }) {
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);
  const [showAllDocs, setShowAllDocs] = useState(false);

  const uploaded = claim.uploadedDocuments ?? [];
  const missing = (claim.missingDocuments ?? []).filter(
    doc => !uploaded.some(u => u.type === doc)
  );
  const allSubmitted = missing.length === 0;

  const getAIAdvice = async () => {
    setAiLoading(true);
    try {
      const advice = await askClaude(
        "You are an expert Indian health insurance claim advisor. Give 3-4 specific, actionable bullet points to help get this claim resolved faster. Use markdown. Keep under 120 words.",
        `Claim: ${claim.claimNumber}
Procedure: ${claim.procedureName}
Patient: ${claim.patientName}
Hospital: ${claim.hospitalName}
Amount: ₹${claim.claimAmount?.toLocaleString("en-IN")}
Status: ${claim.status}
Missing documents: ${missing.join(", ") || "None"}
Notes: ${claim.notes ?? "—"}`
      );
      setAiAdvice(advice);
    } catch {
      setAiAdvice("Contact your insurer's TPA helpline with the claim number for a status update. Keep all originals handy.");
    } finally {
      setAiLoading(false);
    }
  };

  const formatAmount = (n?: number) =>
    n ? `₹${n.toLocaleString("en-IN")}` : "—";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-card-foreground">{claim.procedureName}</h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{claim.claimNumber}</p>
        </div>
        <StatusPill status={claim.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          { label: "Patient", value: claim.patientName, icon: <User className="h-3.5 w-3.5" /> },
          { label: "Claim Amount", value: formatAmount(claim.claimAmount), icon: <IndianRupee className="h-3.5 w-3.5" /> },
          { label: "Hospital", value: claim.hospitalName, icon: <Hospital className="h-3.5 w-3.5" /> },
          { label: "Approved", value: formatAmount(claim.approvedAmount), icon: <BadgeCheck className="h-3.5 w-3.5" /> },
          { label: "Policy", value: claim.policyName || "—", icon: <FileText className="h-3.5 w-3.5" /> },
          { label: "Date", value: claim.incidentDate, icon: <Calendar className="h-3.5 w-3.5" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-secondary/30 rounded-lg p-2.5">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              {icon}
              <span className="text-xs">{label}</span>
            </div>
            <p className="font-medium text-card-foreground text-sm truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Claim Progress</span>
          <span className="font-medium text-card-foreground">{claim.progress ?? 0}%</span>
        </div>
        <Progress value={claim.progress ?? 0} className="h-2" />
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Processing Timeline</h3>
        <div className="space-y-2.5">
          {(claim.timeline ?? []).map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${step.done ? "bg-success" : "border-2 border-border"}`}>
                {step.done && <CheckCircle className="h-3.5 w-3.5 text-white" />}
              </div>
              <div className="flex-1 flex justify-between">
                <span className={`text-sm ${step.done ? "font-medium text-card-foreground" : "text-muted-foreground"}`}>{step.step}</span>
                <span className="text-xs text-muted-foreground">{step.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Documents Upload */}
      {missing.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <h4 className="font-semibold text-sm text-destructive">
              {missing.length} Document{missing.length !== 1 ? "s" : ""} Required
            </h4>
          </div>
          <p className="text-xs text-muted-foreground">Upload the documents below to advance your claim. Files must be under 900 KB (JPG, PNG, PDF).</p>
          <div className="space-y-2">
            {missing.map(doc => (
              <DocUploadRow
                key={doc}
                docName={doc}
                claimId={claim.id}
                alreadyUploaded={false}
                onUploaded={onRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Documents */}
      {uploaded.length > 0 && (
        <div className="space-y-2">
          <button className="flex items-center gap-2 text-sm font-semibold text-card-foreground"
            onClick={() => setShowAllDocs(s => !s)}>
            <CheckCircle className="h-4 w-4 text-success" />
            {uploaded.length} Document{uploaded.length !== 1 ? "s" : ""} Uploaded
            {showAllDocs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showAllDocs && (
            <div className="space-y-2 pl-1">
              {uploaded.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-success/5 border border-success/20 rounded-lg">
                  <FileText className="h-4 w-4 text-success flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-card-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type} · {(doc.size / 1024).toFixed(0)} KB · {doc.uploadedAt}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"
                    onClick={() => setViewDocUrl(doc.dataUrl)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {allSubmitted && claim.status !== "Settled" && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-sm text-success font-medium flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> All documents submitted! Your claim is being processed.
        </div>
      )}

      {/* Notes */}
      {claim.notes && (
        <div className="p-3 bg-secondary/40 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm text-card-foreground">{claim.notes}</p>
        </div>
      )}

      {/* AI Advisor */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm text-primary flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> AI Claim Advisor
          </h4>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2"
            onClick={getAIAdvice} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Get Advice"}
          </Button>
        </div>
        {aiAdvice ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
            <ReactMarkdown>{aiAdvice}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Click "Get Advice" for AI-powered tips to resolve this claim faster.</p>
        )}
      </div>

      {/* Document viewer modal */}
      {viewDocUrl && (
        <Dialog open={!!viewDocUrl} onOpenChange={() => setViewDocUrl(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[70vh]">
              {viewDocUrl.startsWith("data:image") ? (
                <img src={viewDocUrl} alt="Document" className="w-full rounded-lg" />
              ) : (
                <iframe src={viewDocUrl} className="w-full h-[60vh] rounded-lg" title="Document" />
              )}
            </div>
            <Button variant="outline" onClick={() => { const a = document.createElement("a"); a.href = viewDocUrl; a.download = "document"; a.click(); }}>
              Download
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Main ClaimsTracker ─────────────────────────────────────────────────────────
const ClaimsTracker = () => {
  const { claims, loading, submitClaim } = useClaims();
  const [selected, setSelected] = useState<Claim | null>(null);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-select first claim
  const claimsList = claims as Claim[];
  const displaySelected = selected
    ? claimsList.find(c => c.id === selected.id) ?? selected
    : claimsList[0] ?? null;

  const pendingCount = claimsList.filter(c => !["Settled", "Rejected"].includes(c.status)).length;
  const totalClaimed = claimsList.reduce((s, c) => s + (c.claimAmount ?? 0), 0);
  const totalSettled = claimsList.filter(c => c.status === "Settled").reduce((s, c) => s + (c.approvedAmount ?? c.claimAmount ?? 0), 0);

  // Show skeleton loading only on initial data load
  if (loading && claimsList.length === 0) return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your claims...</p>
      </div>
      {/* Loading skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl p-4 border border-border bg-card h-20 animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Claims Tracker</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track, manage and submit documents for all your insurance claims</p>
        </div>
        <Button onClick={() => setShowNewClaim(true)} className="gap-2">
          <Plus className="h-4 w-4" /> File New Claim
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Claims", value: pendingCount, icon: <Clock className="h-4 w-4 text-amber-500" />, bg: "bg-amber-50 border-amber-100" },
          { label: "Total Claimed", value: `₹${totalClaimed.toLocaleString("en-IN")}`, icon: <IndianRupee className="h-4 w-4 text-blue-500" />, bg: "bg-blue-50 border-blue-100" },
          { label: "Total Settled", value: `₹${totalSettled.toLocaleString("en-IN")}`, icon: <BadgeCheck className="h-4 w-4 text-green-500" />, bg: "bg-green-50 border-green-100" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border card-shadow ${s.bg}`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-muted-foreground">{s.label}</span></div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Understand rejection reasons */}
      {pendingCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
                Understand why claims get rejected
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
                Insurance companies often hide restrictions and exclusions in policy fine print. Common rejection reasons include pre-existing disease waiting periods, sub-limits on specific treatments, and exclusions not clearly mentioned.
              </p>
              <RevealHiddenThings 
                policyDetails={{
                  context: "Why claims might be rejected",
                  usage: "Understanding claim rejections",
                }}
                buttonText="🔍 Reveal Common Rejection Reasons"
                buttonVariant="outline"
                className="text-xs"
              />
            </div>
          </div>
        </motion.div>
      )}

      {claimsList.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center card-shadow border border-dashed border-border">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-card-foreground mb-2">No claims yet</h3>
          <p className="text-muted-foreground text-sm mb-6">File your first claim and track its progress in real-time</p>
          <Button onClick={() => setShowNewClaim(true)} className="gap-2">
            <Plus className="h-4 w-4" /> File Your First Claim
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Claims list */}
          <div className="lg:col-span-2 space-y-3">
            {claimsList.map((claim) => {
              const missingCount = (claim.missingDocuments ?? []).filter(
                d => !(claim.uploadedDocuments ?? []).some(u => u.type === d)
              ).length;
              return (
                <motion.div key={claim.id} whileHover={{ scale: 1.01 }}
                  onClick={() => setSelected(claim)}
                  className={`bg-card rounded-xl p-4 card-shadow cursor-pointer transition-all border ${
                    displaySelected?.id === claim.id ? "ring-2 ring-primary border-primary/30" : "border-border"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-muted-foreground">{claim.claimNumber}</span>
                    <StatusPill status={claim.status} />
                  </div>
                  <p className="font-semibold text-card-foreground text-sm">{claim.procedureName}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">{claim.patientName}</span>
                    <span className="text-sm font-bold text-card-foreground">₹{(claim.claimAmount ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-2.5">
                    <Progress value={claim.progress ?? 0} className="h-1.5" />
                  </div>
                  {missingCount > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {missingCount} document{missingCount !== 1 ? "s" : ""} needed
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Claim detail */}
          <div className="lg:col-span-3 bg-card rounded-xl p-5 card-shadow border border-border overflow-y-auto max-h-[75vh]">
            {displaySelected ? (
              <ClaimDetailPanel
                key={displaySelected.id + refreshKey}
                claim={displaySelected}
                onRefresh={() => setRefreshKey(k => k + 1)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                <ClipboardList className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Select a claim to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Claim Dialog */}
      <Dialog open={showNewClaim} onOpenChange={setShowNewClaim}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> File New Insurance Claim
            </DialogTitle>
          </DialogHeader>
          <NewClaimForm onClose={() => setShowNewClaim(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClaimsTracker;
