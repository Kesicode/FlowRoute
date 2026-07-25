"use client";

import { motion } from "framer-motion";
import type { AiSuggestion } from "@/types/journey";

const severityStyles = {
  info: "border-brand-blue/30 bg-brand-blue/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  tip: "border-brand-cyan/30 bg-brand-cyan/5",
};

const severityBadge = {
  info: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
  warning: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  tip: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20",
};

interface AiSuggestionsPanelProps {
  aiSuggestions: AiSuggestion[];
}

export function AiSuggestionsPanel({ aiSuggestions }: AiSuggestionsPanelProps) {
  if (!aiSuggestions || aiSuggestions.length === 0) {
    return <p className="text-xs text-slate-500">No suggestions compiled by AI assistant.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 leading-relaxed px-1">
        Powered by FlowRoute AI — personalized insights based on your route, preferences, weather, and traveller profile.
      </p>
      {aiSuggestions.map((suggestion, i) => (
        <motion.div
          key={suggestion.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className={`p-4 rounded-2xl border ${severityStyles[suggestion.severity] || severityStyles.info} transition-all duration-300 hover:scale-[1.01]`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">{suggestion.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${severityBadge[suggestion.severity] || severityBadge.info}`}>
                  {suggestion.severity === "warning" ? "⚠ Warning" : suggestion.severity === "tip" ? "💡 Tip" : "ℹ Info"}
                </span>
                <span className="text-[9px] text-slate-600 capitalize">{suggestion.category}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{suggestion.message}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
