"use client";

/**
 * components/ui/TripExportBar.tsx
 *
 * Phase 6 — Trip Export & Share Action Bar
 *
 * Renders in the Journey page header area:
 *   [↓ Export JSON]  [🔗 Copy Link]  [⬆ Share]
 *
 * All actions use the useTripExport hook.
 * On mobile PWA, shows native Share instead of copy.
 */

import { Download, Link2, Share2, Check, Loader2, Upload } from "lucide-react";
import { useTripExport } from "@/hooks/useTripExport";

export function TripExportBar() {
  const {
    exportTripJSON,
    copyShareURL,
    shareNative,
    importTripJSON,
    canShare,
    hasTrip,
    copying,
    copied,
    exporting,
    importing,
  } = useTripExport();

  if (!hasTrip) return null;

  return (
    <div
      className="flex items-center gap-1.5 flex-wrap"
      role="toolbar"
      aria-label="Trip export actions"
    >
      {/* Export JSON */}
      <button
        onClick={exportTripJSON}
        disabled={exporting}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors text-xs font-medium disabled:opacity-50"
        aria-label="Download trip as JSON"
        title="Export trip as JSON"
      >
        {exporting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Download className="w-3 h-3" />
        )}
        Export
      </button>

      {/* Import JSON */}
      <button
        onClick={importTripJSON}
        disabled={importing}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors text-xs font-medium disabled:opacity-50"
        aria-label="Import trip from JSON file"
        title="Import trip from JSON"
      >
        {importing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
        Import
      </button>

      {/* Share / Copy Link */}
      {canShare ? (
        <button
          onClick={shareNative}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 hover:border-brand-cyan/20 transition-colors text-xs font-medium"
          aria-label="Share trip"
          title="Share trip"
        >
          <Share2 className="w-3 h-3" />
          Share
        </button>
      ) : (
        <button
          onClick={copyShareURL}
          disabled={copying}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 hover:border-brand-cyan/20 transition-colors text-xs font-medium disabled:opacity-50"
          aria-label="Copy shareable link"
          title="Copy shareable link"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              {copying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Link2 className="w-3 h-3" />
              )}
              Copy Link
            </>
          )}
        </button>
      )}
    </div>
  );
}
