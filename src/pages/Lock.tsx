import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useUIStore } from '@store';
import { useNavigate } from 'react-router-dom';
import { isFirstTime, verify, clearMasterPassword } from '@lib/auth/authStorage';

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
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Show the CHANGEME hint only before the user has set a real master password.
  const [showChangemeHint, setShowChangemeHint] = useState<boolean>(() => isFirstTime());
  useEffect(() => {
    setShowChangemeHint(isFirstTime());
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

    // 1. Validate (spec rule 11). Never submit empty input.
    if (!password) {
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
      ok = await verify(password);
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

    // 4. First-time path: CHANGEME is correct → send the user to Settings
    //    to set a real master password. After that, this branch is
    //    unreachable because the stored hash no longer matches CHANGEME.
    if (showChangemeHint && password === 'CHANGEME') {
      addToast('First-time access — please set a new password', 'info');
      navigate('/settings#security');
      return;
    }

    // 5. Returning user with a correct password → vault.
    setShowChangemeHint(false);
    navigate('/dashboard');
  };

  const handleForgotPassword = () => {
    // Local-only vault: there is no email-based reset. Clearing the
    // stored hash forces the app back into the first-time CHANGEME flow.
    clearMasterPassword();
    setShowChangemeHint(true);
    setAuthError(null);
    setPasswordError(null);
    setPassword('');
    addToast('Master password cleared. Use CHANGEME to set a new one.', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col cova-vault-bg text-cova-text">
      {/* Centered vault card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Cryptographic logo motif + wordmark */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center mb-5"
              role="img"
              aria-label="Cova vault seal: fingerprint inside a cryptographic shield"
            >
              <CovaSeal />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight cova-gradient-text">
              Cova
            </h1>
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
                  placeholder="Enter master password"
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

/**
 * Cryptographic logo motif: a shield silhouette with a stylized fingerprint
 * inside, plus a small key icon at the bottom. Inline SVG so we don't ship a
 * raster asset. The fingerprint "ridges" are concentric arcs that read as
 * biometric data at a glance, and the shield outline evokes a vault door.
 *
 * Sized at 64px and uses currentColor so it inherits the page text color
 * when not inside the gradient wordmark. The outer ring is intentionally
 * thin and monochromatic to fit the brutalist spec.
 */
function CovaSeal() {
  return (
    <svg
      width="64"
      height="72"
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-cova-text"
    >
      {/* Shield outline */}
      <path
        d="M32 2 L60 12 V36 C60 52 48 64 32 70 C16 64 4 52 4 36 V12 Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />
      {/* Inner shield */}
      <path
        d="M32 8 L54 16 V36 C54 49 44 59 32 64 C20 59 10 49 10 36 V16 Z"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />
      {/* Fingerprint arcs (centered around (32, 32)) */}
      <g stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.95">
        <path d="M22 30 C22 24 26 20 32 20 C38 20 42 24 42 30" />
        <path d="M19 33 C19 25 24 17 32 17 C40 17 45 25 45 33" />
        <path d="M24 33 C24 27 27 24 32 24 C37 24 40 27 40 33" />
        <path d="M27 33 C27 30 29 28 32 28 C35 28 37 30 37 33" />
        <path d="M22 36 C22 30 25 28 30 28" />
        <path d="M42 36 C42 30 39 28 34 28" />
        <path d="M32 36 V44" />
        <path d="M28 38 V42" />
        <path d="M36 38 V42" />
      </g>
      {/* Key icon at the base of the shield */}
      <g stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.85">
        <circle cx="32" cy="50" r="2.5" />
        <path d="M34.5 50 L42 50" />
        <path d="M40 50 V52.5" />
        <path d="M42 50 V53.5" />
      </g>
      {/* Corner ticks (anti-tamper reticle) */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.5">
        <path d="M4 12 H1 M4 12 V9" />
        <path d="M60 12 H63 M60 12 V9" />
        <path d="M4 60 H1 M4 60 V63" />
        <path d="M60 60 H63 M60 60 V63" />
      </g>
    </svg>
  );
}
