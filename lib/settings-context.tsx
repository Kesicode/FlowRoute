"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language } from "@/services/translations";

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  safetyMode: boolean;
  setSafetyMode: (mode: boolean) => void;
  emergencyMode: boolean;
  setEmergencyMode: (mode: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [safetyMode, setSafetyModeState] = useState(false);
  const [emergencyMode, setEmergencyModeState] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("flowroute_lang") as Language;
      if (savedLang && ["en", "hi", "ml"].includes(savedLang)) {
        setLanguageState(savedLang);
      }
      const savedSafety = localStorage.getItem("flowroute_safety") === "true";
      setSafetyModeState(savedSafety);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("flowroute_lang", lang);
  };

  const setSafetyMode = (mode: boolean) => {
    setSafetyModeState(mode);
    localStorage.setItem("flowroute_safety", mode ? "true" : "false");
  };

  const setEmergencyMode = (mode: boolean) => {
    setEmergencyModeState(mode);
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        safetyMode,
        setSafetyMode,
        emergencyMode,
        setEmergencyMode,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
