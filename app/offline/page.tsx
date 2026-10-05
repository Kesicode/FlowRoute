/**
 * app/offline/page.tsx
 *
 * Phase 5 — PWA Offline Fallback Page
 * Shown by the service worker when navigation fails and no cached page exists.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WifiOff, RefreshCw, MapPin, Plane } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    document.title = "Offline | FlowRoute";
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm w-full text-center"
      >
        {/* Icon */}
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
            <WifiOff className="w-9 h-9 text-slate-400" />
          </div>
          {isOnline && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
            >
              <span className="text-[8px] text-white font-bold">✓</span>
            </motion.div>
          )}
        </div>

        <h1 className="font-display text-2xl font-extrabold text-white mb-2">
          {isOnline ? "Back Online!" : "You're Offline"}
        </h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          {isOnline
            ? "Connection restored. You can continue planning your trip."
            : "FlowRoute works offline for cached routes. Connect to load live data like weather and AI planning."}
        </p>

        {/* What still works offline */}
        {!isOnline && (
          <div className="card rounded-2xl border border-white/5 p-4 mb-6 text-left">
            <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Available offline
            </p>
            {[
              { icon: MapPin, label: "View your saved trips" },
              { icon: Plane, label: "Browse your journey itinerary" },
              { icon: RefreshCw, label: "Voice commands still work" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 py-1.5 text-sm text-slate-300"
              >
                <Icon className="w-4 h-4 text-brand-cyan shrink-0" />
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isOnline ? (
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 text-brand-cyan font-semibold text-sm text-center hover:bg-brand-cyan/25 transition-colors"
            >
              Go to Home
            </Link>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 text-brand-cyan font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-cyan/25 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <Link
            href="/trips"
            className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm text-center hover:bg-white/8 transition-colors"
          >
            View Saved Trips
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
