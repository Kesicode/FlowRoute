'use client';

/**
 * components/ui/CurrencyDisplay.tsx
 *
 * Phase 3 — Smart currency display with live conversion.
 *
 * Shows a monetary amount in the user's preferred currency.
 * If the stored amount is in a different currency, it converts on mount
 * using the currency service (async, with sync fallback during loading).
 *
 * Always shows:
 * - The formatted amount in the target currency
 * - A tooltip with the conversion rate and data age when a conversion occurred
 * - An "est." label when the rate is from fallback/cache
 */

import { useState, useEffect } from 'react';
import {
  convert,
  convertSync,
  formatCurrency,
  rateTooltip,
} from '@/services/currency';
import type { ConversionResult } from '@/services/currency';

interface CurrencyDisplayProps {
  /** The original amount */
  amount: number;
  /** The original currency code (e.g. "INR") */
  fromCurrency: string;
  /** The target display currency (from user settings) */
  toCurrency: string;
  /** If true, adds an "est." suffix and amber color when using fallback rates */
  showEstimate?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  fromCurrency,
  toCurrency,
  showEstimate = true,
  className = '',
}: CurrencyDisplayProps) {
  const [result, setResult] = useState<ConversionResult | null>(null);

  useEffect(() => {
    let alive = true;
    convert(amount, fromCurrency, toCurrency).then((r) => {
      if (alive) setResult(r);
    });
    return () => { alive = false; };
  }, [amount, fromCurrency, toCurrency]);

  // While loading: show a sync estimate using in-memory fallback rates
  if (!result) {
    const approx = convertSync(amount, fromCurrency, toCurrency);
    return (
      <span
        className={`tabular-nums opacity-60 animate-pulse ${className}`}
        aria-label="Loading conversion…"
      >
        {formatCurrency(approx, toCurrency)}
      </span>
    );
  }

  const isConverted = fromCurrency !== toCurrency;
  const isEstimate = result.rateSource !== 'live';
  const tooltip = isConverted
    ? `${rateTooltip(fromCurrency, toCurrency, result.rate)} · ${
        result.rateAgeHours === Infinity
          ? 'Fallback rate'
          : result.rateAgeHours < 1
          ? 'Just updated'
          : `Rate from ${result.rateAgeHours}h ago`
      }`
    : undefined;

  return (
    <span
      className={`tabular-nums inline-flex items-baseline gap-1 ${className}`}
      title={tooltip}
      aria-label={`${formatCurrency(result.amount, toCurrency)}${isEstimate ? ' (estimated)' : ''}`}
    >
      <span>{formatCurrency(result.amount, toCurrency)}</span>
      {isConverted && showEstimate && isEstimate && (
        <span className="text-[10px] text-amber-400/70 font-normal">est.</span>
      )}
    </span>
  );
}
