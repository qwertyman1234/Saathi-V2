import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, Sparkles, ArrowRight, CheckCircle, Star,
  Users, TrendingUp, MapPin, MessageCircle, FileText,
  IndianRupee, Heart, ChevronRight, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: Sparkles, title: "AI Gap Analysis", desc: "AI scans your entire family coverage and finds dangerous gaps before they cost you.", color: "bg-purple-500/10 text-purple-600" },
  { icon: FileText, title: "Claims Tracker", desc: "Track every claim in real-time with AI-powered advice to speed up settlement.", color: "bg-blue-500/10 text-blue-600" },
  { icon: TrendingUp, title: "Policy Comparison", desc: "Compare 500+ plans side-by-side with AI recommending the best fit for your family.", color: "bg-green-500/10 text-green-600" },
  { icon: MapPin, title: "Hyperlocal Hospitals", desc: "Find cashless hospitals near you with insurer network details and patient reviews.", color: "bg-orange-500/10 text-orange-600" },
  { icon: IndianRupee, title: "Cost Estimator", desc: "Know your exact out-of-pocket cost before any procedure — no surprises.", color: "bg-yellow-500/10 text-yellow-600" },
  { icon: MessageCircle, title: "AI Chat Assistant", desc: "Get instant answers about your policy in Hindi, English, or Marathi — 24/7.", color: "bg-pink-500/10 text-pink-600" },
];

const testimonials = [
  { name: "Priya Sharma", city: "Pune", text: "The AI gap analysis saved us from being underinsured. Found a ₹12L gap for my parents!", stars: 5 },
  { name: "Ramesh Patil", city: "Nashik", text: "Switched to a better plan and saved ₹8,000/year in premiums. The comparison tool is incredible.", stars: 5 },
  { name: "Sunita Joshi", city: "Mumbai", text: "Cost estimator told me my exact out-of-pocket before my husband's knee surgery. No surprises!", stars: 5 },
];

const stats = [
  { value: "10,000+", label: "Families Protected" },
  { value: "₹2.4Cr+", label: "Claims Settled" },
  { value: "500+", label: "Plans Compared Daily" },
  { value: "4.9★", label: "Average Rating" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">Health Insurance <span className="text-primary">Saathi</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button className="gap-2">Go to Dashboard <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost">Sign In</Button></Link>
                <Link to="/signup"><Button className="gap-2">Get Started Free <ArrowRight className="h-4 w-4" /></Button></Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#testimonials" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Sign In</Button></Link>
              <Link to="/signup" className="flex-1"><Button className="w-full">Get Started</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 text-xs px-3 py-1.5 rounded-full mb-8 font-medium tracking-wide">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Health Insurance
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6 tracking-tight">
            Insurance that grows{" "}
            <span className="text-emerald-700 dark:text-emerald-200">with intention</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-base text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Built for Indian families. AI-powered insights rooted in your actual needs: gap analysis, claim guidance, hospital networks, and personalised recommendations.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup">
              <Button size="lg" className="gap-2 h-13 px-8 text-base w-full sm:w-auto">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="gap-2 h-13 px-8 text-base w-full sm:w-auto">
                Sign In to Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {["Free forever · No credit card", "Your data is encrypted & secure", "IRDAI compliant platform"].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gradient-to-r from-emerald-700 to-emerald-800 dark:from-emerald-900 dark:to-emerald-950 py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-emerald-50">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <p className="text-4xl font-bold text-emerald-50">{s.value}</p>
              <p className="text-emerald-200 text-xs mt-2 font-medium tracking-wide">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-emerald-700 dark:text-emerald-200 text-sm font-medium tracking-widest mb-3">01 / FEATURES</div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 tracking-tight">What we've built for you</h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">A complete system designed to grow with your family's insurance needs — intentional, layered, and always reaching toward better coverage.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all hover:-translate-y-1 border border-border">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-card-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-emerald-700 dark:text-emerald-200 text-sm font-medium tracking-widest mb-3">02 / PROCESS</div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 tracking-tight">How we grow your insurance</h2>
            <p className="text-muted-foreground text-base">A deliberate three-step journey — from understanding your needs to unlocking better coverage and savings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create your account", desc: "Sign up free with email or Google. No credit card required.", icon: Users },
              { step: "2", title: "Set up your profile", desc: "Add your family members, income details, and existing policies.", icon: Heart },
              { step: "3", title: "Get AI insights", desc: "AI instantly analyses your coverage and finds gaps, better plans, and savings.", icon: Sparkles },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <s.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="absolute top-0 right-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground -translate-y-1 translate-x-1">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
                {i < 2 && <ChevronRight className="hidden md:block absolute top-8 -right-4 h-6 w-6 text-muted-foreground" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-emerald-700 dark:text-emerald-200 text-sm font-medium tracking-widest mb-3">03 / VOICES</div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 tracking-tight">What families say</h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">Real insights from families who've found clarity and savings through our platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 card-shadow border border-border">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-card-foreground text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gradient-to-r from-emerald-700 to-emerald-800 dark:from-emerald-900 dark:to-emerald-950">
        <div className="max-w-3xl mx-auto text-center text-emerald-50">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Let's grow something together</h2>
            <p className="text-emerald-100 text-base mb-10 leading-relaxed">Whether you're starting from scratch or extending your coverage — we're here to help your family thrive.</p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="gap-2 h-13 px-10 text-base">
                Create Free Account <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Health Insurance Saathi</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © 2026 Health Insurance Saathi. Built for Indian families. Not an IRDAI registered broker.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
