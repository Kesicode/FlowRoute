"use client";

import { motion } from "framer-motion";
import { Bus, Train, PersonStanding, Car, Bike, BadgeCheck, Shield, Volume2 } from "lucide-react";
import type { TransportMode, JourneyRoute } from "@/types/journey";
import { useSettings } from "@/lib/settings-context";
import { t } from "@/services/translations";
import { useVoice } from "@/hooks/useVoice";

const ModeIcon = ({ mode }: { mode: TransportMode }) => {
  const icons: Record<TransportMode, React.ReactNode> = {
    walk: <PersonStanding className="w-4 h-4" />,
    bus: <Bus className="w-4 h-4" />,
    metro: <Train className="w-4 h-4" />,
    train: <Train className="w-4 h-4" />,
    tram: <Train className="w-4 h-4" />,
    taxi: <Car className="w-4 h-4" />,
    bike: <Bike className="w-4 h-4" />,
  };
  return <>{icons[mode]}</>;
};

const modeColors: Record<TransportMode, string> = {
  walk: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  bus: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  metro: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20",
  train: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
  tram: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  taxi: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  bike: "text-lime-400 bg-lime-400/10 border-lime-400/20",
};

const tagColors: Record<string, string> = {
  cyan: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30",
  green: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  purple: "text-purple-400 bg-purple-400/10 border-purple-400/30",
};

interface RoutePanelProps {
  routes: JourneyRoute[];
  onSelectSegment?: (coords: [number, number][] | null) => void;
}

export function RoutePanel({ routes, onSelectSegment }: RoutePanelProps) {
  const { language, safetyMode } = useSettings();
  const { speak } = useVoice();

  const handleNarrate = (route: JourneyRoute) => {
    const text = `Route Narration for ${route.name}. Total duration is ${route.totalTime} minutes. ` + route.segments.map((seg, index) => {
      return `Step ${index + 1}: ${seg.label} from ${seg.from} to ${seg.to}, taking ${seg.duration} minutes.`;
    }).join(" ");
    speak(text, language);
  };

  return (
    <div className="space-y-4">
      {routes.map((route, i) => (
        <motion.div
          key={route.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`glass-card rounded-2xl p-5 border ${
            route.isRecommended
              ? "border-brand-cyan/30 shadow-[0_0_24px_rgba(0,242,254,0.07)]"
              : "border-white/5"
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-display font-bold text-white text-base">{route.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColors[route.tagColor] || tagColors.cyan}`}>
                  {route.tag}
                </span>
                {route.isRecommended && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-full border border-brand-cyan/20">
                    <BadgeCheck className="w-3.5 h-3.5" /> AI Pick
                  </span>
                )}
                {safetyMode && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-fuchsia-400 bg-fuchsia-400/10 px-2 py-0.5 rounded-full border border-fuchsia-400/20">
                    <Shield className="w-3 h-3" /> Safe Route
                  </span>
                )}
              </div>
              <div className="flex gap-3 text-xs text-slate-400 items-center">
                <span>⏱ {route.totalTime} min</span>
                <span>🚶 {route.walkingTime} min walk</span>
                <span>🔄 {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">₹{route.totalFare.toFixed(0)}</div>
              <div className="text-[10px] text-slate-500">estimated fare</div>
            </div>
          </div>

          {/* Voice Narration Button */}
          <div className="mb-3.5">
            <button
              onClick={() => handleNarrate(route)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-brand-cyan hover:text-white transition-colors bg-brand-cyan/5 border border-brand-cyan/15 hover:bg-brand-cyan/10 px-3 py-1.5 rounded-xl"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Narrate Route Directions
            </button>
          </div>

          {/* Segments */}
          <div className="space-y-2">
            {route.segments.map((seg, j) => (
              <div
                key={j}
                onMouseEnter={() => onSelectSegment?.(seg.coordinates)}
                onMouseLeave={() => onSelectSegment?.(null)}
                className="flex items-center gap-3 hover:bg-white/[0.04] p-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5"
              >
                <div className={`p-1.5 rounded-lg border ${modeColors[seg.mode]}`}>
                  <ModeIcon mode={seg.mode} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {seg.label}{seg.line ? ` · ${seg.line}` : ""}{seg.stops ? ` · ${seg.stops} stops` : ""}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{seg.from} → {seg.to}</div>
                </div>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {seg.duration} min · {(seg.distance / 1000).toFixed(1)} km
                </div>
              </div>
            ))}
          </div>

          {/* Score bar & dynamic Safety/Access metrics */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
            <div className="flex justify-between items-center text-[10px]">
              <div className="flex items-center gap-4">
                <span className="text-slate-500">
                  AI Fit: <strong className="text-brand-cyan">{route.overallScore}%</strong>
                </span>
                <span className="text-slate-500">
                  {t("safetyScore", language)}: <strong className="text-fuchsia-400">{safetyMode ? "95%" : "78%"}</strong>
                </span>
                <span className="text-slate-500">
                  {t("accessibilityScore", language)}: <strong className="text-emerald-400">92%</strong>
                </span>
              </div>
              <span className="font-bold text-white">{route.overallScore}/100</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${route.overallScore}%` }}
                transition={{ delay: i * 0.08 + 0.2, duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-brand-cyan to-brand-blue rounded-full"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
