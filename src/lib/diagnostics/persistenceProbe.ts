/**
 * Persistence diagnostic probe — Cova Vault.
 *
 * PURPOSE: isolate exactly WHERE saved data disappears in the lifecycle
 *   save → storage adapter → Capacitor Preferences → Android persistent storage
 *   → logout → app termination/restart → startup init → login/unlock
 *   → encryption/decryption → Zustand rehydration → UI
 *
 * RULES
 *  - This module ONLY instruments. It does not modify any persistence behavior.
 *  - The test value PERSISTENCE_TEST is written through three layers:
 *      1. Capacitor Preferences directly (Android SharedPreferences, app-private)
 *      2. The app storage adapter (queue + flush path)
 *      3. vaultStorage (the encrypted layer the real stores use)
 *  - Probe state + log are written with the Preferences API DIRECTLY so the
 *    diagnostic never depends on the layers being tested.
 *  - Every monitored key is hashed (SHA-256) at each phase boundary so any
 *    unexpected overwrite (e.g. default state replacing saved data) is visible.
 *  - Logout is simulated EXACTLY like AppShell logout: flush pending writes,
 *    flush native queue, clear in-memory vault key. No purge.
 *
 * PHASES (app restart cannot be scripted, so the user drives it:)
 *  Phase 1 (vault unlocked)  — save + verify + logout + verify still present
 *  Phase 2 (after force-close/reopen, BEFORE unlock) — verify survival on disk
 *  Phase 3 (after unlock)    — verify decryption + Zustand rehydration + no overwrites
 */
import { Preferences } from '@capacitor/preferences';
import { getStorage, flushStorage, isNative } from '../storage/storage';
import {
  vaultStorage,
  setVaultKey,
  isVaultUnlocked,
  decryptPayload,
} from '../crypto/vaultStorage';
import { flushEncryptedPersistence } from '../crypto/encryptedStorage';
import {
  useCredentialStore,
  useNoteStore,
  useTaskStore,
  useWalletStore,
  useSavingsStore,
} from '../store';
import { getBuildInfo } from '../buildInfo';
import { generateId } from '../utils';

/** The single test value for the minimal persistence test. */
export const PERSISTENCE_TEST = 'hello123';

// --- Probe storage keys (all app-private; nothing here needs permissions) ---
export const DIAG_RAW_KEY = 'cova:diag:raw-test';
export const DIAG_ADAPTER_KEY = 'cova:diag:adapter-test';
export const DIAG_ENC_KEY = 'cova:diag:enc-test';
const DIAG_LOG_KEY = 'cova:diag:log';
const DIAG_STATE_KEY = 'cova:diag:state';

const VAULT_SALT_KEY = 'cova:vault-salt';
const MASTER_HASH_KEY = 'cova:master-password-hash';

/** Every key the probe watches across the whole lifecycle. */
export const MONITORED_KEYS: string[] = [
  VAULT_SALT_KEY,
  MASTER_HASH_KEY,
  'cova-credential-store',
  'cova-note-store',
  'cova-task-store',
  'cova-wallet-store',
  'cova-savings-store',
  'cova-activity-store',
  'cova-settings-store',
  'cova-ui-store',
  DIAG_ENC_KEY,
];

/** Encrypted store blobs (the five data features + activity/settings/ui). */
export const DATA_STORE_KEYS: string[] = [
  'cova-credential-store',
  'cova-note-store',
  'cova-task-store',
  'cova-wallet-store',
  'cova-savings-store',
  'cova-activity-store',
  'cova-settings-store',
  'cova-ui-store',
];

/**
 * Keys that are EXPECTED to change when the vault is unlocked
 * (Lock.tsx writes lastUnlockedAt, toasts touch the ui store, etc.).
 * The five data stores are NOT in this list — any change there is critical.
 */
const POST_UNLOCK_VOLATILE_KEYS = [
  'cova-settings-store',
  'cova-ui-store',
  'cova-activity-store',
];

// --- Types -------------------------------------------------------------------

export type ProbeStatus = 'pass' | 'fail' | 'skip';

export interface ProbeStage {
  id: string;
  label: string;
  ts: string;
  status: ProbeStatus;
  detail: string;
}

export interface KeySnapshot {
  key: string;
  present: boolean;
  length: number;
  hash: string;
}

export type KeySnapshotMap = Record<string, KeySnapshot>;

export interface SnapshotDiff {
  key: string;
  kind: 'changed' | 'removed' | 'added';
  beforeHash?: string;
  afterHash?: string;
}

