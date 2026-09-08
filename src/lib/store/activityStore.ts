import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActivityItem } from "../types";

interface ActivityState {
  activities: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: [],
      addActivity: (activity) => {
        const newActivity: ActivityItem = {
          ...activity,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ activities: [newActivity, ...s.activities].slice(0, 100) }));
      },
      clearActivities: () => set({ activities: [] }),
    }),
    {
      name: "cova-activity-store",
      partialize: (state) => ({ activities: state.activities }),
    }
  )
);
