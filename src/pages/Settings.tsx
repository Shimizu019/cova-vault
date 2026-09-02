import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Toggle } from '@components/ui/Toggle';
import { useSettingsStore } from '@store';
import { AccountSection } from '@features/settings/AccountSection';
import { AppearanceSection } from '@features/settings/AppearanceSection';
import { SecuritySection } from '@features/settings/SecuritySection';
import { DataSection } from '@features/settings/DataSection';

export function Settings() {
  const { settings, updateSettings } = useSettingsStore();

  const [profileName] = useState(settings.theme ? 'Cova User' : 'Cova User');
  const [profileEmail, setProfileEmail] = useState('user@cova.app');
  const [profileDisplayName, setProfileDisplayName] = useState('Cova User');

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-cova-text">Settings</h1>
          <p className="text-sm text-cova-textMuted mt-1">Manage your Cova preferences and account</p>
        </div>

        <AccountSection
          profileName={profileName}
          profileEmail={profileEmail}
          profileDisplayName={profileDisplayName}
          onNameChange={() => {}}
          onEmailChange={setProfileEmail}
          onDisplayNameChange={setProfileDisplayName}
        />

        <AppearanceSection />

        <div id="notifications" className="card mb-4 overflow-hidden">
          <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
            <Bell className="w-4 h-4 text-cova-textMuted" />
            <h2 className="text-sm font-semibold text-cova-text">Notifications</h2>
          </div>
          <div className="p-5">
            <Toggle
              checked={settings.notifications}
              onChange={(v) => updateSettings({ notifications: v })}
              label="Push Notifications"
              description="Receive alerts for important vault activity"
            />
          </div>
        </div>

        <SecuritySection />
        <DataSection />
      </div>
    </div>
  );
}