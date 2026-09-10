import { Database, Download, Upload, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useCredentialStore, useSettingsStore, useNoteStore, useUIStore, useActivityStore, useTaskStore, useWalletStore, useSavingsStore } from '@store';
import { setVaultKey } from '@lib/crypto/vaultStorage';
import { exportEncryptedBackup, importEncryptedBackup } from '@lib/crypto/backup';
import { purgeVaultData } from '@lib/crypto/vaultStorage';

export function DataSection() {
  const { credentials } = useCredentialStore();
  const { notes } = useNoteStore();
  const { addToast } = useUIStore();

  const handleExport = async () => {
    const data = {
      credentials: useCredentialStore.getState().credentials,
      folders: useCredentialStore.getState().folders,
      notes: useNoteStore.getState().notes,
      tasks: useTaskStore.getState().tasks,
      wallet: {
        records: useWalletStore.getState().records,
        startingBalance: useWalletStore.getState().startingBalance,
        budgets: useWalletStore.getState().budgets,
      },
      savings: useSavingsStore.getState().goals,
      activities: useActivityStore.getState().activities,
      settings: useSettingsStore.getState().settings,
      user: useSettingsStore.getState().user,
    };
    await exportEncryptedBackup(data);
    addToast('Encrypted backup exported', 'success');
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = await importEncryptedBackup(file) as {
          credentials?: any[];
          folders?: any[];
          notes?: any[];
          tasks?: any[];
          wallet?: { records?: any[]; startingBalance?: number; budgets?: any[] };
          savings?: any[];
          activities?: any[];
          settings?: any;
          user?: any;
        };
        
        if (data.credentials) useCredentialStore.setState({ credentials: data.credentials });
        if (data.folders) useCredentialStore.setState({ folders: data.folders });
        if (data.notes) useNoteStore.setState({ notes: data.notes });
        if (data.tasks) useTaskStore.setState({ tasks: data.tasks });
        if (data.wallet) {
          useWalletStore.setState({ 
            records: data.wallet.records || [],
            startingBalance: data.wallet.startingBalance ?? 0,
            budgets: data.wallet.budgets || [],
          });
        }
        if (data.savings) useSavingsStore.setState({ goals: data.savings });
        if (data.activities) useActivityStore.setState({ activities: data.activities });
        if (data.settings) useSettingsStore.setState({ settings: data.settings });
        if (data.user) useSettingsStore.setState({ user: data.user });
        
        addToast('Encrypted backup imported successfully', 'success');
      } catch {
        addToast('Failed to import backup. Make sure it was exported from this vault and the vault is unlocked.', 'error');
      }
    };
    input.click();
  };

  const handleClearActivities = () => {
    if (confirm('Clear all activity logs? This cannot be undone.')) {
      const { clearActivities } = useActivityStore.getState();
      clearActivities();
      addToast('All activities cleared', 'info');
    }
  };

  const handleDeleteAll = () => {
    if (confirm('Delete ALL data? This cannot be undone.')) {
      setVaultKey(null);
      purgeVaultData();
      useCredentialStore.getState().credentials = [];
      useCredentialStore.getState().folders = [];
      useNoteStore.getState().notes = [];
      useNoteStore.getState().folders = [];
      useTaskStore.getState().tasks = [];
      useTaskStore.getState().folders = [];
      useWalletStore.getState().records = [];
      useWalletStore.getState().budgets = [];
      useWalletStore.getState().startingBalance = 0;
      useSavingsStore.getState().goals = [];
      useActivityStore.getState().activities = [];
      useSettingsStore.getState().user = {
        id: 'user-1',
        name: 'Cova User',
        displayName: 'Cova User',
        email: 'user@cova.app',
        avatarInitial: 'CU',
        createdAt: new Date().toISOString(),
      };
      window.location.reload();
    }
  };

  return (
    <>
      <div id="backup" className="card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
          <Database className="w-4 h-4 text-cova-textMuted" />
          <h2 className="text-sm font-semibold text-cova-text">Data</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cova-text">Export Data</p>
              <p className="text-xs text-cova-textMuted mt-0.5">Download all your data as JSON</p>
            </div>
            <Button variant="secondary" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cova-text">Import Data</p>
              <p className="text-xs text-cova-textMuted mt-0.5">Restore from a Cova backup file</p>
            </div>
            <Button variant="secondary" onClick={handleImport}><Upload className="w-4 h-4" /> Import</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cova-text">Storage Usage</p>
              <p className="text-xs text-cova-textMuted mt-0.5">{credentials.length} credentials · {notes.length} notes</p>
            </div>
            <span className="text-xs text-cova-textMuted">Local Storage</span>
          </div>
        </div>
      </div>

      <div id="clear-activities" className="card overflow-hidden border-cova-danger/50">
        <div className="px-5 py-4 border-b border-cova-border/50 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-cova-danger" />
          <h2 className="text-sm font-semibold text-cova-danger">Danger Zone</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cova-text">Clear All Activities</p>
              <p className="text-xs text-cova-textMuted mt-0.5">Remove all activity log entries</p>
            </div>
            <Button variant="danger" onClick={handleClearActivities}>Clear Activities</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cova-text">Delete All Data</p>
              <p className="text-xs text-cova-textMuted mt-0.5">Permanently remove all vault data</p>
            </div>
            <Button variant="danger" onClick={handleDeleteAll}>Delete All Data</Button>
          </div>
        </div>
      </div>
    </>
  );
}