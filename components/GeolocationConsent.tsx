'use client';

/**
 * components/GeolocationConsent.tsx
 *
 * Modal that requests GPS permission from the user.
 * Shows only when geolocationConsent is false and the journey page
 * needs live location features.
 *
 * Calls grantGeolocationConsent() on accept, or dismisses silently on deny.
 * Does NOT call navigator.geolocation directly here — the parent wires
 * watchPosition after consent is granted.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Shield } from 'lucide-react';
import { useGeolocationConsent, useSettingsActions } from '@/hooks/useTripStore';

interface GeolocationConsentProps {
  /** Whether to show the modal. Controlled externally so parent decides when to prompt. */
  open: boolean;
  /** Called when the user dismisses without granting (so parent can stop showing). */
  onDismiss: () => void;
}

export function GeolocationConsent({ open, onDismiss }: GeolocationConsentProps) {
  const consent = useGeolocationConsent();
  const { grantGeolocationConsent } = useSettingsActions();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus inside when open
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  // If consent already granted, don't render
  if (consent) return null;

  const handleAllow = () => {
    grantGeolocationConsent();
    onDismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        // Backdrop
        <motion.div
          key="geo-consent-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="geo-consent-title"
          aria-describedby="geo-consent-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) onDismiss();
          }}
        >
          <motion.div
            key="geo-consent-panel"
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-sm bg-card border border-white/10 rounded-2xl shadow-2xl p-6 outline-none"
          >
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
                <MapPin className="w-7 h-7 text-brand-cyan" />
              </div>
            </div>

            {/* Text */}
            <h2
              id="geo-consent-title"
              className="text-base font-display font-bold text-white text-center mb-2"
            >
              Enable Live Location?
            </h2>
            <p
              id="geo-consent-desc"
              className="text-sm text-slate-400 text-center leading-relaxed mb-5"
            >
              FlowRoute uses your GPS location to show your position on the map,
              detect route deviations, and give real-time journey health updates.
            </p>

            {/* Privacy note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/5 mb-5">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Location data is used <strong className="text-slate-300">only on your device</strong> for
                navigation. It is never sent to any server or third party.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onDismiss}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleAllow}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-background bg-brand-cyan hover:bg-brand-cyan/90 hover:shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all"
              >
                Allow Location
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
