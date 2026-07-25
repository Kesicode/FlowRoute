"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Route,
  CloudRain,
  Map,
  Accessibility,
  ArrowRight,
  Cpu,
  ChevronRight,
  Star,
  Users,
  Leaf,
  Utensils,
  Search,
  MapPin,
  Navigation
} from "lucide-react";
import { travelPreferences } from "@/lib/mockData";

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
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");

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

          {/* AI Search Bar */}
          <motion.div
            variants={itemVariants}
            className="max-w-2xl mx-auto glass-panel rounded-2xl p-4 shadow-2xl mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan" />
                <input
                  type="text"
                  placeholder="From — King's Cross..."
                  value={fromQuery}
                  onChange={(e) => setFromQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-brand-cyan/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
              <div className="flex-1 relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-blue" />
                <input
                  type="text"
                  placeholder="To — Tower Bridge..."
                  value={toQuery}
                  onChange={(e) => setToQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-brand-blue/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
              <Link
                href="/planner"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-cyan text-background font-semibold text-sm hover:bg-brand-cyan/90 hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all duration-300 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Find Route
              </Link>
            </div>
          </motion.div>

          {/* Preference chips preview */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2">
            {travelPreferences.slice(0, 7).map((pref) => (
              <Link
                key={pref.id}
                href="/planner"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-400 hover:border-brand-cyan/40 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-all duration-200"
              >
                <span>{pref.emoji}</span>
                {pref.label}
              </Link>
            ))}
            <Link
              href="/planner"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-colors"
            >
              +3 more <ChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-slate-600 uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-brand-cyan/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "10+", label: "Travel Modes", icon: "🚌" },
              { value: "8", label: "Journey Sections", icon: "🗺️" },
              { value: "100%", label: "Hardcoded Demo", icon: "⚡" },
              { value: "Zero", label: "Backend Required", icon: "🔌" }
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl border border-white/5 p-4 text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-white font-display">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
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
                className={`group glass-card rounded-2xl p-6 border border-white/5 ${feature.border} transition-all duration-300`}
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
                <div className="flex-1 h-px bg-gradient-to-r from-brand-cyan/40 to-brand-blue/40" />
                <div className="flex-1 h-px bg-gradient-to-r from-brand-blue/40 to-brand-cyan/40" />
              </div>
            </div>

            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="text-center relative"
              >
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-cyan/10 to-brand-blue/10 border border-brand-cyan/20 mb-6 mx-auto">
                  <step.icon className={`w-8 h-8 text-${step.color}`} />
                  <span className="absolute -top-2 -right-2 text-[10px] font-bold text-background bg-brand-cyan rounded-full w-5 h-5 flex items-center justify-center">
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
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-card border border-white/5 hover:border-brand-cyan/30 rounded-2xl p-4 text-center cursor-pointer group transition-all duration-300"
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
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/10 via-transparent to-brand-blue/10 pointer-events-none" />
        <div className="absolute inset-0 border-y border-white/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-5xl mb-6">✈️</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Ready to plan your <br />
              <span className="text-brand-cyan">perfect journey?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Join FlowRoute and experience travel planning that considers everything — not just the map.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/planner"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-brand-cyan text-background font-bold text-base hover:bg-brand-cyan/90 hover:shadow-[0_0_30px_rgba(0,242,254,0.4)] transition-all duration-300"
              >
                <Route className="w-5 h-5" />
                Start Planning Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-base hover:bg-white/10 hover:border-white/20 transition-all duration-300"
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
