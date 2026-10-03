'use client';

/**
 * components/ui/WhatIfPanel.tsx
 *
 * What-If budget simulator — lets the user drag a slider to explore
 * how changing total budget affects the breakdown across categories.
 *
 * Does NOT write to the store unless the user clicks "Apply".
 * Always shows the "Estimated" disclaimer.
 */

import { useState, useMemo } from 'react';
import { Sliders, AlertTriangle, Check, RotateCcw } from 'lucide-react';
import { estimateBudget } from '@/lib/budget-engine';
import { useTripData, useTripActions } from '@/hooks/useTripStore';

interface CategoryRow {
  label: string;
  key: 'transport' | 'accommodation' | 'food' | 'activities' | 'reserve';
  emoji: string;
}

const CATEGORIES: CategoryRow[] = [
  { label: 'Transport', key: 'transport', emoji: '🚆' },
  { label: 'Stay', key: 'accommodation', emoji: '🏨' },
  { label: 'Food', key: 'food', emoji: '🍽️' },
  { label: 'Activities', key: 'activities', emoji: '🎭' },
  { label: 'Reserve', key: 'reserve', emoji: '🛡️' },
];

function fmt(amount: number, currency: string): string {
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const sym = symbols[currency] ?? currency + ' ';
  return `${sym}${amount.toLocaleString()}`;
}

export function WhatIfPanel() {
  const tripData = useTripData();
  const { updateTripField } = useTripActions();

  const originalBudget = tripData?.budget ?? 5000;
  const [sliderValue, setSliderValue] = useState(originalBudget);
  const [applied, setApplied] = useState(false);

  const currency = tripData?.currency ?? 'INR';
  const min = Math.round(originalBudget * 0.2);
  const max = Math.round(originalBudget * 3);
  const step = currency === 'INR' ? 500 : 10;

  // Current allocation (original)
  const currentAllocation = useMemo(() => {
    if (!tripData) return null;
    try { return estimateBudget(tripData); } catch { return null; }
  }, [tripData]);

  // Simulated allocation based on slider
  const simAllocation = useMemo(() => {
    if (!tripData) return null;
    try {
      return estimateBudget({ ...tripData, budget: sliderValue });
    } catch { return null; }
  }, [tripData, sliderValue]);

  const handleApply = () => {
    updateTripField('budget', sliderValue);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const handleReset = () => {
    setSliderValue(originalBudget);
    setApplied(false);
  };

  if (!tripData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <Sliders className="w-8 h-8 text-slate-600" />
        <p className="text-sm text-slate-400">Start a trip to use the What-If simulator.</p>
      </div>
    );
  }

  const diffPct = Math.round(((sliderValue - originalBudget) / Math.max(originalBudget, 1)) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sliders className="w-4 h-4 text-brand-cyan" />
        <h3 className="text-sm font-bold text-white">What-If Budget Simulator</h3>
      </div>

      {/* Budget slider */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Budget</span>
          <span className={`text-base font-bold font-display ${
            diffPct > 0 ? 'text-emerald-400' : diffPct < 0 ? 'text-red-400' : 'text-white'
          }`}>
            {fmt(sliderValue, currency)}
            {diffPct !== 0 && (
              <span className="ml-1 text-xs font-normal">
                ({diffPct > 0 ? '+' : ''}{diffPct}%)
              </span>
            )}
          </span>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full accent-brand-cyan h-1.5 rounded-full cursor-pointer"
          aria-label="Adjust total budget"
        />

        <div className="flex justify-between text-[10px] text-slate-500">
          <span>{fmt(min, currency)}</span>
          <span className="text-slate-400">Original: {fmt(originalBudget, currency)}</span>
          <span>{fmt(max, currency)}</span>
        </div>
      </div>

      {/* Breakdown comparison */}
      {currentAllocation && simAllocation && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold px-1">
            Breakdown
          </p>
          {CATEGORIES.map(({ label, key, emoji }) => {
            const orig = currentAllocation[key].amount;
            const sim = simAllocation[key].amount;
            const diff = sim - orig;
            return (
              <div key={key} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <span className="text-base w-6 shrink-0">{emoji}</span>
                <span className="text-xs text-slate-300 flex-1">{label}</span>
                <span className="text-xs text-slate-400 w-20 text-right">
                  {fmt(orig, currency)}
                </span>
                {diff !== 0 && (
                  <span className={`text-xs w-16 text-right font-semibold ${
                    diff > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {diff > 0 ? '+' : ''}{fmt(diff, currency)}
                  </span>
                )}
                <span className="text-xs font-bold text-white w-20 text-right">
                  {fmt(sim, currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
        <button
          onClick={handleApply}
          disabled={sliderValue === originalBudget}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-brand-cyan text-background hover:bg-brand-cyan/90"
        >
          {applied ? (
            <><Check className="w-3 h-3" /> Applied!</>
          ) : (
            <>Apply {fmt(sliderValue, currency)} budget</>
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-1.5 text-[11px] text-amber-400/80">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
        <span>Estimated — real costs may vary. Apply only updates your trip plan, not any booking.</span>
      </div>
    </div>
  );
}
