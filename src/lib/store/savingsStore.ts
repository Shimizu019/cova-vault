import { create } from "zustand"
import type { ActivityItem, SavingsGoal } from "../types"
import { useActivityStore } from "./activityStore"
import { encryptedPersist } from "../crypto/encryptedStorage"

interface SavingsStoreState {
  goals: SavingsGoal[]
  setGoals: (goals: SavingsGoal[]) => void
  addGoal: (goal: SavingsGoal) => void
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void
  removeGoal: (id: string) => void
  getGoals: () => SavingsGoal[]
}

const pushActivity = (activity: Omit<ActivityItem, "id" | "timestamp">) => {
  try {
    useActivityStore.getState().addActivity(activity);
  } catch (e) {
    // silently fail if store is not yet initialized
  }
};

export const useSavingsStore = create<SavingsStoreState>()(
  encryptedPersist(
    (set, get) => ({
      goals: [],
      setGoals: (goals) => set({ goals }),
      addGoal: (goal) => {
        set((state) => ({ goals: [...state.goals, goal] }));
        pushActivity({ type: "savings", title: "Created goal", detail: goal.name });
      },
      updateGoal: (id, updates) => {
        set((state) => ({ goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
        const goal = get().goals.find((g) => g.id === id);
        if (goal) pushActivity({ type: "savings", title: "Updated goal", detail: goal.name });
      },
      removeGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        set((state) => ({ goals: state.goals.filter(g => g.id !== id) }));
        if (goal) pushActivity({ type: "savings", title: "Deleted goal", detail: goal.name });
      },
      getGoals: () => get().goals,
    }),
    {
      name: "cova-savings-store",
      partialize: (state) => ({ goals: state.goals }),
    }
  )
)
