import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useUIStore, useSettingsStore, useCredentialStore, useNoteStore, useTaskStore, useWalletStore, useSavingsStore, useActivityStore } from '@store';
import { useNavigate } from 'react-router-dom';
import { isFirstTime, verify, clearMasterPassword, onMasterPasswordChange } from '@lib/auth/authStorage';
import { deriveKey, setVaultKey, getOrCreateVaultSalt, purgeVaultData, vaultStorage } from '@lib/crypto/vaultStorage';
import CovaLogo from '@/assets/image/CovaLogo.png';

const PASSWORD_INPUT_ID = 'cova-lock-password';
const PASSWORD_ERROR_ID = 'cova-lock-password-error';

// Minimum time the loading state stays visible, so the spinner doesn't
// flash so fast that the user can't tell anything happened.
const MIN_LOADING_MS = 350;

export function Lock() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useUIStore();
  const { updateSettings } = useSettingsStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [firstTime, setFirstTime] = useState(isFirstTime());
  const [showChangemeHint, setShowChangemeHint] = useState<boolean>(firstTime);

  useEffect(() => {
    setShowChangemeHint(firstTime);
  }, [firstTime]);

  // React to password changes in other tabs/windows so the Lock screen
  // updates immediately without requiring a manual refresh.
  useEffect(() => {
    return onMasterPasswordChange(setFirstTime);
  }, []);

  // The error that should be displayed below the input (if any).
  // Validation errors take priority over authentication errors so the
  // user sees the most actionable message first.
  const visibleError = passwordError ?? authError;
  const hasError = !!visibleError;

  // Clear stale errors as soon as the user starts editing — spec rule 10.
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError(null);
    if (authError) setAuthError(null);
  };

  // Focus the first invalid field for keyboard / a11y users.
  useEffect(() => {
    if (visibleError && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visibleError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // guard against rapid double-submits

    // Trim whitespace so accidental leading/trailing spaces from copy-paste
    // or autofill don't silently fail the comparison. We do NOT lowercase
    // — passwords are case-sensitive by design.
    const submitted = password.trim();

    // 1. Validate (spec rule 11). Never submit empty input.
    if (!submitted) {
      setPasswordError('Password is required');
      setAuthError(null);
      return;
    }

    // 2. Attempt authentication.
    setPasswordError(null);
    setAuthError(null);
    setIsSubmitting(true);

    const start = Date.now();
    let ok = false;
    try {
      ok = await verify(submitted);
    } catch {
      // We never want to leak the underlying error to the user.
      ok = false;
    }

    // Keep the loading state visible for at least MIN_LOADING_MS so the
    // "Signing in…" affordance is perceivable, even on a fast machine.
    const elapsed = Date.now() - start;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
    }

    setIsSubmitting(false);

    if (!ok) {
      // 3. Generic, safe error. Do not reveal whether the password is
      //    wrong, whether the account exists, or anything about the
      //    internal auth flow (spec rules 5, 6, 13).
      setAuthError('Incorrect master password');
      return;
    }

    // 4. First-time path: CHANGEME is correct → clear any stale encrypted data,
    //    reload the app so stores initialize cleanly with the new vault key,
    //    then send the user to Settings to set a real master password.
    if (showChangemeHint && submitted === 'CHANGEME') {
      try {
        purgeVaultData();
        const salt = await getOrCreateVaultSalt();
        const { key } = await deriveKey(submitted, salt);
        setVaultKey(key);
        updateSettings({ lastUnlockedAt: new Date().toISOString() });
        addToast('First-time access — please set a new password', 'info');
        setTimeout(() => {
          navigate('/settings#security');
        }, 50);
      } catch {
        setAuthError('Could not unlock vault');
      }
      return;
    }

    // 5. Returning user with a correct password → vault.
    try {
      const salt = await getOrCreateVaultSalt();
      const { key } = await deriveKey(submitted, salt);
      setVaultKey(key);
      updateSettings({ lastUnlockedAt: new Date().toISOString() });
    } catch {
      setAuthError('Could not unlock vault');
      return;
    }

    // 6. Force encrypted stores to re-hydrate from localStorage now that
    //    the vault key is available. They were initialized while locked,
    //    so their in-memory state is still empty.
    const storeKeys: Record<string, any> = {
      'cova-credential-store': useCredentialStore,
      'cova-note-store': useNoteStore,
      'cova-task-store': useTaskStore,
      'cova-wallet-store': useWalletStore,
      'cova-savings-store': useSavingsStore,
      'cova-activity-store': useActivityStore,
      'cova-settings-store': useSettingsStore,
      'cova-ui-store': useUIStore,
    };

    for (const [key, store] of Object.entries(storeKeys)) {
      try {
        const decrypted = await vaultStorage.getItem(key);
        if (!decrypted) continue;
        const parsed = JSON.parse(decrypted);
        if (parsed && typeof parsed === 'object') {
          store.setState(parsed.state ?? parsed);
        }
      } catch {
        // skip corrupted store entries
      }
    }

    // 7. Returning user with a correct password → vault.
    setShowChangemeHint(false);
    navigate('/dashboard');
  };

  const handleForgotPassword = () => {
    const ok = window.confirm(
      'Reset vault?\n\n' +
        'This will permanently delete all encrypted vault data (credentials, notes, wallet, etc.) ' +
        'and reset the master password to "CHANGEME".\n\n' +
        'This action cannot be undone. Continue?'
    );
    if (!ok) return;

    clearMasterPassword();
    setVaultKey(null);
    purgeVaultData();
    setFirstTime(true);
    setShowChangemeHint(true);
    setAuthError(null);
    setPasswordError(null);
    setPassword('');
    addToast(
      'Vault reset complete. Use CHANGEME to sign in, then set a new password in Settings.',
      'info'
    );
  };

  return (
    <div className="min-h-screen flex flex-col cova-vault-bg text-cova-text">
      {/* Centered vault card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Wordmark logo — uses the same CovaLogo.png asset the sidebar
              renders, so the brand mark is consistent across the app. */}
          <div className="text-center mb-6">
            <img
              src={CovaLogo}
              alt="Cova"
              className="inline-block h-12 sm:h-14 w-auto mb-5 select-none"
              draggable={false}
            />
            <p className="mt-2 text-[13px] sm:text-sm text-cova-textMuted max-w-sm mx-auto leading-relaxed">
              Coded for privacy. Your credentials remain encrypted, local, and fully under your control.
            </p>
          </div>

          {/* Vault frame: brutalist card with corner brackets */}
          <div className="relative cova-vault-frame cova-corner-brackets rounded-lg p-6 sm:p-7">
            <span className="cova-cb-bl" aria-hidden="true" />
            <span className="cova-cb-br" aria-hidden="true" />

            <form
              noValidate
              onSubmit={handleSubmit}
              aria-label="Unlock vault"
            >
              {/* Section label, monospaced, for the cryptographic vibe */}
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor={PASSWORD_INPUT_ID}
                  className="block text-[11px] cova-mono uppercase tracking-[0.2em] text-cova-textMuted"
                >
                  Master Password
                </label>
                <span className="text-[10px] cova-mono uppercase tracking-[0.15em] text-cova-textMuted/70">
                  required
                </span>
              </div>

              <div className="relative">
                <input
                  ref={inputRef}
                  id={PASSWORD_INPUT_ID}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-form-type="other"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder={firstTime ? 'CHANGEME' : 'Enter master password'}
                  disabled={isSubmitting}
                  aria-invalid={hasError || undefined}
                  aria-describedby={hasError ? PASSWORD_ERROR_ID : undefined}
                  aria-label="Master password"
                  className={
                    'w-full pl-3 pr-10 py-2.5 text-sm bg-transparent border rounded-md text-cova-text placeholder-cova-textMuted/60 focus:outline-none focus:ring-1 transition-colors ' +
                    (hasError
                      ? 'border-cova-danger focus:border-cova-danger focus:ring-cova-danger '
                      : 'border-white/15 hover:border-white/25 focus:border-white/50 focus:ring-white/30 ') +
                    (isSubmitting ? 'opacity-60 cursor-not-allowed ' : '') +
                    (showPassword ? '' : 'cova-mask')
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cova-textMuted hover:text-cova-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Validation / auth error message. */}
              <div
                id={PASSWORD_ERROR_ID}
                role={hasError ? 'alert' : undefined}
                aria-live="polite"
                className={
                  'flex items-center gap-1.5 mt-2 text-[11px] cova-mono uppercase tracking-[0.08em] text-cova-danger transition-opacity ' +
                  (hasError ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 mt-0')
                }
              >
                {hasError && (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    <span>! {visibleError}</span>
                  </>
                )}
              </div>

              {/* First-time CHANGEME hint — monochrome variant */}
              {showChangemeHint && (
                <div className="mt-5 flex items-start gap-3 p-3 border border-white/10 bg-white/[0.02] rounded-md">
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5 border border-white/30 rounded-sm flex items-center justify-center">
                    <span className="text-[10px] cova-mono text-cova-textMuted">i</span>
                  </div>
                  <div>
                    <p className="text-[12px] cova-mono uppercase tracking-[0.08em] text-cova-text">
                      First-time access password <span className="text-cova-text font-semibold">&ldquo;CHANGEME&rdquo;</span>
                    </p>
                    <p className="text-[11px] text-cova-textMuted mt-1 leading-relaxed">
                      This temporary password can only be used once. Set a new master password in Settings after first unlock.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary CTA with the gradient. Native <button> so the
                  gradient background can be applied directly, instead of
                  the shared Button component (which uses a flat color). */}
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting || undefined}
                className={
                  'mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-md text-white cova-gradient-bg ' +
                  'shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_24px_-8px_rgba(139,92,246,0.5)] ' +
                  'hover:brightness-110 active:brightness-95 transition ' +
                  'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100'
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span className="cova-mono uppercase tracking-[0.15em] text-[12px]">
                      Unlocking…
                    </span>
                  </>
                ) : (
                  <span className="cova-mono uppercase tracking-[0.15em] text-[12px]">
                    Unlock Vault
                  </span>
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  className="text-[11px] cova-mono uppercase tracking-[0.1em] text-cova-textMuted hover:text-cova-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Persistent terminal-style status footer. Gradient frame above matches CTA. */}
      <footer
        role="contentinfo"
        className="border-t border-white/5 bg-black/40 backdrop-blur-sm"
      >
        <div className="px-4 sm:px-8 py-3.5 text-center select-none">
          <p className="text-[11px] sm:text-[12px] cova-mono text-cova-textMuted">
            <span className="text-cova-text font-semibold">[ SYSTEM_STATUS: LOCKED ]</span>
            <span className="mx-2 text-white/20">│</span>
            <span className="tracking-[0.05em]">AES-256 · Local-only · No cloud sync</span>
            <span aria-hidden="true" className="cova-cursor text-cova-text" />
          </p>
          <p className="mt-1.5 text-[10px] sm:text-[11px] cova-mono uppercase tracking-[0.18em] text-cova-textMuted/70">
            Hand-coded for privacy
          </p>
        </div>
      </footer>
    </div>
  );
}
