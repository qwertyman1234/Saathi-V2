import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Briefcase, IndianRupee, Save, Loader2, CheckCircle, Camera, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function UserProfile() {
  const { user, profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    fullName:    profile?.fullName    ?? "",
    phone:       profile?.phone       ?? "",
    dateOfBirth: profile?.dateOfBirth ?? "",
    gender:      profile?.gender      ?? "",
    city:        profile?.city        ?? "",
    state:       profile?.state       ?? "",
    pincode:     profile?.pincode     ?? "",
    incomeRange: profile?.incomeRange ?? "",
    occupation:  profile?.occupation  ?? "",
  });

  const update = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);
    if (error) { toast.error("Failed to save: " + error.message); return; }
    setSaved(true);
    toast.success("Profile updated successfully!");
  };

  const initials = form.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and account settings</p>
      </motion.div>

      {/* Avatar card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl p-6 card-shadow flex items-center gap-6">
        <div className="relative">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={form.fullName} className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center ring-4 ring-primary/20">
              <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border-2 border-border flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-card-foreground">{form.fullName || "Your Name"}</h2>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="h-3 w-3" /> Account Verified
            </span>
            {profile?.onboardingCompleted && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Onboarding Complete
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 card-shadow space-y-6">

        <h3 className="font-semibold text-card-foreground text-lg border-b border-border pb-3">Personal Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="fullName" className="pl-9" placeholder="Rajesh Kumar"
                value={form.fullName} onChange={e => update("fullName", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="phone" className="pl-9" placeholder="9876543210" maxLength={10}
                value={form.phone} onChange={e => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" className="pl-9 opacity-60" value={user?.email ?? ""} disabled />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date"
              value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={v => update("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pincode">PIN Code</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="pincode" className="pl-9" placeholder="411001" maxLength={6}
                value={form.pincode} onChange={e => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Pune"
              value={form.city} onChange={e => update("city", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>State</Label>
            <Select value={form.state} onValueChange={v => update("state", v)}>
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {["Maharashtra","Delhi","Karnataka","Tamil Nadu","Gujarat","Rajasthan",
                  "Uttar Pradesh","West Bengal","Telangana","Kerala","Punjab","Madhya Pradesh",
                  "Odisha","Assam","Haryana","Bihar","Jharkhand","Chhattisgarh","Other"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <h3 className="font-semibold text-card-foreground text-lg border-b border-border pb-3 pt-2">Financial Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Annual Income Range</Label>
            <Select value={form.incomeRange} onValueChange={v => update("incomeRange", v)}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select income range" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="below_2.5l">Below ₹2.5 Lakh</SelectItem>
                <SelectItem value="2.5l_5l">₹2.5L – ₹5L</SelectItem>
                <SelectItem value="5l_10l">₹5L – ₹10L</SelectItem>
                <SelectItem value="10l_25l">₹10L – ₹25L</SelectItem>
                <SelectItem value="above_25l">Above ₹25L</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Employment Type</Label>
            <Select value={form.occupation} onValueChange={v => update("occupation", v)}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select employment type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salaried">Salaried (Private)</SelectItem>
                <SelectItem value="government">Government Employee</SelectItem>
                <SelectItem value="self_employed">Self Employed</SelectItem>
                <SelectItem value="farmer">Farmer / Agricultural</SelectItem>
                <SelectItem value="retired">Retired / Senior</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-success text-sm">
              <CheckCircle className="h-4 w-4" /> Changes saved successfully
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} className="ml-auto gap-2 h-11 px-6">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </motion.div>

      {/* Account section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <h3 className="font-semibold text-card-foreground text-lg border-b border-border pb-3">Account</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-card-foreground text-sm">Email Address</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">Verified</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-card-foreground text-sm">Sign-in Method</p>
            <p className="text-muted-foreground text-sm capitalize">
              {user?.providerData?.[0]?.providerId === "google.com" ? "Google Account" : "Email & Password"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-card-foreground text-sm">Member Since</p>
            <p className="text-muted-foreground text-sm">
              {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
