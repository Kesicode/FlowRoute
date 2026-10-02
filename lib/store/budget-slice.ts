/**
 * lib/store/budget-slice.ts
 *
 * Zustand slice for budget state — allocation, committed spend, risk level.
 * Ephemeral: NOT persisted. Recomputed from trip data on load.
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "./store";
import type { BudgetAllocation, BudgetRisk } from "@/types/trip";

export interface BudgetSlice {
  allocation: BudgetAllocation | null;
  committedAmount: number;
  remainingAmount: number;
  budgetRisk: BudgetRisk;

  setAllocation: (allocation: BudgetAllocation) => void;
  commitAmount: (amount: number) => void;
  updateRemaining: (remaining: number) => void;
  setBudgetRisk: (risk: BudgetRisk) => void;
  resetBudget: () => void;
}

export const createBudgetSlice: StateCreator<AppStore, [], [], BudgetSlice> = (set) => ({
  allocation: null,
  committedAmount: 0,
  remainingAmount: 0,
  budgetRisk: "safe",

  setAllocation: (allocation) => set({ allocation }),

  commitAmount: (amount) =>
    set((state) => ({
      committedAmount: state.committedAmount + amount,
    })),

  updateRemaining: (remaining) => set({ remainingAmount: remaining }),

  setBudgetRisk: (risk) => set({ budgetRisk: risk }),

  resetBudget: () =>
    set({
      allocation: null,
      committedAmount: 0,
      remainingAmount: 0,
      budgetRisk: "safe",
    }),
});
