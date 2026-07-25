"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { Leaf, Trees } from "lucide-react";
import { CarbonData } from "@/types/journey";

interface CarbonPanelProps {
  carbon: CarbonData;
}

export function CarbonPanel({ carbon }: CarbonPanelProps) {
  if (!carbon) return <p className="text-xs text-slate-500">Carbon footprints not loaded.</p>;

  const chartData = carbon.alternatives.map((alt) => ({
    name: alt.mode.replace(" (your route)", "").replace(" / Uber", ""),
    co2: alt.co2,
    isSelected: alt.mode.includes("your route"),
  }));

  return (
    <div className="space-y-5">
      {/* Hero stat */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Your route emits only</p>
            <div className="text-5xl font-bold font-display text-white">{carbon.selectedRouteCO2} <span className="text-xl font-normal text-slate-400">kg CO₂</span></div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Leaf className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{carbon.savingVsCar} kg</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Saved vs. private car</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-400">
              <Trees className="w-4 h-4" />{carbon.treesEquivalent}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Trees equivalent/year</div>
          </div>
        </div>
      </motion.div>

      {/* Bar chart comparing modes */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 border border-white/5"
      >
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">CO₂ by Transport Mode</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} unit=" kg" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={80} />
            <Tooltip
              contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
              formatter={(val) => [`${Number(val ?? 0)} kg CO₂`, ""]}
            />
            <Bar dataKey="co2" radius={[0, 6, 6, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isSelected ? "#00F2FE" : entry.co2 === 0 ? "#34d399" : "#334155"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Green tip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3"
      >
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
          <Leaf className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-300 mb-1">Green Travel Tip</p>
          <p className="text-xs text-slate-400 leading-relaxed">{carbon.greenTip}</p>
        </div>
      </motion.div>
    </div>
  );
}
