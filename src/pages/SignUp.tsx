import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyError } from "@/lib/errorMessages";
import { toast } from "sonner";

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, form.phone);
    setLoading(false);
    if (error) { 
      toast.error(getUserFriendlyError(error)); 
      return; 
    }
    setDone(true);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { 
      toast.error(getUserFriendlyError(error)); 
      setGoogleLoading(false); 
    }
  };

  if (done) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
          <CheckCircle className="h-12 w-12 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Check Your Email!</h1>
        <p className="text-muted-foreground">We've sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.</p>
        <Button onClick={() => navigate("/login")} className="w-full gap-2">
          Go to Login <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[440px] flex-shrink-0 bg-primary flex-col justify-between p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-48 h-48 rounded-full bg-white/20" />
          <div className="absolute bottom-40 -right-20 w-64 h-64 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Health Insurance</h2>
              <p className="text-sm opacity-75">Saathi</p>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 leading-tight">India's smartest health insurance platform</h1>
          <p className="text-primary-foreground/70 mb-8">Join 10,000+ families who use AI to manage, compare and optimise their health coverage.</p>
          <div className="space-y-4">
            {["Real-time AI policy analysis", "Family risk dashboard", "Instant claim eligibility checker", "Hyperlocal hospital finder"].map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 bg-white/10 rounded-xl p-4">
          <p className="text-sm italic opacity-90">"Saathi helped us find a better plan and save ₹12,000 a year in premiums."</p>
          <p className="text-xs opacity-60 mt-2">— Ramesh Patil, Nashik</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl text-foreground">Health Insurance Saathi</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-1">Free forever · No credit card required</p>
          </div>

          {/* Google Sign Up */}
          <Button variant="outline" className="w-full gap-3 h-12" onClick={handleGoogle} disabled={googleLoading}>
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or sign up with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="fullName" placeholder="Rajesh Kumar" className="pl-9 h-11" value={form.fullName} onChange={e => update("fullName", e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-9 h-11" value={form.email} onChange={e => update("email", e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Mobile Number (optional)</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="phone" type="tel" placeholder="9876543210" className="pl-9 h-11" value={form.phone} onChange={e => update("phone", e.target.value)} maxLength={10} />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPass ? "text" : "password"} placeholder="Min 8 characters" className="pl-9 pr-10 h-11" value={form.password} onChange={e => update("password", e.target.value)} required />
                <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowPass(s => !s)}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="confirm" type={showPass ? "text" : "password"} placeholder="Repeat password" className="pl-9 h-11" value={form.confirm} onChange={e => update("confirm", e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 gap-2 text-base" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and{" "}
            <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
