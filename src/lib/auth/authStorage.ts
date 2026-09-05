// Client-side master password storage for the Cova vault.
//
// Threat model: this app is a local-only vault. The "attacker" we protect
// against is someone reading the raw localStorage JSON in DevTools, not
// someone with the device. We therefore never store the password in plain
// text — we store a SHA-256 digest.
//
// We do NOT claim this is sufficient against a determined attacker with
// file-system or memory access. The CHANGEME onboarding copy makes this
// honest: it's a convenience unlock, not a security boundary.

const STORAGE_KEY = 'cova:master-password-hash';
const LEGACY_FIRST_RUN_KEY = 'cova:master-password-initialized';
// Permanent flag: set to '1' the first time CHANGEME is successfully used.
// Unlike the other keys, this is NEVER cleared — not even by clearMasterPassword().
// Once CHANGEME has been used once on this device, it can never be used again.
const CHANGEME_USED_KEY = 'cova:changeme-used';

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
  return !!localStorage.getItem(STORAGE_KEY);
}

/** Returns true if the user has not yet set a real master password.
 *  In that state, the only accepted value is `CHANGEME`. */
export function isFirstTime(): boolean {
  return !isInitialized();
}

const FIRST_TIME_PASSWORD = 'CHANGEME';

/** Verify a candidate password against the stored master.
 *  Resolves to `true` if it matches, `false` otherwise.
 *  On first run, `CHANGEME` is accepted once - permanently. */
export async function verify(candidate: string): Promise<boolean> {
  if (!candidate) return false;
  if (isFirstTime()) {
    // CHANGEME_USED_KEY is a permanent flag that survives clearMasterPassword().
    // Once CHANGEME has been used once on this device it can never re-open
    // the vault after a password reset.  BUT: if the user explicitly set
    // their password to CHANGEME in Settings, the stored hash matches the
    // CHANGEME digest - in that case it's their legitimate chosen password,
    // not the default placeholder, so we let it through.
    if (candidate === FIRST_TIME_PASSWORD) {
      if (localStorage.getItem(CHANGEME_USED_KEY)) {
        const storedHash = localStorage.getItem(STORAGE_KEY);
        if (storedHash) {
          const changemeHash = await sha256(FIRST_TIME_PASSWORD);
          if (storedHash === changemeHash) return true; // chosen password
        }
        return false;
      }
      localStorage.setItem(CHANGEME_USED_KEY, '1');
      return true;
    }
    return false;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  const candidateHash = await sha256(candidate);
  // Length + constant-ish compare. For a local vault this is honest.
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
  localStorage.setItem(STORAGE_KEY, hash);
  // Mark that we've been initialized so the CHANGEME card can hide itself.
  localStorage.setItem(LEGACY_FIRST_RUN_KEY, '1');
}

/** Forget the master password. Used by the "Forgot password?" flow. */
export function clearMasterPassword(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_FIRST_RUN_KEY);
}

export const __test__ = { FIRST_TIME_PASSWORD, sha256 };
