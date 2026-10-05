'use client';

/**
 * components/ui/VoiceCopilot.tsx
 *
 * Phase 4 — Voice Copilot Floating Action Button + Command Log
 *
 * Features:
 *  • Floating cyan mic button (bottom-right on journey page)
 *  • Pulsing ring animation while listening
 *  • Slide-up command log showing last 5 commands with intent badges
 *  • Ambient mode: can be collapsed to just the mic button
 *  • Intent category color-coded badges
 *  • TTS feedback is handled by the hook; this is display-only
 *  • Accessible: aria-live for screen readers, keyboard activatable
 *
 * Props:
 *   position?: "bottom-right" | "bottom-left" | "inline"
 *   maxHistory?: number   (default 5)
 */

import React, { useState, useEffect, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  X,
  ChevronUp,
  ChevronDown,
  Zap,
  AlertTriangle,
  Settings2,
  MapPin,
  CreditCard,
  Route,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import type { VoiceIntent, IntentCategory } from '@/services/voice-dispatcher';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: number;
  transcript: string;
  intent: VoiceIntent;
  action: string | null;
  timestamp: Date;
}

interface VoiceCopilotProps {
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  maxHistory?: number;
  className?: string;
}

// ─── Intent Category Colors + Icons ──────────────────────────────────────────

const CATEGORY_CONFIG: Record<IntentCategory, { color: string; bg: string; Icon: React.ElementType; label: string }> = {
  navigation: { color: 'text-brand-cyan', bg: 'bg-brand-cyan/10 border-brand-cyan/30', Icon: MapPin, label: 'Nav' },
  budget:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', Icon: CreditCard, label: 'Budget' },
  route:      { color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30', Icon: Route, label: 'Route' },
  map:        { color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30', Icon: MapPin, label: 'Map' },
  safety:     { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', Icon: AlertTriangle, label: 'Safety' },
  settings:   { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', Icon: Settings2, label: 'Settings' },
  trip:       { color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', Icon: Zap, label: 'Trip' },
  speak:      { color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30', Icon: Volume2, label: 'Read' },
  unknown:    { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30', Icon: HelpCircle, label: '?' },
};

// ─── Mic Button ───────────────────────────────────────────────────────────────

function MicButton({ isListening, onClick, unsupported }: {
  isListening: boolean;
  onClick: () => void;
  unsupported?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={unsupported}
      aria-label={isListening ? 'Stop listening' : 'Activate voice commands'}
      aria-pressed={isListening}
      className={`
        relative w-14 h-14 rounded-full flex items-center justify-center
        shadow-lg transition-all duration-200 active:scale-95
        ${unsupported
          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
          : isListening
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-brand-cyan text-slate-900 hover:bg-brand-cyan/90'
        }
      `}
    >
      {/* Pulsing ring while listening */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
          <span className="absolute inset-[-4px] rounded-full border border-red-400/40 animate-pulse" />
        </>
      )}
      {isListening ? <MicOff className="w-6 h-6 relative z-10" /> : <Mic className="w-6 h-6 relative z-10" />}
    </button>
  );
}

// ─── History Entry Row ────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const cfg = CATEGORY_CONFIG[entry.intent.category];
  const Icon = cfg.Icon;
  const timeStr = entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2.5 py-2 border-b border-white/5 last:border-0"
    >
      {/* Category badge */}
      <span className={`mt-0.5 flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.bg} ${cfg.color}`}>
        <Icon className="w-2.5 h-2.5" />
        {cfg.label}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground/70 truncate italic">&quot;{entry.transcript}&quot;</p>

        {entry.action && (
          <p className="text-xs text-foreground font-medium mt-0.5">{entry.action}</p>
        )}
      </div>

      {/* Time */}
      <span className="text-[10px] text-foreground/30 flex-shrink-0 mt-0.5">{timeStr}</span>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VoiceCopilot({
  position = 'bottom-right',
  maxHistory = 5,
  className = '',
}: VoiceCopilotProps) {
  const {
    isListening,
    isSupported,
    lastIntent,
    lastTranscript,
    lastAction,
    activate,
    deactivate,
    clearLast,
  } = useVoiceCommands();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [idCounter, setIdCounter] = useState(0);

  // Append new entry whenever a command is processed
  useEffect(() => {
    if (!lastIntent || !lastTranscript) return;
    const entry: HistoryEntry = {
      id: idCounter,
      transcript: lastTranscript,
      intent: lastIntent,
      action: lastAction,
      timestamp: new Date(),
    };
    setHistory((prev) => [entry, ...prev].slice(0, maxHistory));
    setIdCounter((c) => c + 1);
    // Auto-open the panel when a command fires
    setPanelOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastIntent, lastTranscript]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      deactivate();
    } else {
      activate();
    }
  }, [isListening, activate, deactivate]);

  const handleClear = useCallback(() => {
    setHistory([]);
    clearLast();
    setPanelOpen(false);
  }, [clearLast]);

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6 z-40',
    'bottom-left':  'fixed bottom-6 left-6 z-40',
    'inline':       'relative',
  }[position];

  // Hint text
  const hintText = !isSupported
    ? 'Voice commands not supported in this browser'
    : isListening
    ? 'Listening… say a command'
    : 'Tap to activate voice commands';

  return (
    <div className={`flex flex-col items-end gap-3 ${positionClasses} ${className}`}>
      {/* Command Log Panel */}
      <AnimatePresence>
        {panelOpen && history.length > 0 && (
          <motion.div
            key="voice-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-72 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-2xl overflow-hidden"
            role="log"
            aria-label="Voice command history"
            aria-live="polite"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-brand-cyan" />
                <span className="text-xs font-semibold text-foreground">Voice Copilot</span>
                {isListening && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-red-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    Listening
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1 rounded hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors"
                  aria-label="Minimize panel"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleClear}
                  className="p-1 rounded hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors"
                  aria-label="Clear history"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Command history list */}
            <div className="px-3 py-1 max-h-56 overflow-y-auto overscroll-contain">
              <AnimatePresence>
                {history.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} />
                ))}
              </AnimatePresence>
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-white/5">
              <p className="text-[10px] text-foreground/30 text-center">
                Try: &quot;show budget&quot; · &quot;eco route&quot; · &quot;find hospitals&quot;
              </p>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed history indicator */}
      {!panelOpen && history.length > 0 && (
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 border border-white/10 text-xs text-foreground/60 hover:text-foreground transition-colors shadow-lg"
          aria-label="Open voice command history"
        >
          <ChevronUp className="w-3 h-3" />
          <span>{history.length} command{history.length !== 1 ? 's' : ''}</span>
        </button>
      )}

      {/* Bottom row: hint text + mic button */}
      <div className="flex items-center gap-3 justify-end">
        <AnimatePresence>
          {isListening && (
            <motion.p
              key="hint"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-xs text-red-300 bg-slate-900/90 px-3 py-1.5 rounded-full border border-red-400/20 shadow max-w-[180px] text-right"
              aria-live="polite"
            >
              {hintText}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Mic FAB */}
        <MicButton
          isListening={isListening}
          onClick={handleMicClick}
          unsupported={!isSupported}
        />
      </div>

      {/* Unsupported browser notice */}
      {!isSupported && (
        <p className="text-[10px] text-slate-500 max-w-[100px] text-center">
          Voice not available
        </p>
      )}
    </div>
  );
}