export interface ProbePhaseResult {
  phase: string;
  ts: string;
  passed: boolean;
  hasSkips: boolean;
  stages: ProbeStage[];
  changedKeys: SnapshotDiff[];
}

export type FeatureKey = 'credentials' | 'notes' | 'tasks' | 'wallet' | 'savings';

export const FEATURE_KEYS: FeatureKey[] = ['credentials', 'notes', 'tasks', 'wallet', 'savings'];

export interface StorageRow {
  key: string;
  present: boolean;
  length: number;
  hashPrefix: string;
  decryptable: boolean | null;
  items: string;
}

interface FeatureExpectation {
  feature: FeatureKey;
  id: string;
  storeKey: string;
  field: string;
}

interface ExpectedCounts {
  credentials: number;
  notes: number;
  tasks: number;
  walletRecords: number;
  savingsGoals: number;
}

interface ProbeState {
  sessionId: string;
  timeOrigin: number;
  startedAt: string;
  build: ReturnType<typeof getBuildInfo>;
  native: boolean;
  features: FeatureKey[];
  expectations: FeatureExpectation[];
  expectedCounts: ExpectedCounts;
  encHashAfterSave: string;
  beforeLogout: KeySnapshotMap;
  afterLogout: KeySnapshotMap;
}

/** Live item counts across the five data features. */
function liveCounts(): ExpectedCounts {
  return {
    credentials: useCredentialStore.getState().credentials.length,
    notes: useNoteStore.getState().notes.length,
    tasks: useTaskStore.getState().tasks.length,
    walletRecords: useWalletStore.getState().records.length,
    savingsGoals: useSavingsStore.getState().goals.length,
  };
}

// --- Helpers -------------------------------------------------------------------

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Read a raw value straight from native Preferences (bypasses the app cache). */
async function readNative(key: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return null;
  }
}

async function snapshotMonitoredKeys(): Promise<KeySnapshotMap> {
  const map: KeySnapshotMap = {};
  for (const key of MONITORED_KEYS) {
    const value = await readNative(key);
    map[key] = {
      key,
      present: value !== null,
      length: value?.length ?? 0,
      hash: value ? await sha256Hex(value) : '',
    };
  }
  return map;
}

function diffSnapshots(before: KeySnapshotMap, after: KeySnapshotMap): SnapshotDiff[] {
  const diffs: SnapshotDiff[] = [];
  for (const key of Object.keys(after)) {
    const b = before[key];
    const a = after[key];
    if (!b || !b.present) {
      if (a.present) diffs.push({ key, kind: 'added', afterHash: a.hash });
    } else if (!a.present) {
      diffs.push({ key, kind: 'removed', beforeHash: b.hash });
    } else if (b.hash !== a.hash) {
      diffs.push({ key, kind: 'changed', beforeHash: b.hash, afterHash: a.hash });
    }
  }
  return diffs;
}

/** The probe log itself lives directly in Preferences, independent of the app storage layers. */
export async function readDiagLog(): Promise<ProbeStage[]> {
  const value = await readNative(DIAG_LOG_KEY);
  if (!value) return [];
  try {
    return JSON.parse(value) as ProbeStage[];
  } catch {
    return [];
  }
}

async function appendDiagStages(stages: ProbeStage[]): Promise<void> {
  if (stages.length === 0) return;
  const existing = await readDiagLog();
  await Preferences.set({ key: DIAG_LOG_KEY, value: JSON.stringify([...existing, ...stages]) });
}

export async function clearDiagData(): Promise<void> {
  for (const key of [DIAG_RAW_KEY, DIAG_ADAPTER_KEY, DIAG_ENC_KEY, DIAG_LOG_KEY, DIAG_STATE_KEY]) {
    try {
      await Preferences.remove({ key });
    } catch {
      // diagnostics only — ignore removal errors
    }
  }
}

async function loadProbeState(): Promise<ProbeState | null> {
  const value = await readNative(DIAG_STATE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as ProbeState;
  } catch {
    return null;
  }
}

/** Service-worker state — a stale SW can serve OLD code after an APK update. */
export async function getServiceWorkerSummary(): Promise<string> {
  try {
    if (!navigator.serviceWorker) return 'unavailable';
    const regs = await navigator.serviceWorker.getRegistrations();
    if (regs.length === 0) return 'none';
    const ctrl = navigator.serviceWorker.controller
      ? `controller=${navigator.serviceWorker.controller.scriptURL}`
      : 'no-controller';
    return `${regs.length} registered (${ctrl}) — STALE-CODE RISK after APK updates`;
  } catch {
    return 'error-checking';
  }
}

