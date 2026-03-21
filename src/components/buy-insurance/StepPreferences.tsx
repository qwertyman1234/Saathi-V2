import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { priorityFeatures } from "@/data/insurancePlans";

export interface Preferences {
  maxPremium: number;
  minCoverage: number;
  maxPedWait: number;
  selectedFeatures: string[];
}

interface Props {
  prefs: Preferences;
  onUpdate: (prefs: Preferences) => void;
  onNext: () => void;
  onBack: () => void;
}

const coverageLabels: Record<number, string> = {
  200000: "₹2L", 500000: "₹5L", 750000: "₹7.5L", 1000000: "₹10L",
  1500000: "₹15L", 2500000: "₹25L",
};

const coverageSteps = [200000, 500000, 750000, 1000000, 1500000, 2500000];

const fadeVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const StepPreferences = ({ prefs, onUpdate, onNext, onBack }: Props) => {
  const toggleFeature = (f: string) => {
    const selected = prefs.selectedFeatures.includes(f)
      ? prefs.selectedFeatures.filter(x => x !== f)
      : [...prefs.selectedFeatures, f];
    onUpdate({ ...prefs, selectedFeatures: selected });
  };

  const closestCoverageIndex = coverageSteps.reduce((best, val, i) =>
    Math.abs(val - prefs.minCoverage) < Math.abs(coverageSteps[best] - prefs.minCoverage) ? i : best, 0
  );

  return (
    <motion.div key="step-prefs" {...fadeVariants} transition={{ duration: 0.3 }}>
      <h1 className="text-2xl font-bold text-foreground mb-1">What are you looking for?</h1>
      <p className="text-sm text-muted-foreground mb-6">Set your preferences to find the best matching plans.</p>

      <div className="bg-card rounded-lg p-6 card-shadow space-y-6">
        {/* Premium slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Monthly Premium Budget</Label>
            <span className="text-sm font-semibold text-primary">₹{prefs.maxPremium.toLocaleString()}</span>
          </div>
          <Slider
            value={[prefs.maxPremium]}
            onValueChange={([v]) => onUpdate({ ...prefs, maxPremium: v })}
            min={500}
            max={5000}
            step={100}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹500</span><span>₹5,000</span>
          </div>
        </div>

        {/* Coverage slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Minimum Coverage Amount</Label>
            <span className="text-sm font-semibold text-primary">
              {coverageLabels[coverageSteps[closestCoverageIndex]] || `₹${(prefs.minCoverage / 100000).toFixed(1)}L`}
            </span>
          </div>
          <Slider
            value={[closestCoverageIndex]}
            onValueChange={([v]) => onUpdate({ ...prefs, minCoverage: coverageSteps[v] })}
            min={0}
            max={coverageSteps.length - 1}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹2L</span><span>₹25L</span>
          </div>
        </div>

        {/* PED waiting slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Max PED Waiting Period</Label>
            <span className="text-sm font-semibold text-primary">{prefs.maxPedWait} {prefs.maxPedWait === 1 ? "year" : "years"}</span>
          </div>
          <Slider
            value={[prefs.maxPedWait]}
            onValueChange={([v]) => onUpdate({ ...prefs, maxPedWait: v })}
            min={0}
            max={4}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 yrs</span><span>4 yrs</span>
          </div>
        </div>

        {/* Priority Features */}
        <div className="space-y-3">
          <Label>Priority Features</Label>
          <div className="flex flex-wrap gap-2">
            {priorityFeatures.map(f => (
              <button
                key={f}
                onClick={() => toggleFeature(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  prefs.selectedFeatures.includes(f)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={onNext}>View Plans <ChevronRight className="h-4 w-4" /></Button>
      </div>
    </motion.div>
  );
};

export default StepPreferences;
