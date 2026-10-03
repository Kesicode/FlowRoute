'use client';
// app/profile/page.tsx
// User profile — local only, no auth.

import { useEffect, useState } from 'react';
import {
  User,
  Settings,
  Globe,
  Shield,
  Database,
} from 'lucide-react';

import {
  useUserProfile,
  useSettingsActions,
  useTravelerProfile,
  useLanguage,
  useCurrency,
  useGeolocationConsent,
  useSafetyMode,
  useTripsListActions,
} from '@/hooks/useTripStore';
import type { TravelerProfile } from '@/types/trip';
import type { Language, Currency } from '@/lib/store/settings-slice';

const AVATAR_EMOJIS = ['🧳', '✈️', '🗺️', '🏔️', '🌊', '🏕️', '🎒', '🚂'];

const TRAVELER_PROFILES: { value: TravelerProfile; label: string }[] = [
  { value: 'solo',       label: 'Solo' },
  { value: 'couple',    label: 'Couple' },
  { value: 'family',    label: 'Family' },
  { value: 'elderly',   label: 'Elderly' },
  { value: 'accessible', label: 'Accessible' },
];

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'ml', label: 'ML' },
];

const CURRENCIES: { code: Currency; label: string }[] = [
  { code: 'INR', label: 'INR' },
  { code: 'USD', label: 'USD' },
  { code: 'EUR', label: 'EUR' },
  { code: 'GBP', label: 'GBP' },
];

export default function ProfilePage() {
  const userProfile = useUserProfile();
  const travelerProfile = useTravelerProfile();
  const language = useLanguage();
  const currency = useCurrency();
  const geolocationConsent = useGeolocationConsent();
  const safetyMode = useSafetyMode();

  const {
    setUserProfile,
    setTravelerProfile,
    setLanguage,
    setCurrency,
    setSafetyMode,
    revokeGeolocationConsent,
  } = useSettingsActions();
  const { clearAllTrips } = useTripsListActions();

  // Local display-name state (debounced save)
  const [displayName, setDisplayName] = useState(userProfile.displayName ?? '');

  // Confirmation states for destructive actions
  const [confirmClearTrips, setConfirmClearTrips] = useState(false);
  const [confirmResetSettings, setConfirmResetSettings] = useState(false);

  useEffect(() => {
    document.title = 'Profile | FlowRoute';
  }, []);

  // Sync display name to store on blur
  const handleNameBlur = () => {
    setUserProfile({ ...userProfile, displayName: displayName || undefined });
  };

  const handleEmojiSelect = (emoji: string) => {
    setUserProfile({ ...userProfile, avatarEmoji: emoji });
  };

  const handleClearTrips = () => {
    if (confirmClearTrips) {
      clearAllTrips();
      setConfirmClearTrips(false);
    } else {
      setConfirmClearTrips(true);
    }
  };

  const handleResetSettings = () => {
    if (confirmResetSettings) {
      setLanguage('en');
      setCurrency('INR');
      setTravelerProfile('solo');
      setConfirmResetSettings(false);
    } else {
      setConfirmResetSettings(true);
    }
  };

  const cardClass = 'bg-card border border-white/10 rounded-2xl p-5 mb-4';
  const sectionHeadingClass = 'flex items-center gap-2 text-sm font-semibold text-foreground mb-4';
  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors';
  const pillActive = 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30';
  const pillInactive = 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-300';

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        {/* ── 1. Identity ─────────────────────────────────────────────────── */}
        <div className={cardClass}>
          <p className={sectionHeadingClass}>
            <User className="w-4 h-4 text-brand-cyan" />
            Identity
          </p>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-3xl select-none">
              {userProfile.avatarEmoji ?? '👤'}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`text-xl p-1.5 rounded-lg border transition-colors ${
                    userProfile.avatarEmoji === emoji
                      ? 'bg-brand-cyan/10 border-brand-cyan/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  aria-label={`Set avatar to ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <label className="block text-xs text-slate-400 mb-1.5" htmlFor="displayName">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Traveler"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan/40 transition-colors"
          />
        </div>

        {/* ── 2. Travel Preferences ────────────────────────────────────────── */}
        <div className={cardClass}>
          <p className={sectionHeadingClass}>
            <Settings className="w-4 h-4 text-brand-cyan" />
            Travel Preferences
          </p>
          <p className="text-xs text-slate-500 mb-3">Default traveler type</p>
          <div className="flex flex-wrap gap-2">
            {TRAVELER_PROFILES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTravelerProfile(value)}
                className={`${pillBase} ${travelerProfile === value ? pillActive : pillInactive}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. Language & Region ─────────────────────────────────────────── */}
        <div className={cardClass}>
          <p className={sectionHeadingClass}>
            <Globe className="w-4 h-4 text-brand-cyan" />
            Language &amp; Region
          </p>

          <p className="text-xs text-slate-500 mb-2">Language</p>
          <div className="flex gap-2 mb-4">
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`${pillBase} ${language === code ? pillActive : pillInactive}`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 mb-2">Currency</p>
          <div className="flex gap-2">
            {CURRENCIES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setCurrency(code)}
                className={`${pillBase} ${currency === code ? pillActive : pillInactive}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. Safety & Privacy ──────────────────────────────────────────── */}
        <div className={cardClass}>
          <p className={sectionHeadingClass}>
            <Shield className="w-4 h-4 text-brand-cyan" />
            Safety &amp; Privacy
          </p>

          {/* Safety mode */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-foreground">Safety mode</p>
              <p className="text-xs text-slate-500 mt-0.5">Enables extra safety alerts during travel</p>
            </div>
            <button
              role="switch"
              aria-checked={safetyMode}
              onClick={() => setSafetyMode(!safetyMode)}
              className={`relative w-10 h-5 rounded-full border transition-colors ${
                safetyMode
                  ? 'bg-brand-cyan/30 border-brand-cyan/50'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                  safetyMode ? 'translate-x-5 bg-brand-cyan' : 'translate-x-0 bg-slate-500'
                }`}
              />
            </button>
          </div>

          {/* Geolocation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {geolocationConsent ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              ) : null}
              <div>
                <p className="text-sm text-foreground">
                  {geolocationConsent ? 'Location active' : 'Location not enabled'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {geolocationConsent
                    ? 'GPS is active for journey tracking'
                    : 'Enable location in journey settings'}
                </p>
              </div>
            </div>
            {geolocationConsent && (
              <button
                onClick={revokeGeolocationConsent}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 transition-colors"
              >
                Revoke
              </button>
            )}
          </div>
        </div>

        {/* ── 5. Data ──────────────────────────────────────────────────────── */}
        <div className={cardClass}>
          <p className={sectionHeadingClass}>
            <Database className="w-4 h-4 text-brand-cyan" />
            Data
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Saved trips</p>
                <p className="text-xs text-slate-500 mt-0.5">Remove all saved trips from this device</p>
              </div>
              <button
                onClick={handleClearTrips}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  confirmClearTrips
                    ? 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-300'
                }`}
              >
                {confirmClearTrips ? 'Confirm clear?' : 'Clear all trips'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Settings</p>
                <p className="text-xs text-slate-500 mt-0.5">Reset language, currency, and traveler type to defaults</p>
              </div>
              <button
                onClick={handleResetSettings}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  confirmResetSettings
                    ? 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-300'
                }`}
              >
                {confirmResetSettings ? 'Confirm reset?' : 'Reset settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
