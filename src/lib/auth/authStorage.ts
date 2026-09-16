import { getStorage } from '../storage/storage';

const storage = getStorage();

const STORAGE_KEY = 'cova:master-password-hash';
const LEGACY_FIRST_RUN_KEY = 'cova:master-password-initialized';

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Returns true if the user has already set a real master password
 *  (i.e. they have used CHANGEME and chosen a new one in Settings). */
export function isInitialized(): boolean {
   return !!storage.getItem(STORAGE_KEY);
}

/** Returns true if the user has not yet set a real master password.
 *  In that state, the only accepted value is `CHANGEME`. */
export function isFirstTime(): boolean {
  return !isInitialized();
}

const FIRST_TIME_PASSWORD = 'CHANGEME';

/** Verify a candidate password against the stored master.
 *  Resolves to `true` if it matches, `false` otherwise.
 *
 *  Rules:
 *    1. On first run (no stored hash), `CHANGEME` is accepted.
 *    2. If the user explicitly chose `CHANGEME` as their real password
 *       in Settings (the stored hash equals sha256('CHANGEME')), that
 *       is their legitimate password and is accepted.
 *    3. Otherwise, the candidate is hashed and compared against the
 *       stored hash. */
export async function verify(candidate: string): Promise<boolean> {
  if (!candidate) return false;

  const stored = storage.getItem(STORAGE_KEY);

  // No stored hash → first run. CHANGEME is the only accepted value.
  if (!stored) {
    return candidate === FIRST_TIME_PASSWORD;
  }

  // Stored hash present. Compare against it. If the user happens to have
  // chosen CHANGEME as their real password, the stored hash is exactly
  // sha256('CHANGEME'), so the same hash comparison will succeed.
  const candidateHash = await sha256(candidate);
  if (candidateHash.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < candidateHash.length; i++) {
    diff |= candidateHash.charCodeAt(i) ^ stored.charCodeAt(i);
  }
  return diff === 0;
}

/** Persist a new master password. Overwrites any previous value. */
export async function setMasterPassword(newPassword: string): Promise<void> {
  const hash = await sha256(newPassword);
   storage.setItem(STORAGE_KEY, hash);
   // Mark that we've been initialized so the CHANGEME card can hide itself.
   storage.setItem(LEGACY_FIRST_RUN_KEY, '1');
}

/** Forget the master password. Used by the "Forgot password?" flow.
 *  After clearing, the next unlock must use `CHANGEME` (first-run
 *  state is restored). */
export function clearMasterPassword(): void {
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_FIRST_RUN_KEY);
}

/** Listen for changes to the master-password hash in other tabs/windows.
 *  Returns an unsubscribe function. */
export function onMasterPasswordChange(callback: (isFirstTimeNow: boolean) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(!e.newValue);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export const __test__ = { FIRST_TIME_PASSWORD, sha256 };
