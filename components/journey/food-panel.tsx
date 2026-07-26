"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import type { FoodStop } from "@/types/journey";

const typeEmojis: Record<FoodStop["type"], string> = {
  restaurant: "🍽️",
  cafe: "☕",
  fastfood: "🍔",
  bakery: "🥐",
  bar: "🍺",
};

interface FoodPanelProps {
  foodStops: FoodStop[];
}

export function FoodPanel({ foodStops }: FoodPanelProps) {
  const [filter, setFilter] = useState<FoodStop["type"] | "all">("all");
  
  if (!foodStops) return <p className="text-xs text-slate-500">No dining choices found.</p>;
  
  const filtered = filter === "all" ? foodStops : foodStops.filter((f) => f.type === filter);
  const filters: (FoodStop["type"] | "all")[] = ["all", "cafe", "restaurant", "fastfood"];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all duration-200 ${
              filter === f
                ? "bg-brand-cyan text-background border-brand-cyan"
                : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : typeEmojis[f] + " " + f}
          </button>
        ))}
      </div>

      {/* Food cards */}
      <div className="space-y-3">
        {filtered.map((food, i) => (
          <motion.div
            key={food.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card rounded-2xl p-4 border border-white/5 hover:border-orange-400/20 transition-all duration-300 group"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{typeEmojis[food.type] || "🍽️"}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-white text-sm group-hover:text-orange-300 transition-colors">{food.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-amber-400 shrink-0 ml-2">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {food.rating}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-2">{food.cuisine} · {food.priceRange} · ~₹{food.estimatedCost}/person</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {food.highlights && food.highlights.map((h) => (
                    <span key={h} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-slate-400 rounded-md border border-white/8">{h}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3 h-3" />{food.distanceFromRoute}m from route
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-medium ${food.openNow ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-red-400 bg-red-400/10 border-red-400/20"}`}>
                    {food.openNow ? "Open Now" : "Closed"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
