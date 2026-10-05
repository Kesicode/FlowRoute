/**

 * hooks/useVoiceCommands.ts
 *
 * Phase 4 — Voice Agentic Action Dispatcher Hook
 *
 * Bridges the voice-dispatcher (intent parsing) with the Zustand store
 * (intent execution) and the useVoice hook (TTS feedback).
 *
 * Usage:
 *   const { isListening, lastIntent, lastError, activate, deactivate } = useVoiceCommands();
 *
 * On transcript received:
 *   1. Parse intent via parseVoiceIntent()
 *   2. Execute intent → store action
 *   3. Speak confirmation via TTS
 *   4. Expose lastIntent for UI feedback
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useVoice } from './useVoice';
import {
  parseVoiceIntent,
  getIntentConfirmation,
  type VoiceIntent,
} from '@/services/voice-dispatcher';
import {
  useSettingsActions,
  useTripActions,
  useJourneyActions,
  useBudgetState,
  useTripData,
  useTripsListActions,
  useLanguage,
} from './useTripStore';
import { useFlowStore } from '@/lib/store/store';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseVoiceCommandsReturn {
  /** True when the mic is open and listening */
  isListening: boolean;
  /** True when the browser supports speech recognition */
  isSupported: boolean;
  /** The most recently parsed and executed intent */
  lastIntent: VoiceIntent | null;
  /** Raw transcript of the last utterance */
  lastTranscript: string;
  /** Non-null if the last command could not be parsed */
  lastError: string | null;
  /** A short label describing what was just done, for UI toast/badge */
  lastAction: string | null;
  /** Start listening */
  activate: () => void;
  /** Stop listening (command is parsed immediately on transcript) */
  deactivate: () => void;
  /** Clear the last intent/action state */
  clearLast: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceCommands(): UseVoiceCommandsReturn {
  const router = useRouter();

  // Store actions
  const { setLanguage, setSafetyMode, setEmergencyMode, setCurrency, setTravelerProfile } = useSettingsActions();
  const { resetTrip } = useTripActions();
  const { setHealth } = useJourneyActions();
  const { saveCurrentTrip } = useTripsListActions();
  const budgetState = useBudgetState();
  const tripData = useTripData();
  const language = useLanguage();

  // setActiveTab — read directly from store to avoid creating a dependency cycle
  const setActiveTab = useFlowStore((s) => s.setActiveTab);

  // Voice hook
  const { isListening, transcript, startListening, stopListening, speak, isSupported } = useVoice();

  // Local state for UI feedback
  const [lastIntent, setLastIntent] = useState<VoiceIntent | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Track last processed transcript to avoid double-firing
  const lastProcessedRef = useRef('');

  // ── Intent Executor ──────────────────────────────────────────────────────────

  const executeIntent = useCallback(
    (intent: VoiceIntent) => {
      setLastIntent(intent);

      switch (intent.category) {
        // ── Navigation ─────────────────────────────────────────────────────────
        case 'navigation': {
          setActiveTab(intent.tab);
          setLastAction(`📍 Switched to ${intent.tabLabel}`);
          const msg = getIntentConfirmation(intent);
          if (msg) speak(msg, language);
          break;
        }

        // ── Budget ─────────────────────────────────────────────────────────────
        case 'budget': {
          if (intent.action === 'show') {
            setActiveTab('budget');
            setLastAction('💰 Showing budget');
            speak('Opening your budget breakdown.', language);
          } else if (intent.action === 'simulate') {
            setActiveTab('whatif');
            setLastAction('🔮 Budget simulator opened');
            const amt = intent.simulatedAmount;
            speak(
              amt
                ? `Opening What If panel. Simulating a budget of ${amt.toLocaleString()}.`
                : 'Opening the What If budget simulator.',
              language
            );
          }
          break;
        }

        // ── Route ──────────────────────────────────────────────────────────────
        case 'route': {
          // Route mode is rendered inside RouteComparisonTabs in the route panel
          // We switch to route tab and fire a custom event that RouteComparisonTabs listens to
          setActiveTab('route');
          const modeEvent = new CustomEvent('flowroute:set-route-mode', {
            detail: { mode: intent.mode },
            bubbles: true,
          });
          if (typeof window !== 'undefined') window.dispatchEvent(modeEvent);
          setLastAction(`🗺️ Route: ${intent.mode}`);
          speak(getIntentConfirmation(intent), language);
          break;
        }

        // ── Map ────────────────────────────────────────────────────────────────
        case 'map': {
          // Fire custom events that the map component can listen to
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('flowroute:map-command', {
                detail: { action: intent.action },
                bubbles: true,
              })
            );
          }
          const mapLabels: Record<string, string> = {
            show_hospitals: '🏥 Hospitals',
            center_user: '📍 My Location',
            show_food: '🍽️ Food',
            show_attractions: '🏛️ Attractions',
            show_essentials: '🛡️ Essentials',
          };
          setLastAction(mapLabels[intent.action] ?? '🗺️ Map');
          speak(getIntentConfirmation(intent), language);
          // Also switch to relevant tabs
          if (intent.action === 'show_hospitals') setActiveTab('essentials');
          if (intent.action === 'show_food') setActiveTab('food');
          if (intent.action === 'show_attractions') setActiveTab('attractions');
          break;
        }

        // ── Safety ─────────────────────────────────────────────────────────────
        case 'safety': {
          if (intent.action === 'sos') {
            setEmergencyMode(true);
            setHealth('action_required');
            setLastAction('🆘 EMERGENCY MODE');
            speak('Emergency mode activated. Showing nearest hospitals and emergency contacts.', language);
          } else if (intent.action === 'enable') {
            setSafetyMode(true);
            setLastAction('🛡️ Safety mode ON');
            speak('Safety mode enabled.', language);
          } else {
            setSafetyMode(false);
            setLastAction('Safety mode OFF');
            speak('Safety mode disabled.', language);
          }
          break;
        }

        // ── Settings ───────────────────────────────────────────────────────────
        case 'settings': {
          if (intent.field === 'language') {
            setLanguage(intent.value as 'en' | 'hi' | 'ml');
          } else if (intent.field === 'currency') {
            setCurrency(intent.value as 'INR' | 'USD' | 'EUR' | 'GBP');
          } else if (intent.field === 'traveler_profile') {
            setTravelerProfile(intent.value as 'solo' | 'couple' | 'family' | 'elderly' | 'accessible');
          }
          setLastAction(`⚙️ ${intent.field}: ${intent.value}`);
          speak(getIntentConfirmation(intent), language);
          break;
        }

        // ── Trip ───────────────────────────────────────────────────────────────
        case 'trip': {
          if (intent.action === 'new') {
            setLastAction('🗺️ New trip');
            speak('Starting a new trip.', language);
            setTimeout(() => router.push('/'), 800);
          } else if (intent.action === 'save') {
            if (tripData) {
              saveCurrentTrip({
                id: tripData.id ?? String(Date.now()),
                from: tripData.from ?? '',
                to: tripData.to ?? '',
                departureDate: tripData.departureDate,
                returnDate: tripData.returnDate,
                status: 'planning',
                createdAt: new Date().toISOString(),
                travellers: tripData.travellers,
                budget: tripData.budget,
                currency: tripData.currency,
              });
              setLastAction('💾 Trip saved');
              speak('Trip saved to your trips list.', language);
            }
          } else {
            resetTrip();
            setLastAction('🗑️ Trip cleared');
            speak('Trip cleared.', language);
          }
          break;
        }

        // ── Speak (read aloud) ─────────────────────────────────────────────────
        case 'speak': {
          let text = '';
          switch (intent.subject) {
            case 'budget': {
              const remaining = budgetState.remainingAmount;
              const total = budgetState.allocation
                ? budgetState.allocation.transport.amount +
                  budgetState.allocation.accommodation.amount +
                  budgetState.allocation.food.amount +
                  budgetState.allocation.activities.amount +
                  budgetState.allocation.reserve.amount
                : 0;
              text =
                remaining !== null && remaining !== undefined
                  ? `You have ${remaining.toLocaleString()} left out of ${total.toLocaleString()} in your budget.`
                  : 'Budget information is not available yet.';
              setLastAction('🔊 Budget read aloud');
              break;
            }
            case 'status': {
              const from = tripData?.from ?? 'origin';
              const to = tripData?.to ?? 'destination';
              text = `Your journey is from ${from} to ${to}. You are on track.`;
              setLastAction('🔊 Status read aloud');
              break;
            }
            case 'location': {
              text = 'Live location is being tracked on the map.';
              setLastAction('🔊 Location read aloud');
              break;
            }
            case 'next_stop': {
              text = tripData?.to
                ? `Your next destination is ${tripData.to}.`
                : 'No destination set yet.';
              setLastAction('🔊 Next stop read aloud');
              break;
            }
            case 'route': {
              text = 'Your recommended route is shown on the map. Check the Route tab for details.';
              setLastAction('🔊 Route read aloud');
              break;
            }
          }
          if (text) speak(text, language);
          break;
        }

        // ── Unknown ────────────────────────────────────────────────────────────
        case 'unknown': {
          const errMsg = `Didn't understand: "${intent.rawText}"`;
          setLastError(errMsg);
          setLastAction('❓ Unknown command');
          speak(
            `Sorry, I didn't understand that. Try saying "show budget", "switch to eco route", or "find hospitals".`,
            language
          );
          break;
        }
      }
    },
    [
      setActiveTab,
      setLanguage,
      setSafetyMode,
      setEmergencyMode,
      setCurrency,
      setTravelerProfile,
      resetTrip,
      saveCurrentTrip,
      setHealth,
      budgetState,
      tripData,
      language,
      speak,
      router,
    ]
  );

  // ── Process transcript when it changes ────────────────────────────────────────

  useEffect(() => {
    if (!transcript || transcript === lastProcessedRef.current) return;
    lastProcessedRef.current = transcript;
    setLastTranscript(transcript);
    setLastError(null);

    const intent = parseVoiceIntent(transcript);
    executeIntent(intent);
  }, [transcript, executeIntent]);

  // ── Controls ──────────────────────────────────────────────────────────────────

  const activate = useCallback(() => {
    setLastError(null);
    setLastAction(null);
    startListening(language);
  }, [startListening, language]);

  const deactivate = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const clearLast = useCallback(() => {
    setLastIntent(null);
    setLastAction(null);
    setLastError(null);
    setLastTranscript('');
    lastProcessedRef.current = '';
  }, []);

  return {
    isListening,
    isSupported,
    lastIntent,
    lastTranscript,
    lastError,
    lastAction,
    activate,
    deactivate,
    clearLast,
  };
}
