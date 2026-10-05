/**
 * hooks/usePWA.ts
 *
 * Phase 5 — PWA Detection & Service Worker Registration Hook
 *
 * Returns:
 *   isStandalone    — true when running as installed PWA (not browser tab)
 *   isOnline        — live network status
 *   swRegistered    — service worker successfully registered
 *   updateAvailable — new SW version ready (can prompt user to refresh)
 *   canInstall      — beforeinstallprompt captured (Android/Chrome)
 *   isIOS           — iOS Safari (show manual install instructions)
 *   triggerInstall  — call to show native install prompt (where available)
 *   dismissInstall  — hide install prompt for this session
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface PWAState {
  isStandalone: boolean;
  isOnline: boolean;
  swRegistered: boolean;
  updateAvailable: boolean;
  canInstall: boolean;
  isIOS: boolean;
  triggerInstall: () => Promise<void>;
  dismissInstall: () => void;
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function usePWA(): PWAState {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistered, setSwRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Detect standalone (installed PWA)
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(standaloneQuery.matches || (navigator as { standalone?: boolean }).standalone === true);

    // Detect iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream);

    // Network status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capture beforeinstallprompt (Chrome/Android)
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    // Service Worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          setSwRegistered(true);
          // Check for waiting SW (update available)
          if (reg.waiting) setUpdateAvailable(true);
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) => {
          console.warn("[FlowRoute/SW] Registration failed:", err);
        });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      deferredPromptRef.current = null;
      setCanInstall(false);
    }
  }, []);

  const dismissInstall = useCallback(() => {
    setCanInstall(false);
    deferredPromptRef.current = null;
  }, []);

  return {
    isStandalone,
    isOnline,
    swRegistered,
    updateAvailable,
    canInstall,
    isIOS,
    triggerInstall,
    dismissInstall,
  };
}
