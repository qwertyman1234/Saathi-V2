import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { pedConditions } from "@/data/insurancePlans";
import { useInsurancePlans } from "@/hooks/useInsurancePlans";

export interface DetailsForm {
  age: string;
  city: string;
  members: string;
  income: string;
  hasPED: boolean;
  pedCondition: string;
  isSmoker: boolean;
}

interface Props {
  form: DetailsForm;
  onUpdate: (field: string, value: string | boolean) => void;
  onNext: () => void;
}

const fadeVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const StepDetails = ({ form, onUpdate, onNext }: Props) => {
  const canProceed = form.age && form.city && form.members && form.income;

  return (
    <motion.div key="step-details" {...fadeVariants} transition={{ duration: 0.3 }}>
      <h1 className="text-2xl font-bold text-foreground mb-1">Your Details</h1>
      <p className="text-sm text-muted-foreground mb-6">Tell us about yourself so we can find the best plan.</p>

      <div className="bg-card rounded-lg p-6 card-shadow space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Age *</Label>
            <Input type="number" placeholder="32" value={form.age} onChange={e => onUpdate("age", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>City *</Label>
            <Input placeholder="Mumbai" value={form.city} onChange={e => onUpdate("city", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Members to Cover *</Label>
            <Select value={form.members} onValueChange={v => onUpdate("members", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 (Self)</SelectItem>
                <SelectItem value="2">2 (Self + Spouse)</SelectItem>
                <SelectItem value="3">3 (Family of 3)</SelectItem>
                <SelectItem value="4">4 (Family of 4)</SelectItem>
                <SelectItem value="5+">5+ (Joint Family)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Annual Income *</Label>
            <Select value={form.income} onValueChange={v => onUpdate("income", v)}>
              <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="below5">Below ₹5 Lakh</SelectItem>
                <SelectItem value="5to10">₹5 – ₹10 Lakh</SelectItem>
                <SelectItem value="10to25">₹10 – ₹25 Lakh</SelectItem>
                <SelectItem value="above25">Above ₹25 Lakh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Pre-existing Diseases (PED)</Label>
              <p className="text-xs text-muted-foreground">Do you have any pre-existing conditions?</p>
            </div>
            <Switch checked={form.hasPED} onCheckedChange={v => onUpdate("hasPED", v)} />
          </div>

          {form.hasPED && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5">
              <Label>Select Condition</Label>
              <Select value={form.pedCondition} onValueChange={v => onUpdate("pedCondition", v)}>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  {pedConditions.map(c => (
                    <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Smoker</Label>
              <p className="text-xs text-muted-foreground">Do you smoke or use tobacco?</p>
            </div>
            <Switch checked={form.isSmoker} onCheckedChange={v => onUpdate("isSmoker", v)} />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onNext} disabled={!canProceed}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default StepDetails;
