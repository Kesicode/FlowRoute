"use client";

/**
 * app/emergency/page.tsx
 *
 * Phase 7 — Emergency SOS Page
 *
 * A full-screen safety hub accessible from the PWA shortcut and navbar.
 * Works entirely offline (no API calls, all numbers hard-coded).
 *
 * Sections:
 *  1. SOS Hero — big red 112 call button, pulsing ring
 *  2. Quick-call panel — Police 100, Fire 101, Ambulance 108, Women 1091
 *  3. Safety status — shows current safetyMode toggle + EmergencyMode toggle
 *  4. Nearest services — hospital / pharmacy / police station (links to Google Maps)
 *  5. Emergency checklist — what to do right now
 *  6. Contact card — FlowRoute in-app contacts (from userProfile)
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Hospital,
  Flame,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import {
  useLanguage,
  useSettingsActions,
  useUserProfile,
} from "@/hooks/useTripStore";
import { useFlowStore } from "@/lib/store/store";

// ── Emergency numbers ─────────────────────────────────────────────────────────
const EMERGENCY_NUMBERS = [
  {
    label: "Emergency",
    labelHi: "आपातकालीन",
    labelMl: "അടിയന്തിരം",
    number: "112",
    color: "bg-red-500/15 border-red-500/30 text-red-400",
    icon: ShieldAlert,
    primary: true,
  },
  {
    label: "Police",
    labelHi: "पुलिस",
    labelMl: "പോലീസ്",
    number: "100",
    color: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    icon: Shield,
    primary: false,
  },
  {
    label: "Ambulance",
    labelHi: "एम्बुलेंस",
    labelMl: "ആംബുലൻസ്",
    number: "108",
    color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    icon: Hospital,
    primary: false,
  },
  {
    label: "Fire",
    labelHi: "अग्निशमन",
    labelMl: "അഗ്നിശമനം",
    number: "101",
    color: "bg-orange-500/15 border-orange-500/30 text-orange-400",
    icon: Flame,
    primary: false,
  },
  {
    label: "Women's Helpline",
    labelHi: "महिला हेल्पलाइन",
    labelMl: "വനിതാ ഹെൽപ്‌ലൈൻ",
    number: "1091",
    color: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    icon: Phone,
    primary: false,
  },
  {
    label: "Tourist Police",
    labelHi: "पर्यटन पुलिस",
    labelMl: "ടൂറിസ്റ്റ് പോലീസ്",
    number: "1363",
    color: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    icon: MapPin,
    primary: false,
  },
];

const CHECKLIST = [
  { en: "Stay calm — take a deep breath", hi: "शांत रहें — गहरी सांस लें", ml: "ശান്തമാകുക" },
  { en: "Call 112 for immediate help", hi: "तत्काल सहायता के लिए 112 डायल करें", ml: "112 വിളിക്കുക" },
  { en: "Share your live location with emergency contacts", hi: "अपना लाइव स्थान साझा करें", ml: "ലൈവ് ലൊക്കേഷൻ ഷെയർ ചെയ്യുക" },
  { en: "Move to a safe, well-lit public area", hi: "सुरक्षित, सार्वजनिक स्थान पर जाएं", ml: "സുരക്ഷിതമായ സ്ഥലത്ത് പോകുക" },
  { en: "Note the address or landmark for responders", hi: "पता या स्थलचिह्न नोट करें", ml: "അടുത്തുള്ള ലാൻഡ്‌മാർക്ക് കുറിക്കുക" },
];

function getLabel(item: { label: string; labelHi: string; labelMl: string }, lang: string) {
  if (lang === "hi") return item.labelHi;
  if (lang === "ml") return item.labelMl;
  return item.label;
}

// ── SOS button with confirm step ─────────────────────────────────────────────
function SOSButton({ number }: { number: string }) {
  const [confirmStep, setConfirmStep] = useState(false);

  const handleFirst = () => setConfirmStep(true);
  const handleConfirm = () => {
    window.location.href = `tel:${number}`;
    setConfirmStep(false);
  };

  useEffect(() => {
    if (!confirmStep) return;
    const t = setTimeout(() => setConfirmStep(false), 4000);
    return () => clearTimeout(t);
  }, [confirmStep]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Pulsing ring */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500/20"
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.button
          onClick={confirmStep ? handleConfirm : handleFirst}
          whileTap={{ scale: 0.95 }}
          className={`relative w-32 h-32 rounded-full font-extrabold text-white text-xl shadow-lg transition-all z-10 ${
            confirmStep
              ? "bg-red-500 shadow-red-500/40 scale-105"
              : "bg-red-600 hover:bg-red-500 shadow-red-600/30"
          }`}
          aria-label={confirmStep ? "Confirm emergency call to 112" : "Call 112 emergency"}
        >
          {confirmStep ? (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-sm font-bold">Tap again</span>
              <span className="text-3xl font-black">112</span>
              <span className="text-xs opacity-80">to call</span>
            </span>
          ) : (
            <span className="flex flex-col items-center leading-tight">
              <ShieldAlert className="w-8 h-8 mb-1" />
              <span className="text-2xl font-black">SOS</span>
              <span className="text-xs opacity-80">112</span>
            </span>
          )}
        </motion.button>
      </div>
      <p className="text-xs text-slate-500 text-center">
        {confirmStep ? "Tap again to confirm emergency call" : "Tap to call India Emergency (112)"}
      </p>
    </div>
  );
}

