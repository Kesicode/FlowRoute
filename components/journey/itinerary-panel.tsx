"use client";

import { motion } from "framer-motion";
import { ItinerarySegment } from "@/services/ai";
import { Navigation, Coffee, Landmark, Hotel, ShieldCheck } from "lucide-react";

interface ItineraryPanelProps {
  itinerary: ItinerarySegment[];
}

const typeConfig = {
  travel: { icon: Navigation, bg: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  food: { icon: Coffee, bg: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
  attraction: { icon: Landmark, bg: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
  rest: { icon: Hotel, bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  safety: { icon: ShieldCheck, bg: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400" },
};

export function ItineraryPanel({ itinerary }: ItineraryPanelProps) {
  if (!itinerary || itinerary.length === 0) {
    return <p className="text-xs text-slate-500">No itinerary generated.</p>;
  }

  return (
    <div className="space-y-6 relative pl-6 border-l border-white/5 ml-3 py-2">
      {itinerary.map((item, i) => {
        const config = typeConfig[item.type] || typeConfig.travel;
        const Icon = config.icon;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative space-y-1.5"
          >
            {/* Timeline dot */}
            <div className={`absolute -left-[35px] top-0.5 p-1.5 rounded-xl border ${config.bg} flex items-center justify-center`}>
              <Icon className="w-3.5 h-3.5" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.time}</span>
              <h4 className="text-sm font-bold text-white mt-0.5">{item.activity}</h4>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{item.description}</p>
            
            <div className="text-[10px] text-slate-500 font-medium">
              📍 Location: <span className="text-slate-300">{item.location}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
