import { useSettingsStore } from '@store';
import { AccountSection } from '@features/settings/AccountSection';
import { AppearanceSection } from '@features/settings/AppearanceSection';
import { LanguageSection } from '@features/settings/LanguageSection';
import { SecuritySection } from '@features/settings/SecuritySection';
import { DataSection } from '@features/settings/DataSection';

export function Settings() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-cova-text">Settings</h1>
          <p className="text-sm text-cova-textMuted mt-1">Manage your Cova preferences and account</p>
        </div>

        <AccountSection />
        <AppearanceSection />
        <LanguageSection />
        <SecuritySection />
        <DataSection />
      </div>
    </div>
  );
}