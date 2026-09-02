import { useState, useEffect, useRef } from 'react';
import { useData } from '@context/DataContext';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Label } from '@components/ui/Input';
import { cn } from '@lib/utils';
import { Lock, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { unlock, hasMasterPassword, setMasterPassword } = useData();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSetup, setIsSetup] = useState(!hasMasterPassword);
  const [confirmPassword, setConfirmPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSetup) {
      if (password.length < 8) {
        setError(true);
        return;
      }
      if (password !== confirmPassword) {
        setError(true);
        return;
      }
      setMasterPassword(password);
      onUnlock();
    } else {
      if (unlock(password)) {
        onUnlock();
      } else {
        setError(true);
        setPassword('');
        setTimeout(() => setError(false), 3000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] dark:bg-[#0a0a0a] z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#111111] dark:bg-[#111111] border border-[#222] dark:border-[#222] rounded-2xl shadow-window-dark p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#1a1a1a] dark:bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
              <Shield className="w-10 h-10 text-[#888]" />
            </div>
            <h1 className="text-2xl font-semibold text-white dark:text-white mb-2 tracking-tight">
              {isSetup ? 'Set Master Password' : 'Keepr'}
            </h1>
            <p className="text-sm text-[#888] dark:text-[#888] font-medium">
              {isSetup 
                ? 'Create a master password to secure your vault' 
                : 'Coded for privacy.'}
            </p>
            {!isSetup && (
              <p className="text-xs text-[#666] dark:text-[#666] mt-3 max-w-xs mx-auto leading-relaxed">
                Your passwords and personal notes stay encrypted, private, and under your control.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="master-password">Master Password</Label>
              <div className="relative mt-2">
                <Input
                  ref={inputRef}
                  id="master-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder={isSetup ? 'Enter master password' : 'Enter master password'}
                  autoComplete={isSetup ? 'new-password' : 'current-password'}
                  className={cn('pr-12 bg-[#1a1a1a] border-[#333] text-white placeholder-[#666] focus:border-[#555]', error && 'border-red-500')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#aaa] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isSetup && (
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(false); }}
                  placeholder="Confirm master password"
                  autoComplete="new-password"
                  className={cn('bg-[#1a1a1a] border-[#333] text-white placeholder-[#666] focus:border-[#555]', error && 'border-red-500')}
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{isSetup ? 'Passwords must match and be at least 8 characters' : 'Incorrect master password'}</span>
              </div>
            )}

            <Button type="submit" className="w-full bg-white hover:bg-[#e5e5e5] text-black font-medium py-3 rounded-lg transition-colors">
              {isSetup ? 'Create & Unlock' : 'Unlock Vault →'}
            </Button>
          </form>

          {!isSetup && (
            <div className="mt-8 text-center space-y-3">
              <p className="text-xs text-[#555]">
                Secured with AES-256 encryption
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-[#444]">
                <Lock className="w-3 h-3" />
                <span>Locked · Local vault · No cloud · No backdoors · Privacy-first</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}