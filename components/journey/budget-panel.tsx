"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { IndianRupee } from "lucide-react";
import { BudgetBreakdown } from "@/types/journey";

const COLORS = ["#00F2FE", "#4FACFE", "#a78bfa", "#fb923c"];

interface BudgetPanelProps {
  budgetBreakdown: BudgetBreakdown;
}

export function BudgetPanel({ budgetBreakdown: b }: BudgetPanelProps) {
  if (!b) return <p className="text-xs text-slate-500 font-medium">Budget breakdown not loaded.</p>;

  const pieData = [
    { name: "Transport", value: b.transport },
    { name: "Food", value: b.food },
    { name: "Attractions", value: b.attractions },
    { name: "Misc.", value: b.miscellaneous },
  ];

  const items = [
    { label: "Transport", value: b.transport, color: COLORS[0] },
    { label: "Food & Dining", value: b.food, color: COLORS[1] },
    { label: "Attractions", value: b.attractions, color: COLORS[2] },
    { label: "Miscellaneous", value: b.miscellaneous, color: COLORS[3] },
  ];

  return (
    <div className="space-y-5">
      {/* Donut chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-5 border border-white/5"
      >
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-white font-display">₹{b.total.toLocaleString("en-IN")}</div>
          <div className="text-xs text-slate-400 mt-1">Total for {b.travellers} travellers · ₹{Math.round(b.perPersonTotal).toLocaleString("en-IN")}/person</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
              formatter={(val) => [`₹${Number(val ?? 0).toLocaleString("en-IN")}`, ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Breakdown items */}
      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 + 0.2 }}
            className="flex items-center gap-3 p-3 glass-card rounded-xl border border-white/5"
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="flex-1 text-sm text-slate-300">{item.label}</span>
            <div className="flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-white">{item.value.toLocaleString("en-IN")}</span>
            </div>
            <div className="text-xs text-slate-500 w-12 text-right">
              {b.total > 0 ? Math.round((item.value / b.total) * 100) : 0}%
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