// --- Feature probe seeding (uses the REAL store actions) ----------------------

function seedFeatureProbe(feature: FeatureKey): FeatureExpectation {
  switch (feature) {
    case 'credentials': {
      const cred = useCredentialStore.getState().addCredential({
        name: 'DIAG-PROBE Credential',
        username: 'diag-probe',
        password: PERSISTENCE_TEST,
        website: 'https://probe.cova.local',
        tags: ['diag-probe'],
        favorite: false,
      });
      return { feature, id: cred.id, storeKey: 'cova-credential-store', field: 'credentials' };
    }
    case 'notes': {
      const note = useNoteStore.getState().addNote({
        title: 'DIAG-PROBE Note',
        content: PERSISTENCE_TEST,
        favorite: false,
      });
      return { feature, id: note.id, storeKey: 'cova-note-store', field: 'notes' };
    }
    case 'tasks': {
      const task = useTaskStore.getState().addTask({
        title: 'DIAG-PROBE Task',
        description: PERSISTENCE_TEST,
        priority: 'medium',
        status: 'todo',
      });
      return { feature, id: task.id, storeKey: 'cova-task-store', field: 'tasks' };
    }
    case 'wallet': {
      const now = new Date();
      const rec = useWalletStore.getState().addRecord({
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        description: 'DIAG-PROBE PeraLog entry',
        category: 'Diagnostic',
        amount: 123.45,
        type: 'expense',
        note: PERSISTENCE_TEST,
      });
      return { feature, id: rec.id, storeKey: 'cova-wallet-store', field: 'records' };
    }
    case 'savings': {
      const goal = {
        id: generateId(),
        name: 'DIAG-PROBE Savings goal',
        target: 1000,
        current: 123,
        createdAt: new Date().toISOString(),
      };
      useSavingsStore.getState().addGoal(goal);
      return { feature, id: goal.id, storeKey: 'cova-savings-store', field: 'goals' };
    }
  }
}

/** Is the probe item present in the LIVE (rehydrated) Zustand store state? */
function findProbeItemInLiveStore(exp: FeatureExpectation): boolean {
  switch (exp.feature) {
    case 'credentials':
      return useCredentialStore.getState().credentials.some((c) => c.id === exp.id);
    case 'notes':
      return useNoteStore.getState().notes.some((n) => n.id === exp.id);
    case 'tasks':
      return useTaskStore.getState().tasks.some((t) => t.id === exp.id);
    case 'wallet':
      return useWalletStore.getState().records.some((r) => r.id === exp.id);
    case 'savings':
      return useSavingsStore.getState().goals.some((g) => g.id === exp.id);
  }
}

function makeStageRecorder(stages: ProbeStage[]) {
  return (id: string, label: string, status: ProbeStatus, detail: string) => {
    stages.push({ id, label, ts: new Date().toISOString(), status, detail });
  };
}

function phaseResult(phase: string, ts: string, stages: ProbeStage[], changedKeys: SnapshotDiff[]): ProbePhaseResult {
  return {
    phase,
    ts,
    passed: stages.every((s) => s.status !== 'fail'),
    hasSkips: stages.some((s) => s.status === 'skip'),
    stages,
    changedKeys,
  };
}

/**
 * PHASE 1 — run while the vault is UNLOCKED.
 * Save the test value through every layer, seed real feature items, then
 * simulate the exact logout sequence and prove data survives it on disk.
 */
