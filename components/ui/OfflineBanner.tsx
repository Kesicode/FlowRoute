"use client";

/**
 * components/ui/OfflineBanner.tsx
 *
 * Phase 5 — Network Status Banner
 *
 * • Appears at the top of the screen when offline
 * • Disappears (with animation) when back online
 * • Shows "Back online" toast for 2 seconds on reconnect
 * • Accessible: role="status", aria-live="polite"
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 2500);
      return () => clearTimeout(t);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't render on server or when online with no reconnect toast
  if (!hasMounted) return null;

  return (
    <AnimatePresence>
      {(!isOnline || showReconnected) && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed top-[72px] inset-x-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold transition-colors ${
            isOnline
              ? "bg-emerald-500/90 text-white"
              : "bg-amber-500/90 text-white"
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              Back online — live data restored
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              You&apos;re offline — showing cached data only
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
