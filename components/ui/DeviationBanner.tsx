'use client';

/**
 * components/ui/DeviationBanner.tsx
 *
 * Slide-down banner shown when the GPS loop detects the user is off their
 * planned route. Respects reduced-motion preference.
 *
 * Parent controls visibility via deviationDetected from journey-slice.
 * "Dismiss" clears the local banner but does NOT clear the deviation state.
 * "Recalculate" triggers a callback so the parent can re-fetch the route.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Navigation, X, RefreshCw } from 'lucide-react';

interface DeviationBannerProps {
  visible: boolean;
  onRecalculate: () => void;
}

export function DeviationBanner({ visible, onRecalculate }: DeviationBannerProps) {
  const prefersReduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when deviation clears and comes back
  useEffect(() => {
    if (!visible) setDismissed(false);
  }, [visible]);

  const show = visible && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="deviation-banner"
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -48 }}
          animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -48 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="alert"
          aria-live="assertive"
          className="absolute top-0 left-0 right-0 z-40 mx-2 mt-2 flex items-center gap-3
                     bg-orange-500/90 backdrop-blur-sm border border-orange-400/40
                     rounded-xl px-4 py-3 shadow-lg shadow-orange-900/30"
        >
          <Navigation className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">Off Route</p>
            <p className="text-[11px] text-orange-100 mt-0.5 truncate">
              You appear to be off your planned route.
            </p>
          </div>
          <button
            onClick={onRecalculate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30
                       text-white text-xs font-semibold transition-colors shrink-0"
            aria-label="Recalculate route from current position"
          >
            <RefreshCw className="w-3 h-3" />
            Recalculate
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors shrink-0"
            aria-label="Dismiss off-route warning"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
