import { useEffect } from 'react';
import { KeyRound, Copy, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Slider } from '@components/ui/Slider';
import { usePasswordGenerator } from '@hooks/usePasswordGenerator';
import { cn } from '@lib/utils';

export function Generator() {
  const { length, setLength, options, toggle, password, strength, copied, refresh, handleCopy, handleUse } =
    usePasswordGenerator();

  useEffect(() => { refresh(); }, [length, options]); // eslint-disable-line

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cova-primary" />
          Password Generator
        </h1>
        <p className="text-sm text-cova-textMuted mt-1">Create strong, secure passwords in seconds</p>
      </div>

      <div className="card p-6 mb-6">
        <div className="relative mb-4">
          <div
            className="w-full px-4 py-4 bg-cova-bg rounded-xl border border-cova-border text-center font-mono text-xl font-semibold text-cova-text break-all select-all"
            role="status" aria-live="polite" aria-label="Generated password"
          >
            {password}
          </div>
          <div className="absolute right-2 top-2 flex gap-1">
            <button type="button" onClick={handleCopy}
              className={cn('p-2 rounded-lg transition-colors', copied ? 'bg-cova-success text-white' : 'bg-cova-surface border border-cova-border text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text')}
              aria-label="Copy password">
              <Copy className="w-4 h-4" />
            </button>
            <button type="button" onClick={refresh}
              className="p-2 rounded-lg bg-cova-surface border border-cova-border text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors"
              aria-label="Generate new password">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <div className="flex gap-1 mb-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2 flex-1 rounded-full transition-colors duration-300"
                style={{ backgroundColor: i < strength.score ? strength.color : '#1F2232' }} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: strength.color }}>{strength.label}</span>
            <span className="text-xs text-cova-textMuted">{strength.score}/5 strength</span>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6 space-y-6">
        <Slider label="Password Length" value={length} min={8} max={64} step={1} onChange={setLength} />
        <div>
          <h3 className="text-xs font-semibold text-cova-textMuted uppercase tracking-wider mb-3">Character Types</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'uppercase' as const, label: 'Uppercase (A-Z)' },
              { key: 'lowercase' as const, label: 'Lowercase (a-z)' },
              { key: 'numbers' as const, label: 'Numbers (0-9)' },
              { key: 'symbols' as const, label: 'Symbols (!@#)' },
            ]).map(({ key, label }) => (
              <label key={key}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-full border transition-colors cursor-pointer',
                  options[key]
                    ? 'border-cova-primary bg-cova-primaryLight text-cova-primary'
                    : 'border-cova-border hover:border-cova-primary/50 bg-cova-bg text-cova-text'
                )}>
                <input type="checkbox" checked={options[key]} onChange={() => toggle(key)}
                  className="w-4 h-4 rounded border-cova-border bg-cova-input accent-cova-primary" />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <Button variant="primary" size="lg" onClick={handleUse} className="w-full">
        <Plus className="w-4 h-4" /> Use in New Credential
      </Button>
    </div>
  );
}