export async function runPhase1SaveAndLogout(features: FeatureKey[]): Promise<ProbePhaseResult> {
  const stages: ProbeStage[] = [];
  const add = makeStageRecorder(stages);
  const build = getBuildInfo();

  // P1-0 Pre-flight
  const priorState = await loadProbeState();
  add(
    'P1-0',
    'Pre-flight',
    'pass',
    `platform=${isNative ? 'native' : 'web'}, vaultUnlocked=${isVaultUnlocked()}, ` +
      `build=${build.version}#${build.buildNumber}@${build.commitShort}, sw=${await getServiceWorkerSummary()}` +
      (priorState ? `, priorRun=${priorState.startedAt} (overwrites prior probe state)` : ', first run'),
  );

  // P1-1 Save test value directly with Capacitor Preferences (Android SharedPreferences)
  try {
    await Preferences.set({ key: DIAG_RAW_KEY, value: PERSISTENCE_TEST });
    const value = await readNative(DIAG_RAW_KEY);
    add(
      'P1-1',
      'Save test value → Capacitor Preferences (native)',
      value === PERSISTENCE_TEST ? 'pass' : 'fail',
      `wrote "${PERSISTENCE_TEST}", read back ${JSON.stringify(value)} via Preferences.get (bypasses app cache)`,
    );
  } catch (err) {
    add('P1-1', 'Save test value → Capacitor Preferences (native)', 'fail', `ERROR: ${String(err)}`);
  }

  // P1-2 Write through the app storage adapter (queue + flush path)
  try {
    const adapter = getStorage();
    await adapter.setItem(DIAG_ADAPTER_KEY, PERSISTENCE_TEST);
    await flushStorage();
    const value = await readNative(DIAG_ADAPTER_KEY);
    add(
      'P1-2',
      'Storage adapter write + flush → native',
      value === PERSISTENCE_TEST ? 'pass' : 'fail',
      `adapter=${isNative ? 'native (Preferences)' : 'localStorage'}, read back ${JSON.stringify(value)} from Preferences`,
    );
  } catch (err) {
    add('P1-2', 'Storage adapter write + flush → native', 'fail', `ERROR: ${String(err)}`);
  }

  // P1-3 Write through the encrypted vault layer (same path the real stores use)
  let encHash = '';
  if (!isVaultUnlocked()) {
    add('P1-3', 'Encrypted vault write (vaultStorage)', 'skip', 'Vault is locked — unlock the vault first, then re-run Phase 1.');
  } else {
    try {
      await vaultStorage.setItem(DIAG_ENC_KEY, PERSISTENCE_TEST);
      await flushEncryptedPersistence();
      await flushStorage();
      const value = await readNative(DIAG_ENC_KEY);
      let structural = false;
      if (value) {
        encHash = await sha256Hex(value);
        try {
          const parsed = JSON.parse(value) as { iv?: unknown; data?: unknown };
          structural = typeof parsed.iv === 'string' && typeof parsed.data === 'string';
        } catch {
          structural = false;
        }
      }
      add(
        'P1-3',
        'Encrypted vault write (vaultStorage)',
        !!value && structural ? 'pass' : 'fail',
        `ciphertextChars=${value?.length ?? 0}, payloadHasIvAndData=${structural}, hashPrefix=${encHash.slice(0, 8)}`,
      );
    } catch (err) {
      add('P1-3', 'Encrypted vault write (vaultStorage)', 'fail', `ERROR: ${String(err)}`);
    }
  }

  // P1-4 Seed real probe items through the actual store actions (all 5 features)
  const expectations: FeatureExpectation[] = [];
  for (const feature of features) {
    try {
      const exp = seedFeatureProbe(feature);
      expectations.push(exp);
      add(`P1-4:${feature}`, `Seed probe item via real store action (${feature})`, 'pass', `id=${exp.id} → ${exp.storeKey}.${exp.field}`);
    } catch (err) {
      add(`P1-4:${feature}`, `Seed probe item via real store action (${feature})`, 'fail', `ERROR: ${String(err)}`);
    }
  }
  await flushEncryptedPersistence();
  await flushStorage();

  // P1-5 Snapshot of native storage BEFORE logout
  const beforeLogout = await snapshotMonitoredKeys();
  add('P1-5', 'Snapshot native storage before logout', 'pass', `${Object.keys(beforeLogout).length} monitored keys hashed`);

  // P1-6 Logout — EXACTLY what AppShell logout does: flush writes, flush native
  // queue, clear the in-memory vault key. No purge, no data deletion.
  await flushEncryptedPersistence();
  await flushStorage();
  setVaultKey(null);

  // P1-7 Test data must still exist in native storage after logout
  const afterLogout = await snapshotMonitoredKeys();
  for (const key of [DIAG_RAW_KEY, DIAG_ADAPTER_KEY, DIAG_ENC_KEY]) {
    const snap = afterLogout[key];
    add(
      `P1-7:${key}`,
      'Test value still in native storage after logout',
      snap.present ? 'pass' : 'fail',
      snap.present ? `${snap.length} chars, hashPrefix=${snap.hash.slice(0, 8)}` : 'MISSING after logout',
    );
  }

  // P1-8 Logout must not modify or purge any stored data
  const changed = diffSnapshots(beforeLogout, afterLogout);
  add(
    'P1-8',
    'Logout does not purge or modify stored data',
    changed.length === 0 ? 'pass' : 'fail',
    changed.length === 0
      ? 'all monitored keys identical before/after logout'
      : `changed: ${changed.map((d) => `${d.key}(${d.kind})`).join(', ')}`,
  );

  // P1-9a Record expected live counts (after seeding + flush) for Phase 3 verification
  const expectedCounts = liveCounts();

  // Persist probe state for Phases 2 and 3 (direct Preferences write)
  const state: ProbeState = {
    sessionId: generateId(),
    timeOrigin: performance.timeOrigin,
    startedAt: new Date().toISOString(),
    build,
    native: isNative,
    features,
    expectations,
    expectedCounts,
    encHashAfterSave: encHash,
    beforeLogout,
    afterLogout,
  };
  try {
    await Preferences.set({ key: DIAG_STATE_KEY, value: JSON.stringify(state) });
    add('P1-9', 'Persist probe state', 'pass', `sessionId=${state.sessionId}`);
  } catch (err) {
    add('P1-9', 'Persist probe state', 'fail', `ERROR: ${String(err)}`);
  }

  await appendDiagStages(stages);
  return phaseResult('Phase 1 — Save + Logout', state.startedAt, stages, changed);
}

