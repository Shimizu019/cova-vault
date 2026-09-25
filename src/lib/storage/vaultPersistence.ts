/**
 * Central vault persistence service — the SINGLE SOURCE OF TRUTH for reading
 * and writing encrypted vault feature data.
 *
 * WHY THIS EXISTS
 * ---------------
 * Persistence used to be split across two places that disagreed with each other:
 *
 *   1. `encryptedPersist()` (zustand `persist` middleware) wrote store state to
 *      native storage via `vaultStorage.setItem()` — which ENCRYPTS.
 *   2. `rehydrateStores()` in `pages/Lock.tsx` read it back with
 *      `vaultStorage.getItem()` — which ALREADY DECRYPTS — and then decrypted
 *      the result a SECOND time.
 *
 * The double decryption did not throw, because `decryptPayload()` swallowed the
 * error and returned its input. So the `{ state, version }` persist ENVELOPE was
 * handed to `store.setState()`, which put the user's real data at
 * `state.state.*` while the live `state.*` fields stayed at their defaults (`[]`).
 * The persist middleware then wrote those empty defaults over the good blob.
 *
 * Net effect: data was present on disk, then silently replaced by defaults on
 * every unlock. That is why auth (a plain SHA-256 hash through the raw storage
 * adapter, no encryption, no envelope, never rehydrated) survived while every
 * encrypted feature store did not.
 *
 * THE CONTRACT
 * ------------
 *   - Reading: `readStoreEnvelope()` decrypts AND unwraps `{ state, version }`,
 *     returning only the inner state. Throwing is correct; it must never
 *     substitute defaults.
 *   - Applying: `hydrateAllStores()` is the only code allowed to push persisted
 *     state into a store, and it marks each store hydrated afterwards.
 *   - Writing: `canWriteStore()` in encryptedStorage blocks writes while locked
 *     and blocks writes from a store that has not hydrated yet this session.
 *
 * Lifecycle: unlock → hydrateAllStores() → store hydrated → writes enabled.
 *            lock/logout → resetVaultPersistence() → writes disabled, gates
 *            re-armed for the next unlock.
 *
 * Related views (Folders, Favorites, Calendar/Schedule) are NOT separate stores.
 * They are derived from the stores below, and are counted as such:
 *   Folders           → `folders` in credential / note / task stores
 *   Favorites         → `favorite: true` in credential / note stores
 *   Calendar/Schedule → tasks having a `dueDate`
 */
import { getStorage } from './storage';
import { readStoreEnvelope, type PersistEnvelope } from '../crypto/vaultStorage';
import {
  markStoreHydrated,
  markStoreHydrating,
  markStoreHydrationFailed,
  resetHydrationGates,
} from '../crypto/encryptedStorage';
import {
  useActivityStore,
  useCredentialStore,
  useNoteStore,
  useSavingsStore,
  useSettingsStore,
  useTaskStore,
  useUIStore,
  useWalletStore,
  normalizeWalletState,
} from '../store';

/** Minimal view of a zustand store, so the registry stays type-safe without `any`. */
interface AnyStoreApi {
  getState: () => Record<string, unknown>;
  setState: (partial: Record<string, unknown>) => void;
}

const asApi = (store: unknown): AnyStoreApi => store as AnyStoreApi;

export interface VaultStoreDescriptor {
  /** Native storage key. */
  key: string;
  /** Human label used by the diagnostics screen. */
  label: string;
  /** Array fields that carry the module's user records. */
  countFields: string[];
  /**
   * True when the blob is stored as plain JSON (not an encrypted blob).
   * Only UI preferences use this today.
   */
  plain?: boolean;
  read: () => Record<string, unknown>;
  apply: (state: Record<string, unknown>) => void;
}

/**
 * Every persisted vault store, in the order the diagnostics screen lists them.
 * Keys must match the `name` passed to `encryptedPersist()` / `persist()`.
 */
