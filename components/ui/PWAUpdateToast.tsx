'use client';

/**
 * components/ui/PWAUpdateToast.tsx
 *
 * Phase 8 — PWA Update Available Notification
 *
 * Shows a slide-up toast when usePWA().updateAvailable becomes true.
 * Offers a "Reload" button that posts SKIP_WAITING to the new service worker,
 * then reloads the page once the new SW takes control.
 *
 * Design decisions:
 * - Position: bottom-center (above navigation bar on mobile)
 * - Dismissable: "Later" hides it for the current session (no localStorage)
 * - Auto-reload: After clicking "Reload", waits for SW controllerchange event
 *   before calling window.location.reload() to avoid blank page flash
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function PWAUpdateToast() {
  const { updateAvailable } = usePWA();
  const [visible, setVisible] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (updateAvailable) setVisible(true);
  }, [updateAvailable]);

  const handleReload = useCallback(async () => {
    if (reloading) return;
    setReloading(true);

    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (reg?.waiting) {
        // Listen for controller change BEFORE posting SKIP_WAITING
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  }, [reloading]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 48 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-brand-cyan/25 backdrop-blur-xl shadow-2xl"
          role="alert"
          aria-live="polite"
        >
          <div className="p-1.5 rounded-xl bg-brand-cyan/15 border border-brand-cyan/20 shrink-0">
            <RefreshCw className={`w-4 h-4 text-brand-cyan ${reloading ? 'animate-spin' : ''}`} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-white leading-tight">New version available</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Reload to get the latest FlowRoute</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <button
              onClick={handleReload}
              disabled={reloading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-cyan text-slate-900 hover:bg-brand-cyan/90 transition-colors disabled:opacity-60"
            >
              {reloading ? 'Reloading…' : 'Reload'}
            </button>
            <button
              onClick={() => setVisible(false)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-white transition-colors"
              aria-label="Dismiss update notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
