import { create } from "zustand";
import type { ActivityItem } from "../types";
import { encryptedPersist } from "../crypto/encryptedStorage";

interface ActivityState {
  activities: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>()(
  encryptedPersist(
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