/**
 * PHASE 2 — run after the app was COMPLETELY closed and reopened,
 * ideally BEFORE unlocking (while the vault is still locked).
 * Verifies what actually survived on disk — no app cache involved.
 */
export async function runPhase2VerifyAfterRestart(): Promise<ProbePhaseResult> {
  const stages: ProbeStage[] = [];
  const add = makeStageRecorder(stages);

  const state = await loadProbeState();
  if (!state) {
    add('P2-0', 'Load Phase 1 state', 'fail', 'No saved probe state found — run Phase 1 (Save + Logout) first.');
    await appendDiagStages(stages);
    return phaseResult('Phase 2 — After restart', new Date().toISOString(), stages, []);
  }

  // P2-1 Was the app actually restarted? A force-close/reopen creates a fresh
  // page load, so performance.timeOrigin differs. Same value = same session.
  const restarted = state.timeOrigin !== performance.timeOrigin;
  add(
    'P2-1',
    'App restart detected',
    restarted ? 'pass' : 'fail',
    `phase1TimeOrigin=${new Date(state.timeOrigin).toISOString()}, now=${new Date(performance.timeOrigin).toISOString()}` +
      (restarted
        ? ''
        : ' — SAME page session: force-close the app completely (swipe away from Recents), reopen, then run Phase 2 again BEFORE unlocking.'),
  );

  // P2-2 Raw value survived (written directly to Preferences in Phase 1)
  const raw = await readNative(DIAG_RAW_KEY);
  add(
    'P2-2',
    `Raw test value survived restart (${DIAG_RAW_KEY})`,
    raw === PERSISTENCE_TEST ? 'pass' : 'fail',
    raw === PERSISTENCE_TEST
      ? `value=${JSON.stringify(raw)} — Android persistent storage kept it`
      : `value=${JSON.stringify(raw)} → data never reached persistent Android storage, or app data was cleared`,
  );

  // P2-3 Adapter-written value survived
  const adapterVal = await readNative(DIAG_ADAPTER_KEY);
  add(
    'P2-3',
    `Adapter test value survived restart (${DIAG_ADAPTER_KEY})`,
    adapterVal === PERSISTENCE_TEST ? 'pass' : 'fail',
    `value=${JSON.stringify(adapterVal)}${adapterVal === null && raw === PERSISTENCE_TEST ? ' → adapter flush path lost it, direct write survived' : ''}`,
  );

  // P2-4 Encrypted blob survived unchanged
  const enc = await readNative(DIAG_ENC_KEY);
  const encHash = enc ? await sha256Hex(enc) : '';
  if (!state.encHashAfterSave) {
    add('P2-4', `Encrypted test value survived restart (${DIAG_ENC_KEY})`, 'skip', 'Phase 1 ran with the vault locked — no encrypted test value was saved. Re-run Phase 1 while unlocked.');
  } else {
    add(
      'P2-4',
      `Encrypted test value survived restart (${DIAG_ENC_KEY})`,
      !!enc && encHash === state.encHashAfterSave ? 'pass' : 'fail',
      enc
        ? `chars=${enc.length}, hashPrefix=${encHash.slice(0, 8)}, unchangedSinceSave=${encHash === state.encHashAfterSave}`
        : 'MISSING after restart',
    );
  }

  // P2-5 Vault salt survived — losing it makes every existing blob undecryptable
  const salt = await readNative(VAULT_SALT_KEY);
  add(
    'P2-5',
    `Vault salt survived restart (${VAULT_SALT_KEY})`,
    salt ? 'pass' : 'fail',
    salt
      ? `chars=${salt.length}, hashPrefix=${(await sha256Hex(salt)).slice(0, 8)}`
      : 'MISSING — CRITICAL: unlock will silently generate a NEW salt and derive a key that cannot decrypt any existing data (classic "all data gone" cause)',
  );

  // P2-6 Master password hash survived — losing it regresses to CHANGEME,
  // and the CHANGEME first-time path purges the whole vault.
  const hash = await readNative(MASTER_HASH_KEY);
  add(
    'P2-6',
    `Master password hash survived restart (${MASTER_HASH_KEY})`,
    hash ? 'pass' : 'fail',
    hash
      ? `chars=${hash.length}`
      : 'MISSING — CRITICAL: Lock screen will show first-time (CHANGEME) state; unlocking with CHANGEME purges the vault',
  );

  // P2-7 Store blobs survived unchanged (tolerate settings/ui/activity changes
  // if the user already unlocked — those are rewritten by the unlock flow).
  for (const key of DATA_STORE_KEYS) {
    const val = await readNative(key);
    const before = state.afterLogout[key];
    const h = val ? await sha256Hex(val) : '';
    const unchanged = !!val && !!before?.present && h === before.hash;
    if (!val) {
      add(
        `P2-7:${key}`,
        `Store blob survived restart (${key})`,
        'fail',
        `MISSING after restart (at logout: ${before?.present ? `${before.length} chars` : 'already absent'})`,
      );
    } else if (unchanged) {
      add(`P2-7:${key}`, `Store blob survived restart (${key})`, 'pass', `chars=${val.length}, hashPrefix=${h.slice(0, 8)}, unchanged since logout`);
    } else if (POST_UNLOCK_VOLATILE_KEYS.includes(key) && isVaultUnlocked()) {
      add(
        `P2-7:${key}`,
        `Store blob survived restart (${key})`,
        'pass',
        `changed since logout (${before?.length ?? '?'} → ${val.length} chars) — expected: you already unlocked, and unlock rewrites this key`,
      );
    } else {
      add(
        `P2-7:${key}`,
        `Store blob survived restart (${key})`,
        'fail',
        `CHANGED since logout (${before?.length ?? '?'} → ${val.length} chars, hashPrefix=${h.slice(0, 8)}) while the vault was still locked — unexpected overwrite`,
      );
    }
  }

  // P2-8 Startup cache hydration: initStorage() should have loaded native
  // values into the in-memory cache at boot.
  const cachedRaw = getStorage().getItem(DIAG_RAW_KEY);
  add(
    'P2-8',
    'Startup cache hydration contains test value',
    cachedRaw === PERSISTENCE_TEST ? 'pass' : 'fail',
    cachedRaw === PERSISTENCE_TEST
      ? 'in-memory cache was hydrated from native storage at startup'
      : `cache returned ${JSON.stringify(cachedRaw)} while native read=${JSON.stringify(await readNative(DIAG_RAW_KEY))} → initStorage() did not hydrate native values`,
  );

  await appendDiagStages(stages);
  return phaseResult('Phase 2 — After restart (vault still locked)', new Date().toISOString(), stages, []);
}

