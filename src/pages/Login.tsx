import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Eye, EyeOff, Loader2, Mail, Lock,
  ArrowRight, ArrowLeft, CheckCircle, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyError } from "@/lib/errorMessages";
import { toast } from "sonner";

// ── Shared left panel ─────────────────────────────────────────────────────────
function LeftPanel({ mode }: { mode: "login" | "forgot" }) {
  return (
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
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.div key="login-text"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h1 className="text-3xl font-bold mb-4 leading-tight">
                Welcome back to your insurance dashboard
              </h1>
              <p className="text-primary-foreground/70">
                Your AI-powered health insurance advisor is ready to help.
              </p>
            </motion.div>
          ) : (
            <motion.div key="forgot-text"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h1 className="text-3xl font-bold mb-4 leading-tight">
                Reset your password securely
              </h1>
              <p className="text-primary-foreground/70">
                We'll send a reset link to your email — valid for 1 hour.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="relative z-10 bg-white/10 rounded-xl p-4">
        <p className="text-sm italic opacity-90">
          "The AI gap analysis helped us identify ₹8L of underinsurance we didn't even know about."
        </p>
        <p className="text-xs opacity-60 mt-2">— Priya Sharma, Pune</p>
      </div>
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginForm({ onForgot }: { onForgot: (prefill: string) => void }) {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoad, setGoogle] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(getUserFriendlyError(error));
      return;
    }
    toast.success("Welcome back!");
    navigate("/dashboard");
  };

  const handleGoogle = async () => {
    setGoogle(true);
    const { error } = await signInWithGoogle();
    if (error) { 
      toast.error(getUserFriendlyError(error)); 
      setGoogle(false); 
    }
  };

  return (
    <motion.div key="login"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}
      className="w-full max-w-md space-y-6">

      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 mb-4">
        <Shield className="h-8 w-8 text-primary" />
        <span className="font-bold text-xl text-foreground">Health Insurance Saathi</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Sign in to your account</h1>
        <p className="text-muted-foreground mt-1">Your insurance data is waiting for you</p>
      </div>

      {/* Google */}
      <Button variant="outline" className="w-full gap-3 h-12" onClick={handleGoogle} disabled={googleLoad}>
        {googleLoad ? <Loader2 className="h-4 w-4 animate-spin" /> : (
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
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="you@example.com"
              className="pl-9 h-11" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => onForgot(email)}
              className="text-xs text-primary hover:underline focus:outline-none"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="password" type={showPass ? "text" : "password"} placeholder="Your password"
              className="pl-9 pr-10 h-11" value={password}
              onChange={e => setPassword(e.target.value)} required />
            <button type="button" className="absolute right-3 top-3 text-muted-foreground"
              onClick={() => setShowPass(s => !s)}>
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 gap-2 text-base" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="text-primary font-medium hover:underline">Create one free</Link>
      </p>
    </motion.div>
  );
}

// ── Forgot password form ──────────────────────────────────────────────────────
function ForgotForm({ prefill, onBack }: { prefill: string; onBack: () => void }) {
  const { resetPassword } = useAuth();
  const [email, setEmail]   = useState(prefill);
  const [loading, setLoad]  = useState(false);
  const [sent, setSent]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email address."); return; }

    setLoad(true);
    const { error } = await resetPassword(email.trim().toLowerCase());
    setLoad(false);

    if (error) {
      const msg =
        error.code === "auth/user-not-found"     ? "No account found with this email address." :
        error.code === "auth/invalid-email"       ? "Please enter a valid email address." :
        error.code === "auth/too-many-requests"   ? "Too many requests. Please wait a few minutes." :
        error.message;
      toast.error(msg);
      return;
    }

    setSent(true);
  };

  return (
    <motion.div key="forgot"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}
      className="w-full max-w-md space-y-6">

      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 mb-4">
        <Shield className="h-8 w-8 text-primary" />
        <span className="font-bold text-xl text-foreground">Health Insurance Saathi</span>
      </div>

      {/* Back button */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Sign In
      </button>

      <AnimatePresence mode="wait">
        {!sent ? (
          /* ── Step 1: Enter email ── */
          <motion.div key="enter-email"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6">

            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
              <p className="text-muted-foreground mt-1">
                Enter your registered email and we'll send you a reset link instantly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reset-email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9 h-11"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 gap-2 text-base" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  : <><Mail className="h-4 w-4" /> Send Reset Link</>}
              </Button>
            </form>

            <div className="p-4 bg-secondary/40 rounded-xl text-sm text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">How it works:</p>
              <p>1. Enter your registered email address above</p>
              <p>2. Check your inbox for a reset link (check spam too)</p>
              <p>3. Click the link — it expires in <strong>1 hour</strong></p>
              <p>4. Set your new password and sign in</p>
            </div>
          </motion.div>

        ) : (
          /* ── Step 2: Email sent ── */
          <motion.div key="email-sent"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center">

            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}>
                <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle className="h-11 w-11 text-success" />
                </div>
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">Check your inbox!</h2>
                <p className="text-muted-foreground mt-2">
                  We've sent a password reset link to
                </p>
                <p className="font-semibold text-foreground mt-1 break-all">{email}</p>
              </div>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-left space-y-2">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Didn't receive it?</strong>
              </p>
              <ul className="text-muted-foreground space-y-1 ml-1">
                <li>• Check your <strong>spam / junk folder</strong></li>
                <li>• Make sure <strong>{email}</strong> is correct</li>
                <li>• The link expires in <strong>1 hour</strong></li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full h-11 gap-2"
                onClick={() => { setSent(false); }}
              >
                <Mail className="h-4 w-4" /> Resend Email
              </Button>
              <Button className="w-full h-11 gap-2" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Login page ───────────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode]       = useState<"login" | "forgot">("login");
  const [prefillEmail, setPre] = useState("");

  const showForgot = (email: string) => {
    setPre(email);
    setMode("forgot");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <LeftPanel mode={mode} />

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <LoginForm key="login" onForgot={showForgot} />
          ) : (
            <ForgotForm key="forgot" prefill={prefillEmail} onBack={() => setMode("login")} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
