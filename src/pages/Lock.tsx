import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Fingerprint, Layers } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useUIStore } from '@store';
import { useNavigate } from 'react-router-dom';
import CovaLogo from '@/assets/image/CovaLogo.png';

export function Lock() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'CHANGEME') {
      addToast('First-time access — please set a new password', 'info');
      navigate('/settings');
    } else if (password) {
      addToast('Vault unlocked', 'success');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left: login form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-cova-bg border-r border-cova-border">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <img src={CovaLogo} alt="Cova" className="h-16 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-cova-text text-center mb-2">Welcome to Cova</h1>
            <p className="text-sm text-cova-textSecondary text-center mb-8">Secure your vault to continue.</p>

            <div className="bg-cova-surface rounded-xl border border-cova-border p-6">
              <label className="block text-sm font-medium text-cova-text mb-2">Password</label>

              <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cova-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15V7m0 0l4 4m-4-4l-4 4m0 0H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2h-4z" />
                </svg>
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-form-type="other"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={
                    'w-full pl-10 pr-10 py-2.5 text-sm bg-cova-input border border-cova-inputBorder rounded-lg text-cova-text placeholder-cova-textMuted focus:outline-none focus:border-cova-primary focus:ring-1 focus:ring-cova-primary' +
                    (showPassword ? '' : ' cova-mask')
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cova-textMuted hover:text-cova-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-cova-primary/10 border border-cova-primary/25 mb-6">
                <div className="w-5 h-5 rounded-full bg-cova-primary/25 ring-1 ring-cova-primary/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-cova-primary shadow-[0_0_6px_var(--cova-primary)]" />
                </div>
                <div>
                  <p className="text-sm text-cova-text">
                    First-time access password <span className="text-cova-primary font-semibold">&ldquo;CHANGEME&rdquo;</span>
                  </p>
                  <p className="text-xs text-cova-textMuted mt-1">This temporary password can only be used once.</p>
                </div>
              </div>

              <Button variant="primary" size="lg" className="w-full" onClick={handleSubmit}>Continue &rarr;</Button>

              <div className="text-center mt-4">
                <button type="button" className="text-sm text-cova-textSecondary hover:text-cova-text transition-colors" onClick={() => addToast('Password reset coming soon', 'info')}>Forgot password?</button>
              </div>
            </div>
          </div>
        </div>


        {/* Right: marketing / feature cards */}
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-cova-bg">
          <div className="relative z-10 w-full max-w-lg">
            <h2 className="text-3xl font-bold text-cova-text mb-4">Cova Secure Vault</h2>
            <p className="text-sm text-cova-textSecondary mb-8 max-w-md">Protect your credentials, private information, and everyday essentials from one secure workspace.</p>

            <div className="space-y-4">
              <div className="bg-cova-surface/50 backdrop-blur-sm rounded-xl border border-cova-border p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-cova-primary/20 flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-5 h-5 text-cova-primary" /></div>
                <div><h3 className="text-sm font-semibold text-cova-text mb-1">Secure Vault</h3><p className="text-xs text-cova-textMuted">Keep sensitive credentials and private information protected in one place.</p></div>
              </div>

              <div className="bg-cova-surface/50 backdrop-blur-sm rounded-xl border border-cova-border p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-cova-primary/20 flex items-center justify-center flex-shrink-0"><Fingerprint className="w-5 h-5 text-cova-primary" /></div>
                <div><h3 className="text-sm font-semibold text-cova-text mb-1">Private by Design</h3><p className="text-xs text-cova-textMuted">Your vault stays protected behind your master password.</p></div>
              </div>

              <div className="bg-cova-surface/50 backdrop-blur-sm rounded-xl border border-cova-border p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-cova-primary/20 flex items-center justify-center flex-shrink-0"><Layers className="w-5 h-5 text-cova-primary" /></div>
                <div><h3 className="text-sm font-semibold text-cova-text mb-1">Everything in One Place</h3><p className="text-xs text-cova-textMuted">Credentials, wallet, notes, folders, tasks, and more.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal-style status footer (full width, anchored to the bottom) */}
      <footer
        role="contentinfo"
        className="border-t border-cova-border bg-cova-bg/60 backdrop-blur-sm"
      >
        <div className="px-4 sm:px-8 py-4 text-center select-none">
          <p className="text-[11px] sm:text-xs text-cova-textMuted uppercase tracking-[0.15em]">
            <span className="text-cova-primary font-semibold">[ SYSTEM_STATUS: LOCKED ]</span>
            <span className="mx-2 text-cova-border">|</span>
            <span>root@cova-safevault:~/</span>
            <span className="mx-2 text-cova-border">—</span>
            <span>NO CLOUD. NO BACKDOORS. NO COMPROMISE.</span>
            <span aria-hidden="true" className="cova-cursor" />
          </p>
          <p className="mt-1.5 text-[10px] sm:text-[11px] text-cova-textMuted uppercase tracking-[0.1em]">
            Hand-coded for privacy
          </p>
          <p className="mt-1 text-[10px] sm:text-[11px] text-cova-textMuted tracking-normal">
            © 2026 CovaSafeVault · All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
