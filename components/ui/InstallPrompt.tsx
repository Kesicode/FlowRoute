"use client";

/**
 * components/ui/InstallPrompt.tsx
 *
 * Phase 5 — PWA Install-to-Home-Screen Prompt
 *
 * • Android/Chrome: shows floating "Add to Home Screen" card using beforeinstallprompt
 * • iOS Safari: shows manual instructions (Share → Add to Home Screen)
 * • Already-installed users (standalone mode): hidden entirely
 * • Dismissible for the session (stored in sessionStorage)
 * • Framer Motion slide-up + fade
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

const DISMISS_KEY = "flowroute_install_dismissed";

export function InstallPrompt() {
  const { isStandalone, canInstall, isIOS, triggerInstall, dismissInstall } =
    usePWA();
  const [visible, setVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    // Show after 3s delay — don't interrupt initial page load UX
    const t = setTimeout(() => {
      if (!isStandalone && (canInstall || isIOS)) setVisible(true);
    }, 3000);
    return () => clearTimeout(t);
  }, [isStandalone, canInstall, isIOS]);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
    dismissInstall();
  };

  const handleInstall = async () => {
    await triggerInstall();
    setVisible(false);
  };

  if (!hasMounted || isStandalone) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto"
          role="dialog"
          aria-label="Install FlowRoute"
        >
          <div className="card border border-brand-cyan/20 rounded-2xl p-4 shadow-xl shadow-black/40 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-start gap-3">
              {/* App icon */}
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/15 border border-brand-cyan/25 flex items-center justify-center shrink-0">
                <span className="text-2xl" role="img" aria-label="FlowRoute">
                  🗺️
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white">
                  Install FlowRoute
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {isIOS
                    ? "Add to your home screen for the best offline experience"
                    : "Get the full app experience — works offline, loads faster"}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* iOS instructions */}
            {isIOS && (
              <div className="mt-3 bg-white/5 rounded-xl p-3 text-xs text-slate-300 leading-relaxed border border-white/5">
                <p className="flex items-center gap-1.5 mb-1">
                  <Share className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Tap the Share button</span>
                </p>
                <p className="text-slate-400 pl-5">
                  Then &quot;Add to Home Screen&quot; → &quot;Add&quot;
                </p>
              </div>
            )}

            {/* Action buttons */}
            {!isIOS && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 text-brand-cyan text-sm font-semibold hover:bg-brand-cyan/25 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Not now
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
