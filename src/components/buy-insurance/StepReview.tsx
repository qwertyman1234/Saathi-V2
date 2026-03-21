import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Download, Star, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { insurancePlans } from "@/data/insurancePlans";
import { toast } from "sonner";
import { useRazorpayPayment } from "@/hooks/useRazorpayPayment";
import { useAuth } from "@/contexts/AuthContext";
import { RevealHiddenThings } from "@/components/RevealHiddenThings";

interface Props {
  planId: string;
  paid: boolean;
  onPay: () => void;
  onBack: () => void;
  onReset: () => void;
}

const fadeVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const StepReview = ({ planId, paid, onPay, onBack, onReset }: Props) => {
  const { user } = useAuth();
  const [policyNumber, setPolicyNumber] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { isLoading, isProcessing, error, policyId, initiatePayment } =
    useRazorpayPayment({
      userId: user?.uid || "",
      email: user?.email || "",
      phone: user?.phoneNumber || "",
      name: user?.displayName || "User",
    });

  const plan = insurancePlans.find((p) => p.id === planId);
  if (!plan) return null;

  const handlePaymentClick = async () => {
    if (!user?.uid) {
      toast.error("Please log in to continue");
      return;
    }

    const generatedId = await initiatePayment(plan, plan.premium, parseFloat(plan.coverageLabel));
    
    if (generatedId) {
      setPolicyNumber(generatedId);
      setPaymentSuccess(true);
      onPay(); // Trigger parent component state update
    }
  };

  if (paid || paymentSuccess) {
    const displayPolicyNumber = policyNumber || policyId || `SAA-${Date.now().toString().slice(-8)}`;

    return (
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center py-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6"
        >
          <Check className="h-10 w-10 text-accent" />
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Policy Purchased! 🎉
        </h1>
        <p className="text-muted-foreground mb-8">
          Your {plan.name} policy is now active.
        </p>

        <div className="bg-card rounded-lg p-6 card-shadow max-w-sm mx-auto text-left space-y-3 mb-6">
          <h3 className="font-semibold text-foreground text-sm mb-2">
            Policy Details
          </h3>
          <DetailRow label="Policy No." value={displayPolicyNumber} mono />
          <DetailRow label="Plan" value={plan.name} />
          <DetailRow label="Insurer" value={plan.insurer} />
          <DetailRow label="Coverage" value={plan.coverageLabel} />
          <DetailRow label="Premium" value={`₹${plan.premium.toLocaleString()}/mo`} />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge className="bg-accent/20 text-accent text-[10px]">
              Active
            </Badge>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() =>
              toast.info("Policy document download feature coming soon...")
            }
          >
            <Download className="h-4 w-4" /> Download Policy
          </Button>
          <Button onClick={onReset}>Buy Another Policy</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div key="step-review" {...fadeVariants} transition={{ duration: 0.3 }}>
      <h1 className="text-2xl font-bold text-foreground mb-1">Review & Purchase</h1>
      <p className="text-sm text-muted-foreground mb-6">Confirm your selected plan details.</p>

      <div className="bg-card rounded-lg p-6 card-shadow space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <Badge className={`${plan.badgeColor} text-[10px] border-0`}>{plan.badge}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{plan.insurer}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">{plan.rating}</span>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2.5">
          <DetailRow label="Monthly Premium" value={`₹${plan.premium.toLocaleString()}`} />
          <DetailRow label="Coverage Amount" value={plan.coverageLabel} />
          <DetailRow label="PED Waiting Period" value={`${plan.pedWait} year${plan.pedWait !== 1 ? "s" : ""}`} />
          <DetailRow label="Claim Settlement Ratio" value={`${plan.claimRatio}%`} />
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Key Features</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.features.map(f => (
              <span key={f} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{f}</span>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center text-base font-bold">
            <span className="text-foreground">Total (Monthly)</span>
            <span className="text-foreground">₹{plan.premium.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack} disabled={isLoading || isProcessing}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={handlePaymentClick}
          disabled={isLoading || isProcessing}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading || isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Buy Now"
          )}
        </Button>
      </div>

      {/* Reveal Hidden Things section */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
              Before you buy, know what's hidden in this policy
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
              Insurance companies hide restrictions and exclusions in fine print. Let AI reveal what you're REALLY getting.
            </p>
          </div>
        </div>
        <RevealHiddenThings 
          policyDetails={plan}
          buttonText="🔍 Show Me What's Hidden"
          buttonVariant="outline"
          className="w-full"
        />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
    </motion.div>
  );
};

const DetailRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
  </div>
);

export default StepReview;
