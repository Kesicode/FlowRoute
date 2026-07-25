"use client";

import { motion } from "framer-motion";
import { Landmark, Star, Coins } from "lucide-react";
import type { Attraction } from "@/types/journey";

interface AttractionsPanelProps {
  attractions: Attraction[];
}

export function AttractionsPanel({ attractions }: AttractionsPanelProps) {
  if (!attractions || attractions.length === 0) {
    return <p className="text-xs text-slate-500">No tourist attractions found near destination.</p>;
  }

  return (
    <div className="space-y-3">
      {attractions.map((attr, i) => (
        <motion.div
          key={attr.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="glass-card rounded-2xl p-4 border border-white/5 hover:border-brand-cyan/20 transition-all group flex gap-3.5"
        >
          <span className="text-3xl shrink-0 self-start mt-0.5">{attr.emoji || "📍"}</span>
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm text-white group-hover:text-brand-cyan transition-colors truncate">
                {attr.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-amber-400 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{attr.rating}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">{attr.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-brand-blue" />
                <span>{attr.category}</span>
              </span>
              <span>⏱ {attr.estimatedTime} mins</span>
              <span className="flex items-center gap-1 font-semibold">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                {attr.free ? (
                  <span className="text-emerald-400">Free Entry</span>
                ) : (
                  <span>₹{(attr.entryFee || 150).toLocaleString("en-IN")}</span>
                )}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
