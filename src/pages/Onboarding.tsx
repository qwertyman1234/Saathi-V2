import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ArrowRight, ArrowLeft, Upload, CheckCircle, FileText,
  Loader2, Trash2, Plus, X, ChevronDown, ChevronUp, AlertCircle, TrendingUp, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { addFamilyMember, setMedicalHistory } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import { sendOTP, verifyOTP, clearVerificationSession, getVerificationTimeRemaining, hasPendingVerification, initializeRecaptcha } from "@/lib/otpService";
import {
  HealthAssessment,
  CHRONIC_CONDITIONS,
  FAMILY_DISEASE_OPTIONS,
  PRIORITY_COVERAGE_OPTIONS,
  HEALTH_ASSESSMENT_QUESTIONS,
  calculateHealthRiskScore,
  getRiskCategory,
} from "@/lib/healthAssessment";

type FamilyMember = {
  id: string; name: string; relation: string; dateOfBirth: string;
  age: number; gender: string; conditions: string[];
};

const CONDITIONS = ["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Cancer", "Kidney Disease", "None"];

const stepQuotes = [
  "Protecting 10 lakh+ families across India",
  "Your data is encrypted and safe with us",
  "We need to verify you're a real person",
  "Understanding your health is our priority",
  "Personalized plans based on your health profile",
  "Coverage for every member of your family",
  "AI-powered health risk analysis just for you",
  "You're all set!",
];

