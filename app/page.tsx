"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Route,
  CloudRain,
  Map,
  Accessibility,
  ArrowRight,
  Cpu,
  Star,
  Users,
  Leaf,
  Utensils,
  Search,
  MapPin,
} from "lucide-react";
import { travelPreferences } from "@/lib/mockData";
import { useTripActions } from "@/hooks/useTripStore";

const QUICK_PROMPTS = [
  "₹15,000 Goa trip",
  "Weekend from Kochi",
  "Budget Europe 10 days",
  "Dubai family trip",
];


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
} as const;

const features = [
  {
    icon: Cpu,
    title: "AI Travel Companion",
    description: "Our AI analyses your preferences, accessibility needs, weather, and budget to recommend the perfect journey — not just the fastest one.",
    gradient: "from-cyan-500/20 to-blue-500/20",
    iconColor: "text-brand-cyan",
    border: "group-hover:border-brand-cyan/40"
  },
  {
    icon: CloudRain,
    title: "Live Weather Intelligence",
    description: "Real-time weather overlays adjust your route scores dynamically. Rain alert? We'll suggest alternatives before you leave.",
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-brand-blue",
    border: "group-hover:border-brand-blue/40"
  },
  {
    icon: Map,
    title: "Interactive Route Maps",
    description: "Beautiful Leaflet-powered maps show your route segments, transport transfers, food stops, and nearby attractions in real-time.",
    gradient: "from-indigo-500/20 to-purple-500/20",
    iconColor: "text-indigo-400",
    border: "group-hover:border-indigo-400/40"
  },
  {
    icon: Utensils,
    title: "Food & Dining Finder",
    description: "Discover the best restaurants and cafes along your route, filtered by cuisine, price, and walking distance from any transfer point.",
    gradient: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400",
    border: "group-hover:border-orange-400/40"
  },
  {
    icon: Accessibility,
    title: "Accessibility First",
    description: "Step-free routes, elevator alerts, wheelchair-accessible carriages — FlowRoute is designed to be inclusive for every traveller.",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-emerald-400",
    border: "group-hover:border-emerald-400/40"
  },
  {
    icon: Leaf,
    title: "Carbon Footprint Tracker",
    description: "See exactly how much CO₂ each route emits vs. alternatives. Choose greener travel and track your environmental savings over time.",
    gradient: "from-lime-500/20 to-green-500/20",
    iconColor: "text-lime-400",
    border: "group-hover:border-lime-400/40"
  }
];

const steps = [
  {
    number: "01",
    title: "Enter Your Journey",
    description: "Enter your origin, destination, travel date, number of travellers, and budget.",
    icon: MapPin,
    color: "brand-cyan"
  },
  {
    number: "02",
    title: "Choose Your Style",
    description: "Select your travel preferences — Eco Friendly, Tourist Mode, Wheelchair Accessible, and more.",
    icon: Star,
    color: "brand-blue"
  },
  {
    number: "03",
    title: "Get Your AI Plan",
    description: "Receive a complete travel plan with routes, weather, food stops, attractions, budget, and AI suggestions.",
    icon: Sparkles,
    color: "brand-cyan"
  }
];