/**
 * PHASE 3 — run AFTER unlocking the vault.
 * Verifies decryption with the freshly derived key, that the seeded probe
 * items reached the live Zustand stores (rehydration), and that unlock did
 * not overwrite any native data.
 */
export async function runPhase3VerifyAfterUnlock(): Promise<ProbePhaseResult> {
  const stages: ProbeStage[] = [];
  const add = makeStageRecorder(stages);

  // P3-0 Vault must be unlocked
  if (!isVaultUnlocked()) {
    add('P3-0', 'Vault unlocked', 'fail', 'Vault is locked — unlock with the master password first, then run Phase 3.');
    await appendDiagStages(stages);
    return phaseResult('Phase 3 — After unlock', new Date().toISOString(), stages, []);
  }
  add('P3-0', 'Vault unlocked', 'pass', 'in-memory vault key is set');

  const state = await loadProbeState();

  // P3-1 Decrypt the encrypted test value with the freshly derived key
  try {
    const decrypted = await vaultStorage.getItem(DIAG_ENC_KEY);
    add(
      'P3-1',
      'Decrypt with unlocked key (vaultStorage.getItem)',
      decrypted === PERSISTENCE_TEST ? 'pass' : 'fail',
      decrypted === PERSISTENCE_TEST
        ? `value=${JSON.stringify(decrypted)}`
        : `getItem returned ${JSON.stringify(decrypted)} → the unlock-derived key does not match the key used to encrypt (salt changed?) or decryption failed`,
    );
  } catch (err) {
    add('P3-1', 'Decrypt with unlocked key (vaultStorage.getItem)', 'fail', `ERROR: ${String(err)}`);
  }

  // P3-2 Rehydration: seeded probe items present in live Zustand state?
  if (state && state.expectations.length > 0) {
    for (const exp of state.expectations) {
      const found = findProbeItemInLiveStore(exp);
      add(
        `P3-2:${exp.feature}`,
        `Rehydrated store contains probe item (${exp.feature})`,
        found ? 'pass' : 'fail',
        found
          ? `id=${exp.id} found in live state`
          : `id=${exp.id} NOT in live ${exp.feature} state → rehydration lost it (or a store write overwrote it after rehydrate)`,
      );
    }
  } else {
    add('P3-2', 'Rehydration check', 'skip', 'No Phase 1 probe items saved — run Phase 1 to seed them.');
  }

  // P3-3 Overwrite detection: native values must not change during unlock/rehydrate
  let changed: SnapshotDiff[] = [];
  if (state) {
    const now = await snapshotMonitoredKeys();
    changed = diffSnapshots(state.afterLogout, now);
    const critical = changed.filter((d) => DATA_STORE_KEYS.includes(d.key) && !POST_UNLOCK_VOLATILE_KEYS.includes(d.key));
    const notable = changed.filter((d) => !critical.includes(d));
    add(
      'P3-3',
      'Unlock/rehydrate does not overwrite native data',
      critical.length === 0 ? 'pass' : 'fail',
      (critical.length
        ? `CRITICAL — data stores overwritten during unlock: ${critical.map((d) => `${d.key}(${d.kind})`).join(', ')}. `
        : '') +
        (notable.length
          ? `changed (expected-rewrite keys): ${notable.map((d) => `${d.key}(${d.kind})`).join(', ')}`
          : critical.length
            ? ''
            : 'no monitored key changed during unlock/rehydration'),
    );
  } else {
    add('P3-3', 'Unlock/rehydrate does not overwrite native data', 'skip', 'No Phase 1 state saved — run Phase 1 first.');
  }

  // P3-4 Live store counts after rehydration must not be lower than what
  // Phase 1 recorded. (Counts may be HIGHER if the user added data since.)
  if (state) {
    const nowCounts = liveCounts();
    const mismatches: string[] = [];
    for (const [k, expected] of Object.entries(state.expectedCounts)) {
      const actual = nowCounts[k as keyof ExpectedCounts];
      if (actual < expected) mismatches.push(`${k}: expected>=${expected}, got ${actual}`);
    }
    add(
      'P3-4',
      'Live store counts after rehydration',
      mismatches.length === 0 ? 'pass' : 'fail',
      (mismatches.length === 0
        ? `no data lost (live >= seeded). `
        : `DATA LOST during lifecycle: ${mismatches.join('; ')}. `) +
        `live=${JSON.stringify(nowCounts)}, seeded=${JSON.stringify(state.expectedCounts)}`,
    );
  } else {
    const counts = liveCounts();
    add('P3-4', 'Live store counts after rehydration', 'pass', `${JSON.stringify(counts)} (no Phase 1 baseline — counts informational only)`);
  }

  await appendDiagStages(stages);
  return phaseResult('Phase 3 — After unlock', new Date().toISOString(), stages, changed);
}

