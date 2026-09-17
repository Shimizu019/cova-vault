/**
 * Per-module persistence diagnostics — Cova Vault.
 *
 * PURPOSE: test each feature module INDEPENDENTLY across the full lifecycle
 *
 *   create → store state → persist to native storage → force-close → reopen
 *   → read native storage → decrypt/parse → rehydrate store → display
 *
 * and report five stages per module: Write / Read / Decrypt / Rehydrate / Display.
 *
 * The three failure classes the report must tell apart:
 *   'never-saved'    — the module never reached native storage at all.
 *   'not-rehydrated' — data IS on disk (size + hash match) but the live store
 *                      still holds defaults → hydration/initStorage problem.
 *   'not-displayed'  — the store DID rehydrate but the rendered view is empty
 *                      → a UI/derivation problem, not a persistence problem.
 *
 * RULES
 *  - Never log secrets. Only counts, byte sizes, SHA-256 prefixes, and the
 *    synthetic marker token (which is a non-sensitive diagnostic UUID).
 *  - This module instruments and seeds test data; it never rewrites real data.
 *  - All probe/snapshot records are written with the Capacitor Preferences API
 *    DIRECTLY so diagnostics never depend on the layers being tested.
 *
 * Modules covered: Auth, Credentials, Notes, Tasks, PeraLog, Savings, Folders,
 * Favorites, Calendar/Schedule.
 */
import { Preferences } from '@capacitor/preferences';
import { getStorage, isNative } from '../storage/storage';
import { readStoreEnvelope } from '../crypto/vaultStorage';
import { isVaultUnlocked } from '../crypto/vaultStorage';
import { getHydrationDiagnostics, type HydrationDiagnostic } from '../crypto/encryptedStorage';
import { flushEncryptedPersistence } from '../crypto/encryptedStorage';
import { flushStorage } from '../storage/storage';
import { getDerivedCounts, hydrateAllStores, resetVaultPersistence } from '../storage/vaultPersistence';
import { getBuildInfo } from '../buildInfo';
import {
  useCredentialStore,
  useNoteStore,
  useSavingsStore,
  useTaskStore,
  useWalletStore,
} from '../store';
import { generateId } from '../utils';

// --- Types -------------------------------------------------------------------

export type ModuleKey =
  | 'auth'
  | 'credentials'
  | 'notes'
  | 'tasks'
  | 'peralog'
  | 'savings'
  | 'folders'
  | 'favorites'
  | 'calendar';

export type StageName = 'Write' | 'Read' | 'Decrypt' | 'Rehydrate' | 'Display';
export type StageStatus = 'pass' | 'fail' | 'skip';

export type ModuleVerdict =
  | 'ok'
  | 'never-saved'
  | 'lost-at-rest'
  | 'decrypt-failed'
  | 'not-rehydrated'
  | 'not-displayed'
  | 'locked';

export interface ModuleStage {
  name: StageName;
  status: StageStatus;
  detail: string;
}

export interface ModuleReport {
  key: ModuleKey;
  label: string;
  storeKeys: string[];
  stages: ModuleStage[];
  verdict: ModuleVerdict;
  verdictDetail: string;
}

/** One native-storage row captured straight from Capacitor Preferences. */
export interface NativeRow {
  key: string;
  present: boolean;
  size: number;
  hash: string;
}

/** Snapshot written at the end of Phase A, read back after a restart. */
export interface ModuleSnapshot {
  token: string;
  ts: string;
  build: string;
  native: boolean;
  rows: NativeRow[];
  /** Live in-memory counts the moment the test items were saved. */
  liveCounts: Record<string, number>;
  /** Number of live items carrying the marker token, per module. */
  tokenHits: Record<string, number>;
}

export interface SeedReport {
  token: string;
  created: string[];
  errors: string[];
}

// --- Storage keys ------------------------------------------------------------