export default function Home() {
  const [nlpQuery, setNlpQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Parsing your journey...");
  const router = useRouter();
  const { initTrip } = useTripActions();

  const handleSearch = async () => {
    if (!nlpQuery.trim() || isSearching) return;
    setIsSearching(true);
    setLoadingLabel("Parsing your journey...");

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nlpQuery }),
      });

      setLoadingLabel("Building your plan...");

      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          initTrip({
            from: data.from ?? "",
            to: data.to ?? "",
            departureDate: data.date,
            travellers: Number(data.travellers ?? 1),
            budget: Number(data.budget ?? 0),
            currency: "INR",
            preferences: Array.isArray(data.preferences) ? data.preferences : [],
            travelerProfile: "solo",
            safetyMode: Boolean(data.safetyMode),
          });
        }
      }
    } catch {
      // On error, just navigate to planner — they can fill in the form
    } finally {
      setIsSearching(false);
      router.push("/planner");
    }
  };

  return (
    <div className="flex flex-col overflow-hidden">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-brand-cyan/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-blue/8 rounded-full blur-[100px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,242,254,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,254,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px"
          }}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20">
              <Sparkles className="w-3 h-3" />
              AI-Powered Travel Companion
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-6"
          >
            <span className="text-white">Travel Smarter.</span>
            <br />
            <span className="bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-cyan bg-clip-text text-transparent bg-[length:200%] animate-[gradient_4s_linear_infinite]">
              Not Just Faster.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12"
          >
            FlowRoute is your AI travel companion that considers comfort, weather, accessibility,
            food, budget, and carbon footprint — choosing the <em className="text-slate-300 not-italic font-medium">most suitable journey</em> for you.
          </motion.p>

          {/* NLP Search Bar */}
          <motion.div
            variants={itemVariants}
            className="max-w-2xl mx-auto glass-panel rounded-2xl p-4 shadow-2xl mb-6"
          >
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan pointer-events-none" />
                <input
                  type="text"
                  placeholder="What's your next journey? Try: ₹15,000 Goa trip from Kochi"
                  value={nlpQuery}
                  onChange={(e) => setNlpQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-white/5 border border-white/10 focus:border-brand-cyan/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors min-h-[48px]"
                  aria-label="Describe your journey"
                />
              </div>
              {/* Find Route button */}
              <button
                onClick={handleSearch}
                disabled={isSearching || !nlpQuery.trim()}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-cyan text-background font-semibold text-sm hover:bg-brand-cyan/90 hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                aria-label="Find route"
              >
                {isSearching ? (
                  <span className="w-4 h-4 border-2 border-background/50 border-t-background rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isSearching ? loadingLabel : "Find Route"}
              </button>
            </div>

            {/* Quick prompt chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setNlpQuery(prompt)}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/10 hover:border-brand-cyan/30 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Route Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">Explore</span>
          <div className="relative w-6 h-16 flex justify-center">
            {/* Dotted route path */}
            <div className="absolute top-2 bottom-0 w-0.5 border-l-2 border-dashed border-white/10" />
            {/* Moving location pin */}
            <motion.div
              animate={{ y: [0, 40, 0] }}
              transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
              className="absolute top-0 text-brand-cyan drop-shadow-[0_0_10px_rgba(0,242,254,0.6)]"
            >
              <MapPin className="w-5 h-5 fill-brand-cyan/10" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-28 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-semibold text-brand-cyan uppercase tracking-widest">Features</span>
            <h2 className="text-4xl font-display font-bold text-white mt-3 mb-4">
              Everything a traveller needs
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              FlowRoute bundles every travel insight into one beautifully designed companion.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`group glass-card rounded-2xl p-8 border border-white/5 ${feature.border} hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl hover:bg-white/[0.03] transition-all duration-500`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                  <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-semibold text-brand-cyan uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl font-display font-bold text-white mt-3">
              Three steps to your perfect journey
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting lines between steps */}
            <div className="hidden md:absolute md:flex inset-0 items-start justify-center pointer-events-none" style={{ top: '40px' }}>
              <div className="w-full flex items-center px-[calc(100%/6)]">
                <div className="flex-1 h-0.5 bg-gradient-to-r from-brand-cyan/20 via-brand-cyan/60 to-brand-blue/20 animate-pulse" />
                <div className="flex-1 h-0.5 bg-gradient-to-r from-brand-blue/20 via-brand-blue/60 to-brand-cyan/20 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>

            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="text-center relative group cursor-default"
              >
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-cyan/10 to-brand-blue/10 border border-brand-cyan/20 mb-8 mx-auto group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(0,242,254,0.3)] transition-all duration-500 backdrop-blur-md">
                  <step.icon className={`w-10 h-10 text-${step.color} group-hover:animate-bounce`} />
                  <span className="absolute -top-3 -right-3 text-[12px] font-bold text-background bg-brand-cyan rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-[2px] border-background">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PREFERENCES SHOWCASE ─────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs font-semibold text-brand-cyan uppercase tracking-widest">Travel Modes</span>
            <h2 className="text-4xl font-display font-bold text-white mt-3 mb-4">
              Your journey, your way
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Choose from 10 travel styles and FlowRoute will tailor every recommendation to match your needs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {travelPreferences.map((pref, i) => (
              <motion.div
                key={pref.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -6, scale: 1.05 }}
                className="glass-card border border-white/5 hover:border-brand-cyan/50 hover:bg-white/[0.05] rounded-3xl p-5 text-center cursor-pointer group transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,242,254,0.2)]"
              >
                <div className="text-3xl mb-2">{pref.emoji}</div>
                <div className="text-sm font-semibold text-white mb-1">{pref.label}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{pref.description}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-blue/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-cyan/20 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 glass-card p-12 rounded-[3rem] border border-white/10 shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight">
              Ready to plan your <br />
              <span className="bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">perfect journey?</span>
            </h2>
            <p className="text-slate-300 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
              Join FlowRoute and experience travel planning that considers everything — not just the map.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                href="/planner"
                className="group inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-blue text-background font-bold text-lg hover:shadow-[0_0_40px_rgba(0,242,254,0.6)] transition-all duration-300 hover:-translate-y-1"
              >
                <Route className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Start Planning Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 hover:border-white/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <Users className="w-5 h-5" />
                View Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
