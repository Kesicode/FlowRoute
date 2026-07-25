"use client";

import { motion } from "framer-motion";
import { Check, X, Sparkles, Volume2 } from "lucide-react";
import { ExplainabilityMetric } from "@/services/ai";
import { useSettings } from "@/lib/settings-context";
import { useVoice } from "@/hooks/useVoice";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from "recharts";

interface ExplainabilityPanelProps {
  metrics: ExplainabilityMetric[];
}

export function ExplainabilityPanel({ metrics }: ExplainabilityPanelProps) {
  const { language } = useSettings();
  const { speak } = useVoice();

  if (!metrics || metrics.length === 0) {
    return <p className="text-xs text-slate-500">Explainability report not ready.</p>;
  }

  // Construct text for voice readout
  const speakText = () => {
    const text = "Why this route explanation: " + metrics
      .map(m => `${m.label}: ${m.checked ? "Yes, matches profile." : "No."} ${m.reason}`)
      .join(" ");
    speak(text, language);
  };

  const radarData = [
    { subject: "Wheelchair Ramps", score: 95 },
    { subject: "Elevator Access", score: 90 },
    { subject: "Visual Alerts", score: 85 },
    { subject: "Hearing Loops", score: 100 },
    { subject: "Safe Sidewalks", score: 80 },
    { subject: "Staff Support", score: 90 },
  ];

  return (
    <div className="space-y-4">
      {/* Radar Chart Visual */}
      <div className="glass-card p-4 rounded-2xl border border-white/5 bg-black/10 flex flex-col items-center">
        <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider self-start">
          Assistive Suitability Audit
        </h4>
        <div className="w-full h-44 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 8 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#475569", fontSize: 7 }} />
              <Radar
                name="Suitability"
                dataKey="score"
                stroke="#00F2FE"
                fill="#00F2FE"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Audio synthesis button */}
      <div className="flex justify-between items-center bg-brand-cyan/5 border border-brand-cyan/15 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-cyan animate-pulse" />
          <span className="text-xs font-semibold text-slate-300">
            Explainable Route Audit
          </span>
        </div>
        <button
          onClick={speakText}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-cyan text-slate-950 hover:bg-brand-cyan/90 transition-all hover:shadow-[0_0_12px_rgba(0,242,254,0.3)]"
        >
          <Volume2 className="w-3.5 h-3.5" />
          Read Audio Audit
        </button>
      </div>

      <div className="space-y-2.5">
        {metrics.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-2xl border flex gap-3.5 ${
              item.checked
                ? "bg-emerald-500/5 border-emerald-500/15"
                : "bg-white/[0.02] border-white/5"
            }`}
          >
            <div className={`p-1 rounded-full shrink-0 self-start mt-0.5 ${
              item.checked ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-600"
            }`}>
              {item.checked ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                {item.label}
                {item.checked && (
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md">
                    verified
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.reason}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
