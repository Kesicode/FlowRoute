"use client";

/**
 * components/ui/BudgetMeter.tsx
 * Progress bar showing committed spend vs total budget, always with an
 * estimated disclaimer as required by the implementation plan.
 */

import { AlertTriangle } from "lucide-react";

interface BudgetMeterProps {
  committed: number;
  total: number;
  currency: string;
  className?: string;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetMeter({ committed, total, currency, className = "" }: BudgetMeterProps) {
  const pct = total > 0 ? Math.min(100, Math.round((committed / total) * 100)) : 0;
  const barColor =
    pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/60">Budget used</span>
        <span className="font-medium">
          {formatAmount(committed, currency)}{" "}
          <span className="text-foreground/40">/ {formatAmount(total, currency)}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% of budget used`}
        />
      </div>

      {/* Mandatory disclaimer */}
      <span className="text-xs text-amber-400 flex items-center gap-1">
        <AlertTriangle size={10} aria-hidden="true" />
        Estimated — real costs may vary
      </span>
    </div>
  );
}
