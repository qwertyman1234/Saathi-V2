import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import HealthInsuranceForm, { type HealthInsuranceFormData } from "@/components/buy-insurance/HealthInsuranceForm";
import StepPreferences, { type Preferences } from "@/components/buy-insurance/StepPreferences";
import StepComparePlans from "@/components/buy-insurance/StepComparePlans";
import StepReview from "@/components/buy-insurance/StepReview";

const stepTitles = ["Your Profile", "Preferences", "Compare Plans", "Review & Buy"];

const BuyInsurance = () => {
  const [step, setStep] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paid, setPaid] = useState(false);
  const [formData, setFormData] = useState<HealthInsuranceFormData | null>(null);

  const [prefs, setPrefs] = useState<Preferences>({
    maxPremium: 5000,
    minCoverage: 500000,
    maxPedWait: 4,
    selectedFeatures: [],
  });

  const handleProfileComplete = (data: HealthInsuranceFormData) => {
    setFormData(data);
    setStep(1);
  };

  const handlePay = () => {
    setPaid(true);
    toast.success("Payment successful! Your policy is active.");
  };

  const handleReset = () => {
    setStep(0);
    setPaid(false);
    setSelectedPlanId("");
    setFormData(null);
    setPrefs({ maxPremium: 5000, minCoverage: 500000, maxPedWait: 4, selectedFeatures: [] });
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Progress bar */}
      {!paid && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {stepTitles.map((title, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step
                      ? "bg-accent text-accent-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:inline ${
                    i === step ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {title}
                </span>
                {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1 hidden sm:block" />}
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={false}
              animate={{ width: `${((step + 1) / 4) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <HealthInsuranceForm />
        )}
        {step === 1 && (
          <StepPreferences prefs={prefs} onUpdate={setPrefs} onNext={() => setStep(2)} onBack={() => setStep(0)} />
        )}
        {step === 2 && (
          <StepComparePlans
            prefs={prefs}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepReview
            planId={selectedPlanId}
            paid={paid}
            onPay={handlePay}
            onBack={() => setStep(2)}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuyInsurance;
