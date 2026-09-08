import { Database, Download, Upload, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useCredentialStore, useSettingsStore, useNoteStore, useUIStore, useActivityStore } from '@store';

export function DataSection() {
  const { credentials } = useCredentialStore();
  const { notes } = useNoteStore();
  const { settings, user } = useSettingsStore();
  const { addToast } = useUIStore();

  const handleExport = () => {
    const data = { credentials, notes, settings, user };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cova-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Data exported successfully', 'success');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        addToast(`Imported ${data.credentials?.length ?? 0} credentials`, 'success');
      } catch {
        addToast('Failed to import data', 'error');
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
      localStorage.clear();
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