// ── Nearest services Google Maps links ────────────────────────────────────────
function NearbyServices({ lang }: { lang: string }) {
  const services = [
    {
      emoji: "🏥",
      en: "Nearest Hospital",
      hi: "नजदीकी अस्पताल",
      ml: "അടുത്ത ആശുപത്രി",
      query: "hospitals+near+me",
    },
    {
      emoji: "🚓",
      en: "Police Station",
      hi: "पुलिस स्टेशन",
      ml: "പോലീസ് സ്റ്റേഷൻ",
      query: "police+station+near+me",
    },
    {
      emoji: "💊",
      en: "Pharmacy",
      hi: "फार्मेसी",
      ml: "ഫാർമസി",
      query: "pharmacy+near+me",
    },
    {
      emoji: "🏦",
      en: "ATM",
      hi: "एटीएम",
      ml: "എടിഎം",
      query: "ATM+near+me",
    },
  ];

  const getLabel = (s: { en: string; hi: string; ml: string }) => {
    if (lang === "hi") return s.hi;
    if (lang === "ml") return s.ml;
    return s.en;
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {services.map((s) => (
        <a
          key={s.query}
          href={`https://www.google.com/maps/search/${s.query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/8 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all text-sm text-slate-300 font-medium"
        >
          <span className="text-xl">{s.emoji}</span>
          <span className="text-xs leading-tight">{getLabel(s)}</span>
        </a>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EmergencyPage() {
  const language = useLanguage();
  const userProfile = useUserProfile();
  const { setSafetyMode, setEmergencyMode } = useSettingsActions();
  const safetyMode = useFlowStore((s) => s.safetyMode);
  const emergencyMode = useFlowStore((s) => s.emergencyMode);
  const [checklistOpen, setChecklistOpen] = useState(false);

  useEffect(() => {
    document.title = "Emergency SOS | FlowRoute";
    // Auto-enable safety mode when visiting emergency page
    if (!safetyMode) setSafetyMode(true);
  }, [safetyMode, setSafetyMode]);

  const toggleEmergency = useCallback(() => {
    setEmergencyMode(!emergencyMode);
  }, [emergencyMode, setEmergencyMode]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <Link
        href="/journey"
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Journey
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold text-white">
          {language === "hi" ? "आपातकाल" : language === "ml" ? "അടിയന്തിരം" : "Emergency SOS"}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {language === "hi"
            ? "भारत आपातकालीन नंबर · हमेशा ऑफलाइन उपलब्ध"
            : language === "ml"
            ? "ഇന്ത്യ അടിയന്തിര നമ്പരുകൾ · എപ്പോഴും ഓഫ്‌ലൈൻ ലഭ്യമാണ്"
            : "India emergency numbers · Always available offline"}
        </p>
      </div>

      {/* SOS Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card rounded-3xl border border-red-500/20 bg-red-500/5 p-6 flex flex-col items-center gap-4"
      >
        <SOSButton number="112" />
      </motion.div>

      {/* Quick-call grid */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">
          {language === "hi" ? "त्वरित कॉल" : language === "ml" ? "ദ്രുത കോൾ" : "Quick Call"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {EMERGENCY_NUMBERS.filter((n) => !n.primary).map((num) => {
            const Icon = num.icon;
            return (
              <a
                key={num.number}
                href={`tel:${num.number}`}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-95 ${num.color}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold leading-tight">
                    {getLabel(num, language)}
                  </div>
                  <div className="text-lg font-black leading-tight">{num.number}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Safety mode status */}
      <div className="card rounded-2xl border border-white/8 p-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
          {language === "hi" ? "सुरक्षा स्थिति" : language === "ml" ? "സുരക്ഷ നില" : "Safety Status"}
        </p>
        {/* Safety mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className={`w-5 h-5 ${safetyMode ? "text-emerald-400" : "text-slate-600"}`} />
            <div>
              <p className="text-sm font-semibold text-white">
                {language === "hi" ? "सुरक्षा मोड" : language === "ml" ? "സേഫ്റ്റി മോഡ്" : "Safety Mode"}
              </p>
              <p className="text-[10px] text-slate-500">
                {safetyMode ? "Active — hazard alerts on" : "Disabled"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSafetyMode(!safetyMode)}
            className={`relative w-10 h-5.5 rounded-full transition-colors ${safetyMode ? "bg-emerald-500" : "bg-white/10"}`}
            style={{ height: "22px" }}
            aria-label="Toggle safety mode"
            role="switch"
            aria-checked={safetyMode}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${safetyMode ? "translate-x-[18px]" : ""}`}
            />
          </button>
        </div>
        {/* Emergency overlay mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className={`w-5 h-5 ${emergencyMode ? "text-red-400 animate-pulse" : "text-slate-600"}`} />
            <div>
              <p className="text-sm font-semibold text-white">
                {language === "hi" ? "आपातकाल ओवरले" : language === "ml" ? "എമർജൻസി ഓവർലേ" : "Emergency Overlay"}
              </p>
              <p className="text-[10px] text-slate-500">
                {emergencyMode ? "ACTIVE — red overlay on all screens" : "Off"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleEmergency}
            className={`relative w-10 rounded-full transition-colors ${emergencyMode ? "bg-red-500" : "bg-white/10"}`}
            style={{ height: "22px" }}
            aria-label="Toggle emergency overlay"
            role="switch"
            aria-checked={emergencyMode}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${emergencyMode ? "translate-x-[18px]" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Nearby services */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">
          {language === "hi" ? "पास की सेवाएं" : language === "ml" ? "സമീപ സേവനങ്ങൾ" : "Find Nearby"}
        </p>
        <NearbyServices lang={language} />
        <p className="text-[10px] text-slate-600 mt-2 text-center">Opens Google Maps · requires internet</p>
      </div>

      {/* Emergency checklist */}
      <div className="card rounded-2xl border border-amber-500/15 bg-amber-500/5">
        <button
          onClick={() => setChecklistOpen((o) => !o)}
          className="w-full flex items-center justify-between p-4 text-left"
          aria-expanded={checklistOpen}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white">
              {language === "hi" ? "अभी क्या करें?" : language === "ml" ? "ഇപ്പോൾ എന്ത് ചെയ്യണം?" : "What to do right now?"}
            </span>
          </div>
          {checklistOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        <AnimatePresence>
          {checklistOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {CHECKLIST.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === "hi" ? item.hi : language === "ml" ? item.ml : item.en}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User contact card */}
      {userProfile?.displayName && (
        <div className="card rounded-2xl border border-white/8 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Your Profile</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{userProfile.avatarEmoji ?? "🧳"}</span>
            <div>
              <p className="text-sm font-bold text-white">{userProfile.displayName}</p>
              <p className="text-xs text-slate-500">Share this info with emergency responders</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-600 text-center pb-4 leading-relaxed">
        Emergency numbers are for India. International travellers — check local emergency contacts.
        FlowRoute does not replace official emergency services.
      </p>
    </div>
  );
}