function calcAge(dob: string) {
  if (!dob) return 0;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Steps: 1=Phone, 2=Phone Verify, 3=Personal Info, 4=Health Assessment, 5=Income, 6=Family, 7=Medical History, 8=Success
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  
  // Phone verification
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Personal Info
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [address, setAddress] = useState("");

  // Health Assessment
  const [healthAssessment, setHealthAssessment] = useState<Partial<HealthAssessment>>({});
  const [healthRiskScore, setHealthRiskScore] = useState(0);

  // KYC & Income & Family (existing)
  const [kycType, setKycType] = useState<"aadhaar" | "pan">("aadhaar");
  const [kycFiles, setKycFiles] = useState<{ front: File | null; back: File | null; pan: File | null }>({ front: null, back: null, pan: null });
  const [incomeBracket, setIncomeBracket] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: "self", name: profile?.fullName ?? "You", relation: "Self", dateOfBirth: "", age: 0, gender: "Male", conditions: [] },
  ]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", relation: "", dateOfBirth: "", gender: "Male", conditions: [] as string[] });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({ policies: [], reports: [], conditions: [], claims: [] });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ policies: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    const initRecaptcha = async () => {
      try {
        // Ensure container exists
        if (!document.getElementById("recaptcha-container")) {
          const container = document.createElement("div");
          container.id = "recaptcha-container";
          container.style.display = "none";
          document.body.appendChild(container);
        }
      } catch (error) {
        console.error("Error setting up reCAPTCHA container:", error);
      }
    };
    
    initRecaptcha();
  }, []);

  const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, 9)); };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 1)); };

  // Send OTP
  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setVerifyError("");
    setOtpLoading(true);
    try {
      // Make sure reCAPTCHA container exists before sending
      if (!document.getElementById("recaptcha-container")) {
        const container = document.createElement("div");
        container.id = "recaptcha-container";
        container.style.display = "none";
        document.body.appendChild(container);
      }

      const result = await sendOTP(phone);
      if (result.success) {
        setOtpSent(true);
        setResendTimer(30);
        toast.success(result.message);
        goNext(); // Advance to step 2 (OTP Verification)
      } else {
        setVerifyError(result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to send OTP";
      setVerifyError(errorMsg);
      toast.error(errorMsg);
      console.error("OTP send error:", error);
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Enter a 6-digit OTP");
      return;
    }
    setVerifyError("");
    try {
      const result = await verifyOTP(phone, otp);
      if (result.valid) {
        setPhoneVerified(true);
        toast.success("Phone verified!");
        goNext();
      } else {
        setVerifyError(result.message);
        toast.error(result.message);
        setOtp("");
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Verification failed";
      setVerifyError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const addMember = () => {
    if (!newMember.name || !newMember.relation || !newMember.dateOfBirth) return;
    setFamilyMembers(m => [...m, { ...newMember, id: Date.now().toString(), age: calcAge(newMember.dateOfBirth) }]);
    setNewMember({ name: "", relation: "", dateOfBirth: "", gender: "Male", conditions: [] });
    setShowAddMember(false);
  };

  const removeMember = (id: string) => setFamilyMembers(m => m.filter(x => x.id !== id));

  const completeOnboarding = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update profile with all collected data
      const { error } = await updateProfile({
        phone,
        fullName,
        email,
        dateOfBirth: dob,
        gender,
        address,
        incomeRange: incomeBracket,
        occupation: employmentType,
        healthAssessment, // Store health assessment
        healthRiskScore, // Store risk score
        onboardingCompleted: true,
        onboardingStep: 9,
      });

      if (error) throw error;

      // Save family members
      for (const m of familyMembers.filter(x => x.id !== "self")) {
        await addFamilyMember(user.uid, {
          name: m.name, relation: m.relation,
          dateOfBirth: m.dateOfBirth, gender: m.gender, conditions: m.conditions,
        });
      }

      // Save medical history
      await setMedicalHistory(user.uid, {
        existingConditions: familyMembers.flatMap(m => m.conditions).filter(c => c !== "None"),
        healthAssessment,
        healthRiskScore,
      });

      setSaved(true);
    } catch (e: any) {
      toast.error("Failed to save: " + (e?.message ?? "Unknown error"));
      setSaving(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  const FileBox = ({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) => (
    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? "border-success/50 bg-success/5" : "border-border hover:border-primary/40"}`}>
      {file ? (
        <div className="space-y-2">
          <CheckCircle className="h-8 w-8 text-success mx-auto" />
          <p className="text-sm font-medium text-card-foreground truncate">{file.name}</p>
          <button onClick={() => onChange(null)} className="text-xs text-destructive hover:underline">Remove</button>
        </div>
      ) : (
        <label className="cursor-pointer block space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-card-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, PDF</p>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
        </label>
      )}
    </div>
  );

  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-[420px] flex-shrink-0 bg-primary flex-col justify-between p-8 text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 -left-10 w-40 h-40 rounded-full bg-white/20" />
        <div className="absolute bottom-40 -right-20 w-60 h-60 rounded-full bg-white/15" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Health Insurance Saathi</h2>
            <p className="text-sm opacity-75">Setup your profile</p>
          </div>
        </div>
        <div className="space-y-3">
          {["Phone Number", "OTP Verification", "Personal Info", "Health Assessment", "Income Details", "Family Members", "Medical History", "All Done!"].map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step - 1 > i ? "bg-accent text-accent-foreground" :
                step - 1 === i ? "bg-white text-primary ring-2 ring-white/50" :
                "bg-white/20 text-white/50"
              }`}>
                {step - 1 > i ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${step - 1 === i ? "font-semibold" : "opacity-60"}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 bg-white/10 rounded-xl p-4">
        <p className="text-sm italic opacity-90">"{stepQuotes[Math.min(step - 1, 6)]}"</p>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Welcome! 👋</h1>
            <p className="text-muted-foreground mt-1">Let's set up your insurance profile. This takes 5 minutes.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Mobile Number</label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-4 bg-secondary rounded-lg text-sm font-medium">🇮🇳 +91</div>
              <Input type="tel" placeholder="10-digit number" className="flex-1 h-12 text-lg"
                value={phone} maxLength={10}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">We'll send an OTP via SMS to verify your number (Completely FREE)</p>
          </div>

          {/* Error Message */}
          {verifyError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{verifyError}</p>
            </div>
          )}

          <Button onClick={handleSendOTP} disabled={phone.length !== 10 || otpLoading} className="w-full h-12 gap-2 text-base">
            {otpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            {otpLoading ? "Sending..." : "Send OTP"}
          </Button>
        </div>
      );

      case 2: return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Verify Your Number</h1>
            <p className="text-muted-foreground mt-1">Enter the 6-digit code sent to +91{phone}</p>
          </div>

          {/* reCAPTCHA Container (invisible) */}
          <div id="recaptcha-container" ref={recaptchaRef} className="hidden"></div>

          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl" />)}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Error Message */}
          {verifyError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{verifyError}</p>
            </div>
          )}

          <Button onClick={handleVerifyOTP} disabled={otp.length !== 6} className="w-full h-12 gap-2 text-base">
            Verify & Continue <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex justify-between text-sm">
            <button onClick={goBack} className="text-muted-foreground hover:text-foreground">← Change Number</button>
            <button disabled={resendTimer > 0} onClick={handleSendOTP} className={resendTimer > 0 ? "text-muted-foreground" : "text-primary hover:underline"}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </button>
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Tell Us About Yourself</h1>
            <p className="text-muted-foreground mt-1">We need some basic info to verify you're a real person</p>
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Full Name <span className="text-destructive">*</span></label>
            <Input placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} className="h-11" />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Email Address <span className="text-destructive">*</span></label>
            <Input type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">Date of Birth <span className="text-destructive">*</span></label>
              <Input type="date" value={dob} onChange={e => setDob(e.target.value)} className="h-11" />
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">Gender <span className="text-destructive">*</span></label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Address</label>
            <Input placeholder="Enter your address" value={address} onChange={e => setAddress(e.target.value)} className="h-11" />
          </div>
          <Button onClick={goNext} disabled={!fullName || !email || !dob || !gender} className="w-full h-12 gap-2">
            Continue <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      );

      case 4: {
        const riskCategory = getRiskCategory(healthRiskScore);
        return (
          <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Health Assessment</h1>
              <p className="text-muted-foreground mt-1">Answer these questions to understand your health profile</p>
            </div>

            {HEALTH_ASSESSMENT_QUESTIONS.map((q: any, idx: number) => {
              // Check if question should be shown (conditional rendering)
              if (q.conditional && !healthAssessment[q.conditional as keyof HealthAssessment]) {
                return null;
              }

              return (
                <div key={q.id} className="border border-border rounded-lg p-4">
                  <label className="text-sm font-medium text-card-foreground block mb-3">{q.title}</label>

                  {q.type === "radio" && (
                    <div className="space-y-2">
                      {q.options.map((opt: any) => (
                        <label key={opt.value} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          healthAssessment[q.id as keyof HealthAssessment] === opt.value ? "bg-primary/10 border border-primary" : "hover:bg-secondary/50"
                        }`}>
                          <input type="radio" name={q.id} value={opt.value}
                            checked={healthAssessment[q.id as keyof HealthAssessment] === opt.value}
                            onChange={() => {
                              setHealthAssessment(h => ({ ...h, [q.id]: opt.value }));
                              setHealthRiskScore(calculateHealthRiskScore({ ...healthAssessment, [q.id]: opt.value }));
                            }}
                            className="w-4 h-4" />
                          <div>
                            <p className="text-sm font-medium text-card-foreground">{opt.label}</p>
                            {opt.desc && <p className="text-xs text-muted-foreground">{opt.desc}</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "checkbox" && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={!!healthAssessment[q.id as keyof HealthAssessment]}
                        onCheckedChange={(checked) => {
                          setHealthAssessment(h => ({ ...h, [q.id]: checked }));
                          setHealthRiskScore(calculateHealthRiskScore({ ...healthAssessment, [q.id]: checked }));
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-card-foreground">{q.label}</span>
                    </label>
                  )}

                  {q.type === "multi-checkbox" && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {q.options.map((opt: string) => {
                        const fieldArray = healthAssessment[q.id as keyof HealthAssessment] as string[] | undefined || [];
                        return (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={fieldArray.includes(opt)}
                              onCheckedChange={(checked) => {
                                const newArr = checked
                                  ? [...fieldArray, opt]
                                  : fieldArray.filter(x => x !== opt);
                                if (q.maxSelect && newArr.length > q.maxSelect) return;
                                setHealthAssessment(h => ({ ...h, [q.id]: newArr }));
                                setHealthRiskScore(calculateHealthRiskScore({ ...healthAssessment, [q.id]: newArr }));
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-card-foreground">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Risk Score Display */}
            <div className={`rounded-lg p-4 border-2 ${riskCategory.color === "success" ? "border-success/30 bg-success/5" : riskCategory.color === "warning" ? "border-warning/30 bg-warning/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`h-5 w-5 ${riskCategory.color === "success" ? "text-success" : riskCategory.color === "warning" ? "text-warning" : "text-destructive"}`} />
                <span className={`font-bold text-sm ${riskCategory.color === "success" ? "text-success" : riskCategory.color === "warning" ? "text-warning" : "text-destructive"}`}>
                  {riskCategory.category} (Score: {healthRiskScore}/100)
                </span>
              </div>
              <p className="text-xs text-card-foreground">{riskCategory.description}</p>
            </div>

            <Button onClick={goNext} className="w-full h-12 gap-2">
              See Risk Assessment <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        );
      }

      case 5: return (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Your Health Profile</h1>
            <p className="text-muted-foreground mt-1">Based on your assessment</p>
          </div>

          {(() => {
            const riskCategory = getRiskCategory(healthRiskScore);
            return (
              <div className="space-y-4">
                <div className={`rounded-lg p-4 border-l-4 ${
                  riskCategory.color === "success" ? "border-success bg-success/5" :
                  riskCategory.color === "warning" ? "border-warning bg-warning/5" :
                  "border-destructive bg-destructive/5"
                }`}>
                  <div className="flex items-start gap-3">
                    <Heart className={`h-6 w-6 flex-shrink-0 ${
                      riskCategory.color === "success" ? "text-success" :
                      riskCategory.color === "warning" ? "text-warning" :
                      "text-destructive"
                    }`} />
                    <div>
                      <h3 className={`font-bold text-lg ${
                        riskCategory.color === "success" ? "text-success" :
                        riskCategory.color === "warning" ? "text-warning" :
                        "text-destructive"
                      }`}>{riskCategory.category}</h3>
                      <p className="text-sm text-card-foreground mt-1">{riskCategory.description}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-card-foreground mb-3">Our Recommendations:</h4>
                  <ul className="space-y-2">
                    {riskCategory.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-card-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}

          <Button onClick={goNext} className="w-full h-12 gap-2">
            Continue <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      );

      case 6: return (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Tell Us About Your Income</h1>
            <p className="text-muted-foreground mt-1">Helps us recommend the right plans</p>
          </div>
          <div className="space-y-2">
            {[
              { val: "below_2.5l", label: "Below ₹2.5 Lakh", desc: "Eligible for free government schemes" },
              { val: "2.5l_5l", label: "₹2.5L – ₹5L", desc: "Subsidized plans available" },
              { val: "5l_10l", label: "₹5L – ₹10L", desc: "Mid-range private plans" },
              { val: "10l_25l", label: "₹10L – ₹25L", desc: "Premium plans recommended" },
              { val: "above_25l", label: "Above ₹25L", desc: "Comprehensive family floater plans" },
            ].map(b => (
              <button key={b.val} onClick={() => setIncomeBracket(b.val)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${incomeBracket === b.val ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                <span className="text-lg">💰</span>
                <div><p className="font-medium text-sm text-card-foreground">{b.label}</p><p className="text-xs text-muted-foreground">{b.desc}</p></div>
              </button>
            ))}
          </div>
          {(incomeBracket === "below_2.5l" || incomeBracket === "2.5l_5l") && (
            <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-sm flex gap-2">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              <div><strong>You may be eligible for PMJAY Ayushman Bharat</strong> — Free ₹5 Lakh coverage!</div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Employment Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "salaried", label: "Salaried", icon: "🏢" },
                { val: "government", label: "Government", icon: "🏛️" },
                { val: "self_employed", label: "Self Employed", icon: "🏪" },
                { val: "farmer", label: "Farmer", icon: "👨‍🌾" },
                { val: "retired", label: "Retired", icon: "👴" },
              ].map(e => (
                <button key={e.val} onClick={() => setEmploymentType(e.val)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${employmentType === e.val ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <span>{e.icon}</span><span className="text-sm font-medium text-card-foreground">{e.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={goNext} disabled={!incomeBracket || !employmentType} className="w-full h-12 gap-2">
            Continue <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      );

      case 7: return (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Who Are We Protecting?</h1>
            <p className="text-muted-foreground mt-1">Add all family members for personalised coverage</p>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {familyMembers.map(m => (
              <div key={m.id} className={`flex items-center gap-3 p-3 rounded-lg border ${m.id === "self" ? "border-success/40 bg-success/5" : "border-border"}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {m.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-card-foreground truncate">{m.name}</p>
                    <Badge variant="secondary" className="text-xs">{m.relation}</Badge>
                  </div>
                  {m.conditions.length > 0 && m.conditions[0] !== "None" && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {m.conditions.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                    </div>
                  )}
                </div>
                {m.id !== "self" && (
                  <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>
          {showAddMember ? (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <Input placeholder="Full Name" value={newMember.name} onChange={e => setNewMember(n => ({ ...n, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={newMember.relation} onValueChange={v => setNewMember(n => ({ ...n, relation: v }))}>
                  <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
                  <SelectContent>
                    {["Spouse","Son","Daughter","Father","Mother","Father-in-Law","Mother-in-Law","Sibling"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newMember.gender} onValueChange={v => setNewMember(n => ({ ...n, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input type="date" value={newMember.dateOfBirth} onChange={e => setNewMember(n => ({ ...n, dateOfBirth: e.target.value }))} />
              <div className="flex flex-wrap gap-2">
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
              <div className="flex gap-2">
                <Button onClick={addMember} size="sm" disabled={!newMember.name || !newMember.relation || !newMember.dateOfBirth} className="gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddMember(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowAddMember(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Add Family Member
            </Button>
          )}
          <div className="p-3 bg-secondary/50 rounded-lg text-sm text-center">
            <strong>{familyMembers.length}</strong> members · Recommended: <strong>₹{(familyMembers.length * 10).toLocaleString()},00,000</strong>
          </div>
          <Button onClick={goNext} className="w-full h-12 gap-2">Continue <ArrowRight className="h-5 w-5" /></Button>
        </div>
      );

      case 8: {
        const sections = [
          { key: "policies", title: "Previous Insurance Policies", desc: "Upload policy document PDFs" },
          { key: "reports", title: "Recent Medical Reports", desc: "Blood reports, X-rays, Discharge summaries" },
          { key: "conditions", title: "Existing Conditions / Prescriptions", desc: "Upload prescription images" },
          { key: "claims", title: "Previous Claim Documents", desc: "Past hospital bills" },
        ] as const;
        return (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Upload Medical History</h1>
              <p className="text-muted-foreground mt-1">Optional — helps AI give better predictions</p>
            </div>
            <div className="space-y-3">
              {sections.map(s => (
                <div key={s.key} className="border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setOpenSections(o => ({ ...o, [s.key]: !o[s.key] }))}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {uploadedFiles[s.key]?.length > 0
                        ? <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                        : <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                      <div className="text-left">
                        <p className="font-medium text-sm text-card-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                    {openSections[s.key] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {openSections[s.key] && (
                    <div className="px-4 pb-4 space-y-2">
                      {uploadedFiles[s.key]?.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-secondary/30 rounded text-sm">
                          <span className="text-card-foreground truncate">{f}</span>
                          <button onClick={() => setUploadedFiles(u => ({ ...u, [s.key]: u[s.key].filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive ml-2">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/30 transition-colors">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload</span>
                        <input type="file" className="hidden" onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) setUploadedFiles(u => ({ ...u, [s.key]: [...(u[s.key] || []), `${f.name} — ${(f.size / 1024).toFixed(0)} KB`] }));
                        }} />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { goNext(); completeOnboarding(); }} className="flex-1 h-12">Skip & Finish</Button>
              <Button onClick={() => { goNext(); completeOnboarding(); }} className="flex-1 h-12 gap-2">
                Complete Setup <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        );
      }

      case 9: return (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
          {saving && !saved ? (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-lg font-medium text-card-foreground">Saving your profile…</p>
              <p className="text-sm text-muted-foreground">Setting up your AI-powered dashboard</p>
            </>
          ) : saved ? (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle className="h-14 w-14 text-success" />
                </div>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-card-foreground">You're all set! 🎉</motion.h1>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="space-y-2 text-left bg-secondary/30 rounded-lg p-4 max-w-xs">
                {[
                  "Phone Verified ✓",
                  "Personal Info Confirmed ✓",
                  "Health Assessment Complete ✓",
                  `${familyMembers.length} Family Member${familyMembers.length !== 1 ? "s" : ""} Added ✓`,
                  "Profile Saved to Firebase ✓",
                  "AI Analysis Ready ✓",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-card-foreground">{item}</span>
                  </div>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <Button onClick={() => navigate("/dashboard")} className="h-12 px-8 gap-2 text-base">
                  Go to My Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </>
          ) : (
            <Button onClick={() => navigate("/dashboard")} className="h-12 px-8 gap-2 text-base">
              Go to My Dashboard <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <LeftPanel />
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden p-4 bg-primary text-primary-foreground flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <span className="font-bold">Health Insurance Saathi</span>
          <span className="ml-auto text-sm opacity-80">Step {step}/7</span>
        </div>
        <div className="h-1 bg-secondary">
          <motion.div className="h-full bg-primary" animate={{ width: `${(step / 9) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
        <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-md">
            {step > 1 && step < 9 && (
              <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={step} custom={direction} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