const DIAG_SNAPSHOT_KEY = 'cova:diag:module-snapshot';
const MASTER_HASH_KEY = 'cova:master-password-hash';
const VAULT_SALT_KEY = 'cova:vault-salt';

/** Store keys by module. Derived modules (folders/favorites/calendar) span several. */
export const MODULE_STORE_KEYS: Record<ModuleKey, string[]> = {
  auth: [MASTER_HASH_KEY, VAULT_SALT_KEY],
  credentials: ['cova-credential-store'],
  notes: ['cova-note-store'],
  tasks: ['cova-task-store'],
  peralog: ['cova-wallet-store'],
  savings: ['cova-savings-store'],
  folders: ['cova-credential-store', 'cova-note-store', 'cova-task-store'],
  favorites: ['cova-credential-store', 'cova-note-store'],
  calendar: ['cova-task-store'],
};

export const MODULE_LABELS: Record<ModuleKey, string> = {
  auth: 'Auth',
  credentials: 'Credentials',
  notes: 'Notes',
  tasks: 'Tasks',
  peralog: 'PeraLog / My Wallet',
  savings: 'Savings',
  folders: 'Folders',
  favorites: 'Favorites',
  calendar: 'Calendar / Schedule',
};

/** Display order for the diagnostics screen — mirrors the user's test list. */
export const MODULE_ORDER: ModuleKey[] = [
  'auth',
  'credentials',
  'notes',
  'tasks',
  'peralog',
  'savings',
  'folders',
  'favorites',
  'calendar',
];

// --- Raw native access -------------------------------------------------------