// --- Verdict ------------------------------------------------------------------

/** Maps the first failing stage to its meaning in the failure-point chain. */
const INTERPRETATIONS: Record<string, string> = {
  'P1-1': 'SAVE FAILED: Capacitor Preferences (Android SharedPreferences) refused the write or did not persist it.',
  'P1-2': 'STORAGE ADAPTER FAILED: the app adapter queue/flush path did not reach native storage.',
  'P1-3': 'ENCRYPTION WRITE FAILED (or vault was locked): vaultStorage.setItem could not write encrypted data.',
  'P1-4': 'STORE ACTION FAILED: creating a probe item through a real store action threw.',
  'P1-7': 'LOGOUT LOST DATA: the test value disappeared from native storage during logout.',
  'P1-8': 'LOGOUT MODIFIED DATA: logout changed or purged stored keys — logout is destructive.',
  'P1-9': 'PROBE STATE NOT SAVED: Phases 2/3 will not have expectations to verify.',
  'P2-1': 'NOT RESTARTED: the probe did not detect a fresh app session. Force-close the app completely (swipe away from Recents), reopen it, and run Phase 2 again BEFORE unlocking.',
  'P2-2': 'APP TERMINATION LOST RAW DATA: a value written directly with Preferences.set did not survive — the write never reached disk or app data was cleared.',
  'P2-3': 'RESTART LOST ADAPTER DATA: the adapter-written value vanished while the direct write survived → adapter flush problem before termination.',
  'P2-4': 'RESTART LOST/CHANGED ENCRYPTED BLOB: the encrypted test value did not survive intact.',
  'P2-5': 'VAULT SALT LOST AT RESTART: unlock will generate a NEW salt → the derived key cannot decrypt existing data. This alone explains "all data gone". Failure point: salt persistence / startup hydration.',
  'P2-6': 'MASTER PASSWORD HASH LOST AT RESTART: the app regresses to first-time (CHANGEME) state; unlocking with CHANGEME purges the vault. Failure point: hash persistence / startup hydration.',
  'P2-7': 'RESTART LOST/MODIFIED STORE DATA: an encrypted store blob vanished or changed between logout and reopen — writes never flushed to disk before termination, or something overwrote them.',
  'P2-8': 'STARTUP HYDRATION FAILED: data exists in native storage but the in-memory cache is empty → initStorage() problem at startup.',
  'P3-0': 'VAULT LOCKED DURING PHASE 3: unlock the vault, then re-run Phase 3.',
  'P3-1': 'DECRYPTION FAILED AFTER UNLOCK: the key derived at unlock does not decrypt data saved earlier (salt/key-derivation mismatch). Failure point: encryption/decryption.',
  'P3-2': 'REHYDRATION FAILED: data decrypts from native storage but never reached the live Zustand store. Failure point: rehydrateStores() logic.',
  'P3-3': 'OVERWRITE DETECTED: native data-store content changed during unlock/rehydration — default state is overwriting saved data.',
  'P3-4': 'DATA LOST IN LIFECYCLE: live store counts are lower than what Phase 1 seeded — records vanished between save and rehydration. Cross-check P2-7 (was the blob intact on disk?) to decide between loss-at-rest vs loss-at-rehydrate.',
};

