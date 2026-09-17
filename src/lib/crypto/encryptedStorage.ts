import { persist, createJSONStorage } from "zustand/middleware";
import type { StateCreator } from "zustand";
import { vaultStorage, isVaultUnlocked } from "./vaultStorage";
import { getStorage } from "../storage/storage";

const DEBUG = true;
function log(...args: unknown[]) { if (DEBUG) console.log('[encryptedPersist]', ...args); }
function logError(...args: unknown[]) { if (DEBUG) console.error('[encryptedPersist]', ...args); }

let pendingWrites = new Set<Promise<unknown>>();

export async function flushEncryptedPersistence(): Promise<void> {
  while (pendingWrites.size > 0) {
    await Promise.allSettled([...pendingWrites]);
  }
}

// --- Hydration gate ----------------------------------------------------------
//
// ROOT-CAUSE GUARD. Every encrypted store starts life holding its DEFAULT state
// (`[]` / `{}`) because the vault key does not exist at module-load time. Zustand's
// persist middleware writes on every `setState`, and `useStore.setState()` goes
// through that same wrapped setter. So if ANY code mutates a store before its
// saved blob has been read back and applied, the default/empty state is written
// to native storage and the user's real data is destroyed.
//
// This gate makes that impossible:
//   1. no writes while the vault is locked, and
//   2. no writes before the store's first successful hydration in the current
//      unlock session *when a blob already exists on disk*.
//
// The gate is opened by `markStoreHydrated()`, which the central persistence
// service (lib/storage/vaultPersistence.ts) calls only after rehydrate() has
// actually completed for that store.

const hydratedStores = new Set<string>();
const hydrationErrors = new Map<string, string>();
const blockedWrites = new Map<string, number>();

function storageHasExistingBlob(key: string): boolean {
  try {
    return getStorage().getItem(key) !== null;
  } catch {
    return false;
  }
}

/** Close the gate before every hydration attempt, including repeated unlocks. */
export function markStoreHydrating(name: string): void {
  hydratedStores.delete(name);
}

/** Open the write gate for a store after its saved state has been applied. */
export function markStoreHydrated(name: string): void {
  hydratedStores.add(name);
  hydrationErrors.delete(name);
  log('hydration gate OPEN', name);
}

export function markStoreHydrationFailed(name: string, reason: string): void {
  hydrationErrors.set(name, reason);
  logError('hydration FAILED', name, reason);
}

export function isStoreHydrated(name: string): boolean {
  return hydratedStores.has(name);
}

/**
 * Re-arm the gates. Must be called on lock / logout so the next unlock has to
 * re-hydrate before it is allowed to write again.
 */
export function resetHydrationGates(): void {
  hydratedStores.clear();
  hydrationErrors.clear();
  blockedWrites.clear();
  log('hydration gates reset');
}

export interface HydrationDiagnostic {
  store: string;
  hydrated: boolean;
  error: string | null;
  blockedWrites: number;
}

export function getHydrationDiagnostics(): HydrationDiagnostic[] {
  const names = new Set<string>([...hydratedStores, ...hydrationErrors.keys(), ...blockedWrites.keys()]);
  return [...names].sort().map((store) => ({
    store,
    hydrated: hydratedStores.has(store),
    error: hydrationErrors.get(store) ?? null,
    blockedWrites: blockedWrites.get(store) ?? 0,
  }));
}

/** The write-gate predicate. See the hydration-gate section above. */
function canWriteStore(name: string): boolean {
  // 1. Never persist while locked: no vault key exists, so any write could only
  //    produce an unreadable blob or throw.
  if (!isVaultUnlocked()) return false;

  // 2. If a blob already exists on disk, this store MUST have completed
  //    hydration in the current session before it may write again. This is the
  //    rule that stops the default/empty state from replacing saved data.
  if (!hydratedStores.has(name) && storageHasExistingBlob(name)) return false;

  return true;
}

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
          // ROOT-CAUSE GUARD — see the hydration-gate section at the top of this file.
          if (!canWriteStore(name)) {
            blockedWrites.set(name, (blockedWrites.get(name) ?? 0) + 1);
            logError(
              'setItem BLOCKED by hydration gate',
              name,
              isVaultUnlocked() ? 'store not hydrated yet this session' : 'vault locked'
            );
            return Promise.resolve();
          }
          log('setItem', name, `${value.length} chars`);
          const write = vaultStorage.setItem(name, value);
          pendingWrites.add(write);
          void write.finally(() => pendingWrites.delete(write));
          return write;
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
