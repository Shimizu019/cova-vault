import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AccountSection } from '@features/settings/AccountSection';
import { AppearanceSection } from '@features/settings/AppearanceSection';
import { LanguageSection } from '@features/settings/LanguageSection';
import { SecuritySection } from '@features/settings/SecuritySection';
import { DataSection } from '@features/settings/DataSection';

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  account: {
    title: 'Account',
    subtitle: 'Update your profile, avatar, and master password.',
  },
  appearance: {
    title: 'Appearance',
    subtitle: 'Customize the look and feel of Cova.',
  },
  language: {
    title: 'Language',
    subtitle: 'Set your preferred language and region.',
  },
  security: {
    title: 'Security & 2FA',
    subtitle: 'Protect your vault with two-factor authentication.',
  },
  data: {
    title: 'Backup & Export',
    subtitle: 'Manage your encrypted backups and exports.',
  },
};

export function Settings() {
  const location = useLocation();
  const activeSection = useMemo(() => {
    const hash = location.hash.replace('#', '');
    return hash && SECTION_TITLES[hash] ? hash : 'account';
  }, [location.hash]);

  // Scroll the active section into view when the hash changes
  useEffect(() => {
    const el = document.getElementById(activeSection);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection]);

  const meta = SECTION_TITLES[activeSection];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-cova-text">{meta.title}</h1>
          <p className="text-sm text-cova-textMuted mt-1">{meta.subtitle}</p>
        </div>

        {activeSection === 'account' && <AccountSection />}
        {activeSection === 'appearance' && <AppearanceSection />}
        {activeSection === 'language' && <LanguageSection />}
        {activeSection === 'security' && <SecuritySection />}
        {activeSection === 'data' && <DataSection />}
      </div>
    </div>
  );
}