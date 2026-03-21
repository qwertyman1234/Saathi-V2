import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, AlertCircle, Info, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Form data interface
export interface HealthInsuranceFormData {
  // Step 1: Contact & Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  age: string;
  gender: string;
  maritalStatus: string;
  occupation: string;

  // Step 2: Health Information
  height: string; // in cm
  weight: string; // in kg
  bmi: number; // calculated
  systolicBP: string;
  diastolicBP: string;
  isSmoker: boolean;
  smokerFrequency: string; // only if smoker = yes
  alcoholConsumption: string;
  hasPreExistingConditions: boolean;
  preExistingConditions: string[]; // multiple conditions
  conditionDetails: string; // details about conditions

  // Step 3: Family Coverage & Income
  coverageType: string; // "1" (self) or "family"
  familyMembers: string; // Array stringified
  dependentAges: string; // comma-separated ages
  desiredSumInsured: string; // in Lakhs
  annualIncomeRange: string;

  // Step 4: Review & Submission
  agreedToTerms: boolean;
  timestamp: string;
}

const STORAGE_KEY = "healthInsuranceFormData";
const PRE_EXISTING_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "COPD",
  "Kidney Disease",
  "Liver Disease",
  "Cancer",
  "Thyroid Disorder",
  "Arthritis",
  "Others"
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const HealthInsuranceForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<HealthInsuranceFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    gender: "",
    maritalStatus: "",
    occupation: "",

    height: "",
    weight: "",
    bmi: 0,
    systolicBP: "",
    diastolicBP: "",
    isSmoker: false,
    smokerFrequency: "",
    alcoholConsumption: "none",
    hasPreExistingConditions: false,
    preExistingConditions: [],
    conditionDetails: "",

    coverageType: "1",
    familyMembers: JSON.stringify([]),
    dependentAges: "",
    desiredSumInsured: "",
    annualIncomeRange: "",

    agreedToTerms: false,
    timestamp: new Date().toISOString(),
  });

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error("Error loading form data:", err);
      }
    }
  }, []);

  // Save form data to localStorage
  const saveFormData = (data: HealthInsuranceFormData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // Calculate BMI
  useEffect(() => {
    if (formData.height && formData.weight) {
      const heightInMeters = parseFloat(formData.height) / 100;
      const weightInKg = parseFloat(formData.weight);
      if (heightInMeters > 0 && weightInKg > 0) {
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        setFormData(prev => ({
          ...prev,
          bmi: Math.round(bmi * 10) / 10,
        }));
      }
    }
  }, [formData.height, formData.weight]);

  const updateFormData = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    saveFormData(updated);
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      // Step 1 validation
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      if (!/^\d{10}$/.test(formData.phone.replace(/[^\d]/g, ""))) newErrors.phone = "Phone must be 10 digits";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.age) newErrors.age = "Age is required";
      if (parseInt(formData.age) < 18 || parseInt(formData.age) > 70) {
        newErrors.age = "Age must be between 18 and 70";
      }
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.maritalStatus) newErrors.maritalStatus = "Marital status is required";
      if (!formData.occupation.trim()) newErrors.occupation = "Occupation is required";
    } else if (currentStep === 1) {
      // Step 2 validation
      if (!formData.height) newErrors.height = "Height is required";
      if (!formData.weight) newErrors.weight = "Weight is required";
      if (!formData.systolicBP) newErrors.systolicBP = "Systolic BP is required";
      if (!formData.diastolicBP) newErrors.diastolicBP = "Diastolic BP is required";
      if (formData.isSmoker && !formData.smokerFrequency) newErrors.smokerFrequency = "Smoking frequency is required";
      if (formData.hasPreExistingConditions && formData.preExistingConditions.length === 0) {
        newErrors.preExistingConditions = "Select at least one condition";
      }
      if (formData.hasPreExistingConditions && !formData.conditionDetails.trim()) {
        newErrors.conditionDetails = "Please provide details about your conditions";
      }
    } else if (currentStep === 2) {
      // Step 3 validation
      if (!formData.desiredSumInsured) newErrors.desiredSumInsured = "Sum insured is required";
      if (formData.coverageType === "family" && !formData.dependentAges.trim()) {
        newErrors.dependentAges = "Dependent ages are required for family coverage";
      }
      if (!formData.annualIncomeRange) newErrors.annualIncomeRange = "Income range is required";
    } else if (currentStep === 3) {
      // Step 4 validation
      if (!formData.agreedToTerms) newErrors.agreedToTerms = "You must agree to terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      // Simulate submission delay (in real app, send to API)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Log the collected data
      console.log("=== Health Insurance Form Data ===", formData);

      // Clear localStorage after successful submission
      localStorage.removeItem(STORAGE_KEY);

      // Show confirmation
      setShowConfirmation(true);
      toast.success("Form submitted successfully!");

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/buy-insurance/preferences");
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCondition = (condition: string) => {
    const updated = formData.preExistingConditions.includes(condition)
      ? formData.preExistingConditions.filter(c => c !== condition)
      : [...formData.preExistingConditions, condition];
    updateFormData("preExistingConditions", updated);
  };

  const stepTitles = [
    "Contact & Personal Info",
    "Health Information",
    "Coverage & Income",
    "Review & Confirm"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Health Insurance Application
          </h1>
          <p className="text-slate-600">Complete your profile for personalized insurance plans</p>
        </div>

        {/* Step Indicators */}
        {!showConfirmation && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              {stepTitles.map((title, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 ${
                      i < step
                        ? "bg-green-600 text-white"
                        : i === step
                          ? "bg-green-600 text-white scale-110"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {i < step ? <Check className="h-5 w-5" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs md:text-sm text-center font-medium transition-colors ${
                      i === step ? "text-green-600" : "text-slate-600"
                    }`}
                  >
                    {title}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-600 to-green-500"
                initial={false}
                animate={{ width: `${((step + 1) / 4) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {!showConfirmation ? (
            <motion.div
              key={`step-${step}`}
              {...fadeInUp}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-6 md:p-8"
            >
              {/* Step 1: Contact & Personal Information */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start gap-3 mb-5 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        We need your contact and personal information to customize insurance plans for you.
                      </p>
                    </div>
                  </div>

                  {/* Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={e => updateFormData("firstName", e.target.value)}
                        className={`transition-all ${errors.firstName ? "border-red-500 focus:ring-red-500" : ""}`}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={e => updateFormData("lastName", e.target.value)}
                        className={`transition-all ${errors.lastName ? "border-red-500 focus:ring-red-500" : ""}`}
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email & Phone Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={e => updateFormData("email", e.target.value)}
                        className={`transition-all ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={e => updateFormData("phone", e.target.value)}
                        className={`transition-all ${errors.phone ? "border-red-500 focus:ring-red-500" : ""}`}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* City, Age Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={e => updateFormData("city", e.target.value)}
                        className={`transition-all ${errors.city ? "border-red-500 focus:ring-red-500" : ""}`}
                      />
                      {errors.city && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.city}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Age <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="32"
                        value={formData.age}
                        onChange={e => updateFormData("age", e.target.value)}
                        min="18"
                        max="70"
                        className={`transition-all ${errors.age ? "border-red-500 focus:ring-red-500" : ""}`}
                      />
                      {errors.age && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.age}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Gender, Marital Status Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Gender <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.gender} onValueChange={v => updateFormData("gender", v)}>
                        <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.gender}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Marital Status <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={v => updateFormData("maritalStatus", v)}
                      >
                        <SelectTrigger className={errors.maritalStatus ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.maritalStatus && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.maritalStatus}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Occupation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Occupation <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Software Engineer"
                      value={formData.occupation}
                      onChange={e => updateFormData("occupation", e.target.value)}
                      className={`transition-all ${errors.occupation ? "border-red-500 focus:ring-red-500" : ""}`}
                    />
                    {errors.occupation && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.occupation}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Health Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start gap-3 mb-5 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        Accurate health information helps us provide the best coverage for your needs.
                      </p>
                    </div>
                  </div>

                  {/* Physical Measurements */}
                  <div className="border-l-4 border-green-600 pl-4 py-2">
                    <h3 className="font-semibold text-slate-900 mb-4">Physical Measurements</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Height (cm) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="170"
                          value={formData.height}
                          onChange={e => updateFormData("height", e.target.value)}
                          className={`transition-all ${errors.height ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                        {errors.height && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.height}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Weight (kg) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="75"
                          value={formData.weight}
                          onChange={e => updateFormData("weight", e.target.value)}
                          className={`transition-all ${errors.weight ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                        {errors.weight && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.weight}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">BMI (Auto-calculated)</Label>
                        <div className="flex items-center justify-center h-10 bg-gradient-to-r from-green-50 to-green-100 rounded-md border border-green-300">
                          <span className="font-bold text-lg text-green-700">{formData.bmi || "—"}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {formData.bmi ? `BMI: ${formData.bmi < 18.5 ? "Underweight" : formData.bmi < 25 ? "Normal" : formData.bmi < 30 ? "Overweight" : "Obese"}` : "Enter height and weight"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Blood Pressure */}
                  <div className="border-l-4 border-green-600 pl-4 py-2">
                    <h3 className="font-semibold text-slate-900 mb-4">Blood Pressure</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Systolic (mmHg) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="120"
                          value={formData.systolicBP}
                          onChange={e => updateFormData("systolicBP", e.target.value)}
                          className={`transition-all ${errors.systolicBP ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                        {errors.systolicBP && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.systolicBP}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Diastolic (mmHg) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="80"
                          value={formData.diastolicBP}
                          onChange={e => updateFormData("diastolicBP", e.target.value)}
                          className={`transition-all ${errors.diastolicBP ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                        {errors.diastolicBP && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.diastolicBP}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lifestyle Habits */}
                  <div className="border-l-4 border-green-600 pl-4 py-2">
                    <h3 className="font-semibold text-slate-900 mb-4">Lifestyle Habits</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <Label className="text-sm font-semibold cursor-pointer">Do you smoke?</Label>
                          <p className="text-xs text-slate-500 mt-1">Tobacco use affects your premium</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.isSmoker}
                            onChange={e => updateFormData("isSmoker", e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-green-600"
                          />
                        </div>
                      </div>

                      {formData.isSmoker && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <Label className="text-sm font-semibold">
                            Smoking Frequency <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.smokerFrequency}
                            onValueChange={v => updateFormData("smokerFrequency", v)}
                          >
                            <SelectTrigger
                              className={errors.smokerFrequency ? "border-red-500" : ""}
                            >
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="occasional">Occasional</SelectItem>
                              <SelectItem value="regular">Regular (1-10/day)</SelectItem>
                              <SelectItem value="heavy">Heavy (10+/day)</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.smokerFrequency && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {errors.smokerFrequency}
                            </p>
                          )}
                        </motion.div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Alcohol Consumption</Label>
                        <Select
                          value={formData.alcoholConsumption}
                          onValueChange={v => updateFormData("alcoholConsumption", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select consumption level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="occasional">Occasional</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="heavy">Heavy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Pre-existing Conditions */}
                  <div className="border-l-4 border-green-600 pl-4 py-2">
                    <h3 className="font-semibold text-slate-900 mb-4">Medical History</h3>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                      <div>
                        <Label className="text-sm font-semibold cursor-pointer">
                          Do you have pre-existing conditions?
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">This helps us find better coverage options</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.hasPreExistingConditions}
                          onChange={e => updateFormData("hasPreExistingConditions", e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-green-600"
                        />
                      </div>
                    </div>

                    {formData.hasPreExistingConditions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div>
                          <Label className="text-sm font-semibold mb-3 block">
                            Select Conditions <span className="text-red-500">*</span>
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {PRE_EXISTING_CONDITIONS.map(condition => (
                              <div key={condition} className="flex items-center gap-2">
                                <Checkbox
                                  checked={formData.preExistingConditions.includes(condition)}
                                  onCheckedChange={() => toggleCondition(condition)}
                                  className="border-slate-300"
                                />
                                <label className="text-sm cursor-pointer text-slate-700">{condition}</label>
                              </div>
                            ))}
                          </div>
                          {errors.preExistingConditions && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
                              <AlertCircle className="h-3 w-3" /> {errors.preExistingConditions}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">
                            Condition Details <span className="text-red-500">*</span>
                          </Label>
                          <textarea
                            placeholder="Please describe each condition, when diagnosed, current treatment, etc."
                            value={formData.conditionDetails}
                            onChange={e => updateFormData("conditionDetails", e.target.value)}
                            className={`w-full h-24 px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 transition-all ${
                              errors.conditionDetails
                                ? "border-red-500 focus:ring-red-500"
                                : "border-slate-300 focus:ring-green-500"
                            }`}
                          />
                          {errors.conditionDetails && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {errors.conditionDetails}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Family Coverage & Income */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start gap-3 mb-5 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-purple-800">
                        Choose coverage that matches your family structure and financial needs.
                      </p>
                    </div>
                  </div>

                  {/* Coverage Type */}
                  <div className="border-l-4 border-green-600 pl-4 py-2">
                    <h3 className="font-semibold text-slate-900 mb-4">Family Coverage</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <button
                        onClick={() => updateFormData("coverageType", "1")}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.coverageType === "1"
                            ? "border-green-600 bg-green-50"
                            : "border-slate-200 bg-slate-50 hover:border-green-300"
                        }`}
                      >
                        <div className="font-semibold text-slate-900">Self Only</div>
                        <p className="text-xs text-slate-600 mt-1">Coverage for you only</p>
                      </button>

                      <button
                        onClick={() => updateFormData("coverageType", "family")}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.coverageType === "family"
                            ? "border-green-600 bg-green-50"
                            : "border-slate-200 bg-slate-50 hover:border-green-300"
                        }`}
                      >
                        <div className="font-semibold text-slate-900">Family Floater</div>
                        <p className="text-xs text-slate-600 mt-1">Coverage for entire family</p>
                      </button>
                    </div>

                    {formData.coverageType === "family" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 mt-4"
                      >
                        <Label className="text-sm font-semibold">
                          Dependent Ages (comma-separated) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g., 35, 28, 5, 3"
                          value={formData.dependentAges}
                          onChange={e => updateFormData("dependentAges", e.target.value)}
                          className={`transition-all ${
                            errors.dependentAges ? "border-red-500 focus:ring-red-500" : ""
                          }`}
                        />
                        <p className="text-xs text-slate-500">Include ages of spouse, children, parents</p>
                        {errors.dependentAges && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.dependentAges}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Sum Insured */}
                  <div className="border-l-4 border-green-600 pl-4 py-2">
                    <h3 className="font-semibold text-slate-900 mb-4">Desired Coverage Amount</h3>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Sum Insured (in Lakhs) <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.desiredSumInsured}
                        onValueChange={v => updateFormData("desiredSumInsured", v)}
                      >
                        <SelectTrigger className={errors.desiredSumInsured ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select amount" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">₹3 Lakhs</SelectItem>
                          <SelectItem value="5">₹5 Lakhs</SelectItem>
                          <SelectItem value="10">₹10 Lakhs</SelectItem>
                          <SelectItem value="15">₹15 Lakhs</SelectItem>
                          <SelectItem value="25">₹25 Lakhs</SelectItem>
                          <SelectItem value="50">₹50 Lakhs</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.desiredSumInsured && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.desiredSumInsured}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Higher coverage means better protection for medical emergencies
                      </p>
                    </div>
                  </div>

                  {/* Annual Income */}
                  <div className="border-l-4 border-green-600 pl-4 py-2">
                    <h3 className="font-semibold text-slate-900 mb-4">Financial Information</h3>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Annual Income Range <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.annualIncomeRange}
                        onValueChange={v => updateFormData("annualIncomeRange", v)}
                      >
                        <SelectTrigger className={errors.annualIncomeRange ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select income range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="below5">Below ₹5 Lakh</SelectItem>
                          <SelectItem value="5to10">₹5 – ₹10 Lakh</SelectItem>
                          <SelectItem value="10to25">₹10 – ₹25 Lakh</SelectItem>
                          <SelectItem value="25to50">₹25 – ₹50 Lakh</SelectItem>
                          <SelectItem value="above50">Above ₹50 Lakh</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.annualIncomeRange && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.annualIncomeRange}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Helps us recommend affordable premium options for you
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Confirmation */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start gap-3 mb-5 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-800">
                        Please review your information before submitting your application.
                      </p>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Personal Information */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3">Personal Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Name:</span>
                          <span className="font-semibold text-blue-900">
                            {formData.firstName} {formData.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Email:</span>
                          <span className="font-semibold text-blue-900">{formData.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Phone:</span>
                          <span className="font-semibold text-blue-900">{formData.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">City:</span>
                          <span className="font-semibold text-blue-900">{formData.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Age:</span>
                          <span className="font-semibold text-blue-900">{formData.age} years</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Health Information */}
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-3">Health Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-amber-700">BMI:</span>
                          <span className="font-semibold text-amber-900">{formData.bmi}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Blood Pressure:</span>
                          <span className="font-semibold text-amber-900">
                            {formData.systolicBP}/{formData.diastolicBP} mmHg
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Smoker:</span>
                          <span className="font-semibold text-amber-900">
                            {formData.isSmoker ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700">Alcohol Use:</span>
                          <span className="font-semibold text-amber-900 capitalize">
                            {formData.alcoholConsumption}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Coverage Details */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-3">Coverage Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Coverage Type:</span>
                          <span className="font-semibold text-purple-900 capitalize">
                            {formData.coverageType === "1" ? "Self Only" : "Family Floater"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Sum Insured:</span>
                          <span className="font-semibold text-purple-900">₹{formData.desiredSumInsured} L</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Gender:</span>
                          <span className="font-semibold text-purple-900 capitalize">{formData.gender}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Marital Status:</span>
                          <span className="font-semibold text-purple-900 capitalize">
                            {formData.maritalStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Income & Pre-existing Conditions */}
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                      <h4 className="font-semibold text-pink-900 mb-3">Additional Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-pink-700">Annual Income:</span>
                          <span className="font-semibold text-pink-900">{formData.annualIncomeRange}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pink-700">Occupation:</span>
                          <span className="font-semibold text-pink-900">{formData.occupation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pink-700">Pre-existing Conditions:</span>
                          <span className="font-semibold text-pink-900">
                            {formData.hasPreExistingConditions ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="border-2 border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={formData.agreedToTerms}
                        onCheckedChange={v => updateFormData("agreedToTerms", v)}
                        className={`mt-1 ${errors.agreedToTerms ? "border-red-500" : ""}`}
                      />
                      <label className="text-sm text-slate-700 cursor-pointer">
                        I have read and agree to the{" "}
                        <a href="#" className="text-green-600 hover:underline font-semibold">
                          Terms & Conditions
                        </a>
                        {" "}and{" "}
                        <a href="#" className="text-green-600 hover:underline font-semibold">
                          Privacy Policy
                        </a>
                        . I authorize the insurance company to contact me for policy-related matters.
                      </label>
                    </div>
                    {errors.agreedToTerms && (
                      <p className="text-xs text-red-500 flex items-center gap-1 ml-7">
                        <AlertCircle className="h-3 w-3" /> {errors.agreedToTerms}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="flex-1 gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                {step < 3 ? (
                  <Button onClick={handleNext} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            // Confirmation Page
            <motion.div
              key="confirmation"
              {...fadeInUp}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-lg shadow-lg p-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: 1, duration: 0.6, delay: 0.2 }}
              >
                <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
              </motion.div>

              <h1 className="text-3xl font-bold text-slate-900 mb-2">Application Submitted!</h1>
              <p className="text-lg text-slate-600 mb-6">
                Thank you for completing your health insurance application.
              </p>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                <p className="text-sm text-slate-600 mb-2">Confirmation Number</p>
                <p className="text-2xl font-bold text-green-700">
                  {new Date().getTime().toString().slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  A confirmation email has been sent to <strong>{formData.email}</strong>
                </p>
              </div>

              <p className="text-slate-600 mb-8">
                We'll analyze your profile and show you the best matching insurance plans tailored to your needs.
              </p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center"
              >
                <p className="text-sm text-slate-500">Redirecting to plan comparison in 2 seconds...</p>
              </motion.div>

              <div className="mt-6 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile optimizations via CSS */}
      <style>{`
        @media (max-width: 640px) {
          .step-indicator { font-size: 0.75rem; }
          .form-card { padding: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default HealthInsuranceForm;