export const VAULT_STORES: VaultStoreDescriptor[] = [
  {
    key: 'cova-credential-store',
    label: 'Credentials',
    countFields: ['credentials', 'folders'],
    read: () => asApi(useCredentialStore).getState(),
    apply: (s) => asApi(useCredentialStore).setState(s),
  },
  {
    key: 'cova-note-store',
    label: 'Notes',
    countFields: ['notes', 'folders'],
    read: () => asApi(useNoteStore).getState(),
    apply: (s) => asApi(useNoteStore).setState(s),
  },
  {
    key: 'cova-task-store',
    label: 'Tasks',
    countFields: ['tasks', 'folders'],
    read: () => asApi(useTaskStore).getState(),
    apply: (s) => asApi(useTaskStore).setState(s),
  },
  {
    key: 'cova-wallet-store',
    label: 'PeraLog / My Wallet',
    countFields: ['records', 'wallets', 'budgets'],
    read: () => asApi(useWalletStore).getState(),
    apply: (s) => asApi(useWalletStore).setState(normalizeWalletState(s)),
  },
  {
    key: 'cova-savings-store',
    label: 'Savings',
    countFields: ['goals'],
    read: () => asApi(useSavingsStore).getState(),
    apply: (s) => asApi(useSavingsStore).setState(s),
  },
  {
    key: 'cova-activity-store',
    label: 'Activity',
    countFields: ['activities'],
    read: () => asApi(useActivityStore).getState(),
    apply: (s) => asApi(useActivityStore).setState(s),
  },
  {
    key: 'cova-settings-store',
    label: 'Settings & Profile',
    countFields: [],
    read: () => asApi(useSettingsStore).getState(),
    apply: (s) => asApi(useSettingsStore).setState(s),
  },
  {
    key: 'cova-ui-store',
    label: 'UI Preferences',
    countFields: [],
    plain: true,
    read: () => asApi(useUIStore).getState(),
    apply: (s) => asApi(useUIStore).setState(s),
  },
];

const DEBUG = true;
function log(...args: unknown[]) {
  if (DEBUG) console.log('[vaultPersistence]', ...args);
}
function logError(...args: unknown[]) {
  if (DEBUG) console.error('[vaultPersistence]', ...args);
}

/** Count array fields on a state object; used for diagnostics only. */
export function countArrays(state: Record<string, unknown>, fields: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const field of fields) {
    const value = state[field];
    counts[field] = Array.isArray(value) ? value.length : 0;
  }
  return counts;
}

export type HydrateStatus = 'hydrated' | 'salvaged' | 'missing' | 'failed';

export interface HydrateResult {
  key: string;
  label: string;
  status: HydrateStatus;
  /** True when stored state was found on disk (a blob existed). */
  blobFound: boolean;
  counts: Record<string, number>;
  error?: string;
}

/**
 * Repair a blob written by the old double-decryption bug.
 *
 * The bug called `store.setState(envelope)`, so a store's persisted state could
 * gain a nested `state` key. If we ever meet that shape, unwrap the extra level
 * so the user's records are recovered instead of discarded.
 */
function unwrapCorruptedEnvelope(state: Record<string, unknown>): {
  state: Record<string, unknown>;
  repaired: boolean;
} {
  const nested = state.state;
  if (state.version !== undefined && nested && typeof nested === 'object' && !Array.isArray(nested)) {
    log('unwrapCorruptedEnvelope: recovering nested state');
    return { state: nested as Record<string, unknown>, repaired: true };
  }
  return { state, repaired: false };
}

/** Read + decrypt + unwrap one blob. Plain (unencrypted) stores are read raw. */
async function loadStoreState(
  descriptor: VaultStoreDescriptor
): Promise<{ state: Record<string, unknown> | null; repaired: boolean }> {
  if (descriptor.plain) {
    const raw = getStorage().getItem(descriptor.key);
    if (!raw) return { state: null, repaired: false };
    const parsed = JSON.parse(raw) as PersistEnvelope;
    if (!parsed || typeof parsed !== 'object' || !parsed.state) {
      return { state: null, repaired: false };
    }
    return unwrapCorruptedEnvelope(parsed.state as Record<string, unknown>);
  }

  const envelope = await readStoreEnvelope(descriptor.key);
  if (!envelope) return { state: null, repaired: false };
  return unwrapCorruptedEnvelope(envelope.state as Record<string, unknown>);
}