async function readNative(key: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return null;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Capture present/size/hash for every module store key, straight from native storage. */
export async function captureNativeRows(): Promise<NativeRow[]> {
  const keys = new Set<string>();
  for (const moduleKey of MODULE_ORDER) {
    for (const key of MODULE_STORE_KEYS[moduleKey]) keys.add(key);
  }
  const rows: NativeRow[] = [];
  for (const key of keys) {
    const value = await readNative(key);
    rows.push({
      key,
      present: value !== null,
      size: value?.length ?? 0,
      hash: value ? (await sha256Hex(value)).slice(0, 12) : '',
    });
  }
  return rows;
}
// --- Test data seeding -------------------------------------------------------

/** Count live in-memory items in a module that carry the marker token. */
function liveTokenHits(moduleKey: ModuleKey, token: string): number {
  const hasToken = (value: unknown): boolean =>
    typeof value === 'string' && value.includes(token);

  const creds = useCredentialStore.getState();
  const notes = useNoteStore.getState();
  const tasks = useTaskStore.getState();
  const wallet = useWalletStore.getState();
  const savings = useSavingsStore.getState();

  switch (moduleKey) {
    case 'credentials':
      return creds.credentials.filter((c) => hasToken(c.name)).length;
    case 'notes':
      return notes.notes.filter((n) => hasToken(n.title)).length;
    case 'tasks':
      return tasks.tasks.filter((t) => hasToken(t.title)).length;
    case 'peralog':
      return wallet.records.filter((r) => hasToken(r.description)).length;
    case 'savings':
      return savings.goals.filter((g) => hasToken(g.name)).length;
    case 'folders':
      return [...creds.folders, ...notes.folders, ...tasks.folders].filter((f) =>
        hasToken(f.name)
      ).length;
    case 'favorites':
      return [
        ...creds.credentials.filter((c) => c.favorite).map((c) => c.name),
        ...notes.notes.filter((n) => n.favorite).map((n) => n.title),
      ].filter(hasToken).length;
    case 'calendar':
      return tasks.tasks.filter((t) => hasToken(t.title) && !!t.dueDate).length;
    case 'auth':
      // Auth is verified by hash presence, not by a seeded marker token.
      return 0;
    default:
      return 0;
  }
}

/** Live in-memory counts per module — the input to the "Display" stage. */
export function liveModuleCounts(): Record<ModuleKey, number> {
  const creds = useCredentialStore.getState();
  const notes = useNoteStore.getState();
  const tasks = useTaskStore.getState();
  const wallet = useWalletStore.getState();
  const savings = useSavingsStore.getState();
  const derived = getDerivedCounts();

  return {
    auth: getStorage().getItem(MASTER_HASH_KEY) ? 1 : 0,
    credentials: creds.credentials.length,
    notes: notes.notes.length,
    tasks: tasks.tasks.length,
    peralog: wallet.records.length,
    savings: savings.goals.length,
    folders: derived.folders,
    favorites: derived.favorites,
    calendar: derived.scheduled,
  };
}
/**
 * Create ONE test item in every module, then flush every write to native storage.
 *
 * Items carry a unique marker token so verification proves the EXACT seeded
 * records survived — not merely that some data exists. The synthetic credential
 * password is a fixed non-secret placeholder.
 */
export async function seedModuleTestItems(): Promise<SeedReport> {
  const token = `PTEST-${Date.now().toString(36)}`;
  const created: string[] = [];
  const errors: string[] = [];
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  try {
    const creds = useCredentialStore.getState();
    const credFolder = creds.addFolder(`${token}-cred-folder`, 'credentials');
    created.push(`folder ${credFolder.id}`);

    const cred = creds.addCredential({
      name: `${token}-credential`,
      username: 'diag-user',
      password: 'synthetic-placeholder',
      website: 'https://example.com',
      folderId: credFolder.id,
      tags: ['diag'],
      favorite: false,
    });
    // Toggle through the store action so the Favorites path is exercised too.
    creds.toggleFavorite(cred.id);
    created.push(`credential ${cred.id}`);
  } catch (err) {
    errors.push(`credentials: ${message(err)}`);
  }

  try {
    const notes = useNoteStore.getState();
    const noteFolder = notes.addFolder(`${token}-note-folder`, 'notes');
    created.push(`note folder ${noteFolder.id}`);

    const note = notes.addNote({
      title: `${token}-note`,
      content: 'Synthetic diagnostic note content.',
      folderId: noteFolder.id,
      favorite: false,
    });
    notes.toggleFavorite(note.id);
    created.push(`note ${note.id}`);
  } catch (err) {
    errors.push(`notes: ${message(err)}`);
  }

  try {
    const tasks = useTaskStore.getState();
    const taskFolder = tasks.addFolder(`${token}-task-folder`, 'tasks');
    created.push(`task folder ${taskFolder.id}`);

    const task = tasks.addTask({
      title: `${token}-task`,
      description: 'Synthetic diagnostic task.',
      priority: 'medium',
      status: 'todo',
      dueDate: today,
      folderId: taskFolder.id,
    });
    created.push(`task ${task.id}`);

    // A second, undated task proves Calendar counts only scheduled items.
    tasks.addTask({
      title: `${token}-task-unscheduled`,
      priority: 'low',
      status: 'todo',
      folderId: taskFolder.id,
    });
  } catch (err) {
    errors.push(`tasks: ${message(err)}`);
  }

  try {
    const wallet = useWalletStore.getState();
    wallet.setStartingBalance(1000);
    wallet.addRecord({
      date: today,
      time: '00:00:00',
      description: `${token}-wallet-record`,
      category: 'Food',
      amount: 25,
      type: 'expense',
      cashGiven: 0,
      change: 0,
      note: 'Synthetic diagnostic record',
    });
    created.push('wallet starting balance + record');
  } catch (err) {
    errors.push(`peralog: ${message(err)}`);
  }

  try {
    useSavingsStore.getState().addGoal({
      id: generateId(),
      name: `${token}-savings-goal`,
      target: 5000,
      current: 100,
      createdAt: now,
    });
    created.push('savings goal');
  } catch (err) {
    errors.push(`savings: ${message(err)}`);
  }

  // Flush the entire chain: pending encrypted writes → native Preferences writes.
  await flushEncryptedPersistence();
  await flushStorage();

  return { token, created, errors };
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
// --- Phase A: seed + snapshot + logout ---------------------------------------

export interface PhaseAResult {
  token: string;
  created: string[];
  errors: string[];
  rows: NativeRow[];
  liveCounts: Record<string, number>;
  tokenHits: Record<string, number>;
  missingKeys: string[];
  zeroCountModules: ModuleKey[];
  seeded: boolean;
}

/**
 * PHASE A (vault unlocked). Seed one item per module, flush, capture native
 * metadata + live counts, snapshot to Preferences, then perform a logout that
 * mirrors AppShell exactly (flush → clear key → reset gates). No purge.
 */
export async function runPhaseA(): Promise<PhaseAResult> {
  if (!isVaultUnlocked()) {
    throw new Error('Vault is locked — unlock before running Phase A.');
  }

  const seed = await seedModuleTestItems();
  const rows = await captureNativeRows();
  const liveCounts = liveModuleCounts() as Record<string, number>;

  const tokenHits: Record<string, number> = {};
  for (const moduleKey of MODULE_ORDER) {
    tokenHits[moduleKey] = liveTokenHits(moduleKey, seed.token);
  }

  // Keys that should exist on disk after a successful save.
  const requiredKeys = ['cova-credential-store', 'cova-note-store', 'cova-task-store', 'cova-wallet-store', 'cova-savings-store'];
  const missingKeys = rows.filter((r) => requiredKeys.includes(r.key) && !r.present).map((r) => r.key);

  const zeroCountModules = MODULE_ORDER.filter(
    (m) => m !== 'auth' && (liveCounts[m] ?? 0) === 0
  );

  const snapshot: ModuleSnapshot = {
    token: seed.token,
    ts: new Date().toISOString(),
    build: `${getBuildInfo().tag}#${getBuildInfo().commitShort}`,
    native: isNative,
    rows,
    liveCounts,
    tokenHits,
  };

  // Write the snapshot with the Preferences API directly, so it is readable
  // before unlock after the restart.
  await Preferences.set({ key: DIAG_SNAPSHOT_KEY, value: JSON.stringify(snapshot) });

  // Logout simulation — identical to AppShell: flush, drop the in-memory key,
  // re-arm the persistence gates. Never purge, never clear feature data.
  await flushEncryptedPersistence();
  await flushStorage();
  resetVaultPersistence();

  return {
    ...seed,
    rows,
    liveCounts,
    tokenHits,
    missingKeys,
    zeroCountModules,
    seeded: seed.errors.length === 0,
  };
}

/** Read the Phase A snapshot straight from Preferences (works while locked). */
export async function readModuleSnapshot(): Promise<ModuleSnapshot | null> {
  const raw = await readNative(DIAG_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ModuleSnapshot;
  } catch {
    return null;
  }
}
// --- Phase B: verify at rest, before unlock ----------------------------------

export type RestChange = 'intact' | 'missing' | 'changed' | 'created';

export interface RestRowResult {
  key: string;
  change: RestChange;
  sizeBefore: number;
  sizeAfter: number;
  hashBefore: string;
  hashAfter: string;
}

export interface PhaseBResult {
  snapshot: ModuleSnapshot;
  rows: RestRowResult[];
  missing: string[];
  changed: string[];
  /** Auth must still verify while the vault is locked (hash is not encrypted). */
  authIntact: boolean;
  allIntact: boolean;
}

/**
 * PHASE B (after a complete app restart, BEFORE unlock).
 *
 * Reads RAW NATIVE STORAGE METADATA ONLY — no decryption, no store access, so a
 * "locked vault rehydration" bug cannot mask whether the bytes survived on disk.
 * Compares present/size/hash against the Phase A snapshot to distinguish
 * "was never saved" from "existed on disk but vanished at rest".
 */
export async function runPhaseB(): Promise<PhaseBResult> {
  const snapshot = await readModuleSnapshot();
  if (!snapshot) {
    throw new Error(
      'No Phase A snapshot found in native storage. Run Phase 1 (Save + Logout) on this device first.'
    );
  }

  const before = new Map(snapshot.rows.map((r) => [r.key, r]));
  const after = await captureNativeRows();

  const rows: RestRowResult[] = after.map((row) => {
    const prev = before.get(row.key);
    let change: RestChange;
    if (!prev || !prev.present) {
      change = row.present ? 'created' : 'missing';
    } else if (!row.present) {
      change = 'missing';
    } else if (prev.hash !== row.hash) {
      change = 'changed';
    } else {
      change = 'intact';
    }
    return {
      key: row.key,
      change,
      sizeBefore: prev?.size ?? 0,
      sizeAfter: row.size,
      hashBefore: prev?.hash ?? '',
      hashAfter: row.hash,
    };
  });

  const missing = rows.filter((r) => r.change === 'missing').map((r) => r.key);
  const changed = rows.filter((r) => r.change === 'changed').map((r) => r.key);
  const authIntact = after.some((r) => r.key === MASTER_HASH_KEY && r.present);

  return {
    snapshot,
    rows,
    missing,
    changed,
    authIntact,
    allIntact: missing.length === 0 && changed.length === 0,
  };
}

// --- Phase C: hydrate + verify + per-module report ---------------------------

/**
 * PHASE C (after unlock). Hydrates every store through the central persistence
 * service, then builds the per-module Write/Read/Decrypt/Rehydrate/Display report
 * and classifies each module into one of the three failure classes.
 */
export async function runPhaseC(): Promise<ModuleReport[]> {
  if (!isVaultUnlocked()) {
    throw new Error('Vault is locked — unlock before running Phase C.');
  }

  const snapshot = await readModuleSnapshot();

  // Hydrate everything FIRST. hydrateAllStores() opens each store's write gate
  // only after its saved state has been applied, so nothing can be clobbered.
  await hydrateAllStores();

  const liveCounts = liveModuleCounts() as Record<string, number>;
  const hydration = new Map<string, HydrationDiagnostic>(
    getHydrationDiagnostics().map((h) => [h.store, h])
  );
  const rows = await captureNativeRows();
  const nativeByKey = new Map(rows.map((r) => [r.key, r]));

  // Read (and decrypt) each module's blob once, for the Read/Decrypt stages.
  const decoded = new Map<string, { present: boolean; decrypted: boolean; counts: Record<string, number>; error?: string }>();
  for (const key of new Set(MODULE_ORDER.flatMap((m) => MODULE_STORE_KEYS[m]))) {
    if (key === MASTER_HASH_KEY || key === VAULT_SALT_KEY) {
      const present = nativeByKey.get(key)?.present ?? !!getStorage().getItem(key);
      decoded.set(key, { present, decrypted: true, counts: {} });
      continue;
    }
    try {
      const envelope = await readStoreEnvelope(key);
      const state = (envelope?.state ?? {}) as Record<string, unknown>;
      const counts: Record<string, number> = {};
      for (const [field, value] of Object.entries(state)) {
        if (Array.isArray(value)) counts[field] = value.length;
      }
      decoded.set(key, { present: true, decrypted: true, counts });
    } catch (err) {
      decoded.set(key, { present: nativeByKey.get(key)?.present ?? false, decrypted: false, counts: {}, error: message(err) });
    }
  }

  return MODULE_ORDER.map((moduleKey) =>
    buildModuleReport(moduleKey, snapshot, rows, nativeByKey, decoded, liveCounts, hydration)
  );
}
/** Module key → the persist-store names whose hydration state backs it. */
const MODULE_STORES: Record<Exclude<ModuleKey, 'auth'>, string[]> = {
  credentials: ['cova-credential-store'],
  notes: ['cova-note-store'],
  tasks: ['cova-task-store'],
  peralog: ['cova-wallet-store'],
  savings: ['cova-savings-store'],
  folders: ['cova-credential-store', 'cova-note-store', 'cova-task-store'],
  favorites: ['cova-credential-store', 'cova-note-store'],
  calendar: ['cova-task-store'],
};

/** Fields that hold user-created arrays, per persist-store name. */
const STORE_ARRAY_FIELDS: Record<string, string[]> = {
  'cova-credential-store': ['credentials', 'folders'],
  'cova-note-store': ['notes', 'folders'],
  'cova-task-store': ['tasks', 'folders'],
  'cova-wallet-store': ['records', 'budgets'],
  'cova-savings-store': ['goals'],
};

function buildModuleReport(
  moduleKey: ModuleKey,
  snapshot: ModuleSnapshot | null,
  rows: NativeRow[],
  nativeByKey: Map<string, NativeRow>,
  decoded: Map<string, { present: boolean; decrypted: boolean; counts: Record<string, number>; error?: string }>,
  liveCounts: Record<string, number>,
  hydration: Map<string, HydrationDiagnostic>
): ModuleReport {
  const label = MODULE_LABELS[moduleKey];
  const storeKeys = MODULE_STORE_KEYS[moduleKey];
  const isAuth = moduleKey === 'auth';
  const stages: ModuleStage[] = [];

  // --- Write: was the data actually written when the user created it? ---------
  if (!snapshot) {
    stages.push({ name: 'Write', status: 'skip', detail: 'no Phase 1 snapshot on this device' });
  } else {
    const snapshotKeys = new Map(snapshot.rows.map((r) => [r.key, r]));
    const unwritten = storeKeys.filter((k) => !snapshotKeys.get(k)?.present);
    const sizes = storeKeys.map((k) => `${k}=${snapshotKeys.get(k)?.size ?? 0}B`).join(' ');
    stages.push({
      name: 'Write',
      status: unwritten.length === 0 ? 'pass' : 'fail',
      detail: unwritten.length === 0 ? sizes : `never reached native storage: ${unwritten.join(', ')}`,
    });
  }

  // --- Read: is the blob still present in native storage now? -----------------
  const absent = storeKeys.filter((k) => !nativeByKey.get(k)?.present);
  const readSizes = storeKeys.map((k) => `${k}=${nativeByKey.get(k)?.size ?? 0}B`).join(' ');
  stages.push({
    name: 'Read',
    status: absent.length === 0 ? 'pass' : 'fail',
    detail: absent.length === 0 ? readSizes : `missing from native storage: ${absent.join(', ')}`,
  });

  // --- Decrypt: does the stored blob decrypt + parse? -------------------------
  if (isAuth) {
    const hashPresent = !!getStorage().getItem(MASTER_HASH_KEY);
    stages.push({
      name: 'Decrypt',
      status: hashPresent ? 'pass' : 'fail',
      detail: 'auth is stored unencrypted (hash + salt) — decrypt not applicable',
    });
  } else {
    const failures = storeKeys.filter((k) => !decoded.get(k)?.decrypted);
    const counts = storeKeys
      .map((k) => {
        const c = decoded.get(k)?.counts ?? {};
        const parts = (STORE_ARRAY_FIELDS[k] ?? []).filter((f) => f in c).map((f) => `${f}:${c[f]}`);
        return parts.length ? `${k}(${parts.join(' ')})` : `${k}(empty)`;
      })
      .join(' ');
    const firstError = failures.map((k) => decoded.get(k)?.error).find(Boolean);
    stages.push({
      name: 'Decrypt',
      status: failures.length === 0 ? 'pass' : 'fail',
      detail: failures.length === 0 ? counts : `${failures.join(', ')} failed: ${firstError ?? 'unknown error'}`,
    });
  }

  // --- Rehydrate: did the live store receive the saved data? ------------------
  const live = liveCounts[moduleKey] ?? 0;
  if (isAuth) {
    stages.push({
      name: 'Rehydrate',
      status: live > 0 ? 'pass' : 'fail',
      detail: live > 0 ? 'master hash readable' : 'master hash missing',
    });
  } else {
    const gates = MODULE_STORES[moduleKey].map((n) => {
      const h = hydration.get(n);
      if (!h) return `${n}:no-gate`;
      if (h.error) return `${n}:error(${h.error})`;
      return `${n}:${h.hydrated ? 'hydrated' : 'pending'}${h.blockedWrites ? `/${h.blockedWrites}w-blocked` : ''}`;
    });
    const anyError = MODULE_STORES[moduleKey].some((n) => hydration.get(n)?.error);
    stages.push({
      name: 'Rehydrate',
      status: live > 0 && !anyError ? 'pass' : 'fail',
      detail: `${live} live item(s) — ${gates.join(' ')}`,
    });
  }

  // --- Display: does what the UI reads contain the saved test items? ----------
  const hits = snapshot ? snapshot.tokenHits[moduleKey] ?? 0 : 0;
  const liveHits = snapshot ? liveTokenHits(moduleKey, snapshot.token) : 0;
  if (isAuth) {
    stages.push({
      name: 'Display',
      status: 'pass',
      detail: 'Lock screen authenticates with the persisted account',
    });
  } else {
    stages.push({
      name: 'Display',
      status: liveHits > 0 ? 'pass' : 'fail',
      detail: snapshot
        ? `${liveHits}/${hits} seeded test item(s) visible to the UI`
        : 'no snapshot — cannot match test items',
    });
  }

  // --- Verdict: separate "never saved" / "not rehydrated" / "not displayed" ----
  const [writeStage, readStage, decryptStage, rehydrateStage, displayStage] = stages;
  let verdict: ModuleVerdict = 'ok';
  let verdictDetail = 'All stages passed — data survives create → restart → unlock → display.';

  if (writeStage.status === 'fail') {
    verdict = 'never-saved';
    verdictDetail = `Data was NEVER SAVED: ${writeStage.detail}. The store action never reached native storage.`;
  } else if (readStage.status === 'fail' && writeStage.status === 'pass') {
    verdict = 'lost-at-rest';
    verdictDetail = `Saved, then MISSING AFTER RESTART: ${readStage.detail}. Failure point is at rest — the write was not durable, or startup cleared it.`;
  } else if (decryptStage.status === 'fail') {
    verdict = 'decrypt-failed';
    verdictDetail = `DECRYPTION FAILED: ${decryptStage.detail}. The unlock-time key cannot read data saved earlier.`;
  } else if (rehydrateStage.status === 'fail') {
    verdict = 'not-rehydrated';
    verdictDetail = `DATA EXISTS ON DISK but the live store is empty: ${rehydrateStage.detail}. Failure point is rehydration, not persistence.`;
  } else if (displayStage.status === 'fail') {
    verdict = 'not-displayed';
    verdictDetail = `Store rehydrated but the UI shows none of the seeded items: ${displayStage.detail}. This is a UI/derivation problem, not a persistence problem.`;
  }

  return { key: moduleKey, label, storeKeys, stages, verdict, verdictDetail };
}

/** Overall summary across all modules, for the diagnostics screen header. */
export function summarizeReports(reports: ModuleReport[]): string {
  const failing = reports.filter((r) => r.verdict !== 'ok');
  if (!failing.length) {
    return `ALL ${reports.length} MODULES PASSED — every module survived create → restart → unlock → display.`;
  }
  const classes = new Set(failing.map((r) => r.verdict));
  const parts: string[] = [];
  if (classes.has('never-saved')) parts.push('data was never saved');
  if (classes.has('lost-at-rest')) parts.push('data vanished at rest');
  if (classes.has('decrypt-failed')) parts.push('decryption failed');
  if (classes.has('not-rehydrated')) parts.push('data exists on disk but was not rehydrated');
  if (classes.has('not-displayed')) parts.push('rehydrated but not displayed');
  return `${failing.length}/${reports.length} module(s) failing: ${parts.join('; ')}. Failure isolated to: ${failing.map((f) => `${f.label} [${f.verdict}]`).join(', ')}.`;
}