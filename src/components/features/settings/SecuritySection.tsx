import { Shield } from 'lucide-react';
import { Toggle } from '@components/ui/Toggle';
import { useSettingsStore } from '@store';

export function SecuritySection() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div id="2fa" className="card mb-4 overflow-hidden">
      <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
        <Shield className="w-4 h-4 text-cova-textMuted" />
        <h2 className="text-sm font-semibold text-cova-text">Security</h2>
      </div>
      <div className="p-5 space-y-4">
        <Toggle
          checked={settings.twoFactorEnabled}
          onChange={(v) => updateSettings({ twoFactorEnabled: v })}
          label="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
        />
        <Toggle
          checked={settings.autoLock}
          onChange={(v) => updateSettings({ autoLock: v })}
          label="Auto-Lock"
          description="Lock vault when browser tab loses focus"
        />
        <Toggle
          checked={settings.showPasswords}
          onChange={(v) => updateSettings({ showPasswords: v })}
          label="Show Passwords"
          description="Display passwords by default in credential list"
        />
      </div>
    </div>
  );
}