/**
 * Hydrate every persisted vault store from native storage.
 *
 * Call this exactly once per unlock, BEFORE any code mutates a store. Stores
 * whose blob is missing (genuinely new vault) are still marked hydrated so that
 * their first save is allowed through the write gate.
 */
export async function hydrateAllStores(): Promise<HydrateResult[]> {
  log('hydrateAllStores: starting');
  const results: HydrateResult[] = [];

  for (const descriptor of VAULT_STORES) {
    const { key, label } = descriptor;
    markStoreHydrating(key);
    try {
      const { state, repaired } = await loadStoreState(descriptor);

      if (!state) {
        log('hydrateAllStores:', key, 'no persisted blob (new/empty vault)');
        markStoreHydrated(key);
        results.push({
          key,
          label,
          status: 'missing',
          blobFound: false,
          counts: countArrays(descriptor.read(), descriptor.countFields),
        });
        continue;
      }

      // Applying persisted state must not write it back through Zustand.
      // Keep even salvaged blobs intact for recovery; the next user edit will
      // persist the recovered state through the normal save path.
      // Apply migrated state before opening the write gate. The migration itself
      // must not trigger a persistence write while the stored blob is untouched.
      const hydratedState = key === 'cova-wallet-store'
        ? normalizeWalletState(state)
        : state;
      descriptor.apply(hydratedState);
      markStoreHydrated(key);

      const counts = countArrays(descriptor.read(), descriptor.countFields);
      log('hydrateAllStores:', key, repaired ? 'SALVAGED' : 'hydrated', counts);
      results.push({
        key,
        label,
        status: repaired ? 'salvaged' : 'hydrated',
        blobFound: true,
        counts,
      });
    } catch (err) {
      // Do NOT fall back to defaults silently, and do NOT apply partial state.
      // The write gate stays closed for this store, so the on-disk blob is
      // preserved for recovery instead of being overwritten by an empty store.
      const message = err instanceof Error ? err.message : String(err);
      markStoreHydrationFailed(key, message);
      logError('hydrateAllStores:', key, 'FAILED', message);
      results.push({
        key,
        label,
        status: 'failed',
        blobFound: true,
        counts: countArrays(descriptor.read(), descriptor.countFields),
        error: message,
      });
    }
  }

  log('hydrateAllStores: complete', results.map((r) => `${r.label}=${r.status}`).join(', '));
  return results;
}

/**
 * Re-arm the persistence gates. Call on lock / logout so the next unlock must
 * hydrate again before it is allowed to write.
 */
export function resetVaultPersistence(): void {
  resetHydrationGates();
  log('resetVaultPersistence: gates re-armed');
}

/** Live in-memory counts for every store, for the diagnostics screen. */
export function getLiveCounts(): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const descriptor of VAULT_STORES) {
    out[descriptor.label] = countArrays(descriptor.read(), descriptor.countFields);
  }
  return out;
}

/**
 * Counts for the modules that are views over the stores above rather than
 * stores themselves. Used by the per-module diagnostics report.
 */
export function getDerivedCounts(): Record<string, number> {
  const creds = asApi(useCredentialStore).getState();
  const notes = asApi(useNoteStore).getState();
  const tasks = asApi(useTaskStore).getState();

  const folders = [creds, notes, tasks].reduce<number>((sum, state) => {
    const list = state.folders;
    return sum + (Array.isArray(list) ? list.length : 0);
  }, 0);

  const favorites = [creds.credentials, notes.notes].reduce<number>((sum, list) => {
    if (!Array.isArray(list)) return sum;
    return sum + list.filter((item) => (item as { favorite?: boolean }).favorite === true).length;
  }, 0);

  const scheduled = Array.isArray(tasks.tasks)
    ? (tasks.tasks as Array<{ dueDate?: string }>).filter((t) => !!t.dueDate).length
    : 0;

  return { folders, favorites, scheduled };
}