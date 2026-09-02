import { Cloud } from 'lucide-react';
import { useSettingsStore, useUIStore } from '@store';
import { formatDate } from '@lib/utils';

export function BackupBanner() {
  const { settings, updateSettings } = useSettingsStore();
  const { addToast } = useUIStore();

  const handleBackup = () => {
    updateSettings({ backupEnabled: true });
    addToast('Backup scheduled successfully', 'success');
  };

  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 border border-cova-primary/30"
      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)' }}
      role="banner"
      aria-label="Backup status"
    >
      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
        <Cloud className="w-6 h-6 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-white">
          {settings.backupEnabled ? 'Backup Active' : 'No Backup yet'}
        </h3>
        <p className="text-sm text-white/80 mt-0.5">
          {settings.backupEnabled
            ? `Last synced ${formatDate(new Date())}`
            : 'Your Safe Vault only lives on this website.'}
        </p>
      </div>
      <button
        type="button"
        onClick={handleBackup}
        className="px-4 py-2 rounded-lg bg-white text-cova-primary font-semibold text-sm hover:bg-white/90 transition-colors flex-shrink-0"
      >
        {settings.backupEnabled ? 'Backup Now!' : 'Backup Now!'}
      </button>
    </div>
  );
}