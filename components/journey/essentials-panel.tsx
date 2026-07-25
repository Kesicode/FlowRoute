"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { EssentialType, Essential } from "@/types/journey";
import { Hospital, Pill, Banknote, Fuel, Toilet } from "lucide-react";

const essentialConfig: Record<EssentialType, { icon: React.ElementType; label: string; color: string; emoji: string }> = {
  hospital: { icon: Hospital, label: "Hospital", color: "text-red-400 bg-red-400/10 border-red-400/20", emoji: "🏥" },
  pharmacy: { icon: Pill, label: "Pharmacy", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", emoji: "💊" },
  atm: { icon: Banknote, label: "ATM", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", emoji: "🏧" },
  restroom: { icon: Toilet, label: "Restroom", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", emoji: "🚻" },
  fuel: { icon: Fuel, label: "Charger/EV", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", emoji: "🔌" },
};

interface EssentialsPanelProps {
  essentials: Essential[];
}

export function EssentialsPanel({ essentials }: EssentialsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<EssentialType | "all">("all");
  
  if (!essentials) return <p className="text-xs text-slate-500">No essentials markers loaded.</p>;

  const filtered = activeFilter === "all" ? essentials : essentials.filter((e) => e.type === activeFilter);
  const filters: (EssentialType | "all")[] = ["all", "hospital", "pharmacy", "atm", "restroom", "fuel"];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all duration-200 ${
              activeFilter === f
                ? "bg-brand-cyan text-background border-brand-cyan"
                : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : essentialConfig[f].emoji + " " + essentialConfig[f].label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((ess, i) => {
          const config = essentialConfig[ess.type] || essentialConfig.hospital;
          const Icon = config.icon;
          return (
            <motion.div
              key={ess.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-2xl p-4 border border-white/5 flex items-center gap-4 hover:border-white/10 transition-all"
            >
              <div className={`p-3 rounded-xl border ${config.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{ess.name}</h3>
                <p className="text-[11px] text-slate-500 truncate">{ess.address}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-white">{ess.distance}m</div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${ess.openNow ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-red-400 bg-red-400/10 border-red-400/20"}`}>
                  {ess.openNow ? "Open" : "Closed"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
