/**
 * lib/store/ui-slice.ts
 *
 * Zustand slice for ephemeral UI state — active tab, loading phase, panels.
 * NOT persisted. Resets on every page load.
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "./store";
import type { LoadingPhase } from "@/types/trip";

export interface UISlice {
  /** Currently active tab on the journey page. */
  activeTab: string;
  /** Whether the mobile drawer is open. */
  mobileViewOpen: boolean;
  /** Stack of open panel IDs (last = topmost). */
  panelStack: string[];
  /** Current AI generation loading phase (null when idle). */
  loadingPhase: LoadingPhase | null;

  setActiveTab: (tab: string) => void;
  setMobileViewOpen: (open: boolean) => void;
  pushPanel: (panelId: string) => void;
  popPanel: () => void;
  closeAllPanels: () => void;
  setLoadingPhase: (phase: LoadingPhase | null) => void;
}

export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set) => ({
  activeTab: "route",
  mobileViewOpen: false,
  panelStack: [],
  loadingPhase: null,

  setActiveTab: (activeTab) => set({ activeTab }),

  setMobileViewOpen: (mobileViewOpen) => set({ mobileViewOpen }),

  pushPanel: (panelId) =>
    set((state) => ({
      panelStack: [...state.panelStack, panelId],
    })),

  popPanel: () =>
    set((state) => ({
      panelStack: state.panelStack.slice(0, -1),
    })),

  closeAllPanels: () => set({ panelStack: [] }),

  setLoadingPhase: (loadingPhase) => set({ loadingPhase }),
});