/** Scan the persisted log and return the exact failure point, or next-step guidance. */
export async function getVerdict(): Promise<string> {
  const log = await readDiagLog();
  const firstFail = log.find((s) => s.status === 'fail');
  if (firstFail) {
    const interpretation = INTERPRETATIONS[firstFail.id] ?? 'Unknown failure — inspect the stage detail.';
    return `FAILURE ISOLATED at stage ${firstFail.id} (${firstFail.label}): ${interpretation} — detail: ${firstFail.detail}`;
  }
  const hasPhase1 = log.some((s) => s.id.startsWith('P1-'));
  if (!hasPhase1) return 'Not started. Unlock the vault, open Settings → Diagnostics, and run Phase 1 (Save + Logout).';
  const hasPhase2 = log.some((s) => s.id.startsWith('P2-'));
  const hasPhase3 = log.some((s) => s.id === 'P3-4');
  if (hasPhase3) {
    return 'ALL STAGES PASSED — data survives the full lifecycle (save → logout → restart → unlock → rehydrate).';
  }
  if (hasPhase2) {
    return 'Save/Logout/Restart stages all passed so far. Unlock the vault and run Phase 3 to verify decryption + rehydration.';
  }
  return 'Phase 1 passed. Now COMPLETELY close the app (swipe away from Recents), reopen it, and run Phase 2 BEFORE unlocking.';
}

// --- Storage inspector ----------------------------------------------------------

/** Read every monitored key straight from native storage; decrypt store blobs when possible. */
export async function collectStorageReport(): Promise<StorageRow[]> {
  const rows: StorageRow[] = [];
  const unlocked = isVaultUnlocked();
  for (const key of MONITORED_KEYS) {
    const value = await readNative(key);
    const row: StorageRow = {
      key,
      present: value !== null,
      length: value?.length ?? 0,
      hashPrefix: value ? (await sha256Hex(value)).slice(0, 8) : '',
      decryptable: null,
      items: '',
    };
    if (value && unlocked && DATA_STORE_KEYS.includes(key)) {
      try {
        const plain = await decryptPayload(value);
        const parsed = JSON.parse(plain) as Record<string, unknown>;
        const parts: string[] = [];
        for (const field of ['credentials', 'folders', 'notes', 'tasks', 'records', 'budgets', 'goals', 'activities', 'settings']) {
          const v = parsed[field];
          if (Array.isArray(v)) parts.push(`${field}:${v.length}`);
        }
        row.decryptable = true;
        row.items = parts.join(', ') || 'object';
      } catch {
        row.decryptable = false;
        row.items = 'DECRYPT FAILED';
      }
    }
    rows.push(row);
  }
  return rows;
}







