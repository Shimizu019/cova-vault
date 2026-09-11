import { persist, createJSONStorage } from "zustand/middleware";
import type { StateCreator } from "zustand";
import { vaultStorage } from "./vaultStorage";

export function encryptedPersist<T>(
  stateCreator: StateCreator<T>,
  options: { name: string; partialize?: (state: T) => Partial<T> } = { name: 'cova-store' }
) {
  return persist<T>(
    stateCreator,
    {
      name: options.name,
      storage: createJSONStorage(() => ({
        getItem: (name: string) => vaultStorage.getItem(name),
        setItem: (name: string, value: string) => vaultStorage.setItem(name, value),
        removeItem: (name: string) => vaultStorage.removeItem(name),
      })),
      partialize: (options.partialize ?? ((state) => state)) as (state: T) => T,
    }
  );
}
