import { persist, createJSONStorage } from "zustand/middleware";
import type { StateCreator } from "zustand";
import { vaultStorage } from "./vaultStorage";

const DEBUG = true;
function log(...args: unknown[]) { if (DEBUG) console.log('[encryptedPersist]', ...args); }
function logError(...args: unknown[]) { if (DEBUG) console.error('[encryptedPersist]', ...args); }

export function encryptedPersist<T>(
  stateCreator: StateCreator<T>,
  options: { name: string; partialize?: (state: T) => Partial<T> } = { name: 'cova-store' }
) {
  log('creating store:', options.name);
  return persist<T>(
    stateCreator,
    {
      name: options.name,
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          log('getItem', name);
          return vaultStorage.getItem(name);
        },
        setItem: (name: string, value: string) => {
          log('setItem', name, `${value.length} chars`);
          return vaultStorage.setItem(name, value);
        },
        removeItem: (name: string) => {
          log('removeItem', name);
          return vaultStorage.removeItem(name);
        },
      })),
      partialize: (state: T) => {
        const partial = (options.partialize ?? ((s: T) => s))(state);
        log('partialize', options.name, Object.keys(partial));
        return partial as T;
      },
      onRehydrateStorage: () => {
        log('onRehydrateStorage', options.name, 'start');
        return (state, error) => {
          if (error) {
            logError('rehydration error', options.name, error);
          } else {
            log('rehydration complete', options.name, state ? 'state restored' : 'no state');
          }
        };
      },
    }
  );
}
