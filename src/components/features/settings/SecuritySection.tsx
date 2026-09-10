import { Shield, Clock, Clipboard } from 'lucide-react';
import { Toggle } from '@components/ui/Toggle';
import { useSettingsStore } from '@store';
import { formatDate } from '@lib/utils';

const AUTO_LOCK_OPTIONS = [
  { label: '1 minute', value: 60 * 1000 },
  { label: '5 minutes', value: 5 * 60 * 1000 },
  { label: '15 minutes', value: 15 * 60 * 1000 },
  { label: '30 minutes', value: 30 * 60 * 1000 },
  { label: 'Never', value: 0 },
];

const CLIPBOARD_OPTIONS = [
  { label: '10 seconds', value: 10 * 1000 },
  { label: '30 seconds', value: 30 * 1000 },
  { label: '1 minute', value: 60 * 1000 },
  { label: '5 minutes', value: 5 * 60 * 1000 },
  { label: 'Never', value: 0 },
];

export function SecuritySection() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div id="security" className="card mb-4 overflow-hidden">
      <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
        <Shield className="w-4 h-4 text-cova-textMuted" />
        <h2 className="text-sm font-semibold text-cova-text">Security</h2>
      </div>
      <div className="p-5 space-y-4">
        <Toggle
          checked={settings.autoLock}
          onChange={(v) => updateSettings({ autoLock: v })}
          label="Auto-Lock"
          description="Lock vault after inactivity"
        />

        {settings.autoLock && (
          <div>
            <label className="block text-sm font-medium text-cova-text mb-2">
              <Clock className="w-4 h-4 inline mr-1" /> Auto-Lock Timeout
            </label>
            <select
              value={settings.autoLockTimeout}
              onChange={(e) => updateSettings({ autoLockTimeout: Number(e.target.value) })}
              className="input w-full"
            >
              {AUTO_LOCK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        <Toggle
          checked={settings.showPasswords}
          onChange={(v) => updateSettings({ showPasswords: v })}
          label="Show Passwords"
          description="Display passwords by default in credential list"
        />

        {settings.lastUnlockedAt && (
          <div className="text-xs text-cova-textMuted">
            Last unlocked: {formatDate(settings.lastUnlockedAt)}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-cova-text mb-2">
            <Clipboard className="w-4 h-4 inline mr-1" /> Clipboard Auto-Clear
          </label>
          <select
            value={settings.clipboardClearDelay}
            onChange={(e) => updateSettings({ clipboardClearDelay: Number(e.target.value) })}
            className="input w-full"
          >
            {CLIPBOARD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-cova-textMuted mt-1">
            Sensitive data will be cleared from clipboard after this duration.
          </p>
        </div>

        <Toggle
          checked={settings.twoFactorEnabled}
          onChange={(v) => updateSettings({ twoFactorEnabled: v })}
          label="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
        />
      </div>
    </div>
  );
}
