import { useState } from 'react';
import { Folder as FolderIcon, Plus, Trash2, Pencil, FolderOpen } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input, Label } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { EmptyState } from '@components/ui/Card';
import { useCredentialStore, useNoteStore, useUIStore } from '@store';
import { generateId } from '@lib/utils';
import type { Folder } from '@lib/types';

export function Folders() {
  const { credentials } = useCredentialStore();
  const { notes } = useNoteStore();
  const { addToast } = useUIStore();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState<Folder | null>(null);

  const openNew = () => { setEditing(null); setDraftName(''); setIsModalOpen(true); };
  const openEdit = (f: Folder) => { setEditing(f); setDraftName(f.name); setIsModalOpen(true); };

  const handleSave = () => {
    if (!draftName.trim()) { addToast('Folder name is required', 'error'); return; }
    if (editing) {
      setFolders((prev) => prev.map((f) => f.id === editing.id ? { ...f, name: draftName.trim() } : f));
      addToast('Folder renamed', 'success');
    } else {
      setFolders((prev) => [...prev, { id: generateId(), name: draftName.trim(), type: 'mixed', createdAt: new Date().toISOString() }]);
      addToast('Folder created', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (f: Folder) => {
    if (confirm(`Delete folder "${f.name}"? Items inside will not be deleted.`)) {
      setFolders((prev) => prev.filter((x) => x.id !== f.id));
      addToast('Folder deleted', 'info');
    }
  };

  const credCount = (id: string) => credentials.filter((c) => c.folderId === id).length;
  const noteCount = (id: string) => notes.filter((n) => n.folderId === id).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-cova-primary" aria-hidden="true" />
            Folders
            <span className="ml-2 px-2 py-0.5 rounded-full bg-cova-surface border border-cova-border text-xs font-medium text-cova-textMuted">{folders.length}</span>
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Organize your credentials and notes into folders</p>
        </div>
        <Button variant="primary" onClick={openNew}><Plus className="w-4 h-4" /> New Folder</Button>
      </div>

      {folders.length === 0 ? (
        <div className="card p-8"><EmptyState icon={<FolderIcon className="w-16 h-16 text-cova-textMuted" />} title="No folders yet" description="Create folders to organize your credentials and notes." action={<Button variant="primary" onClick={openNew}><Plus className="w-4 h-4" /> Create folder</Button>} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((f) => (
            <div key={f.id} className="card px-5 py-4 flex items-center gap-3 hover:bg-cova-surfaceHover transition-colors group">
              <FolderOpen className="w-8 h-8 text-cova-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-cova-text truncate">{f.name}</p>
                <p className="text-xs text-cova-textMuted">{credCount(f.id)} credentials &middot; {noteCount(f.id)} notes</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => openEdit(f)} className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surface hover:text-cova-text transition-colors" aria-label="Rename folder"><Pencil className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => handleDelete(f)} className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-danger/10 hover:text-cova-danger transition-colors" aria-label="Delete folder"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Rename folder' : 'New folder'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSave}>{editing ? 'Save' : 'Create'}</Button></>}>
        <div>
          <Label htmlFor="folder-name" required>Folder name</Label>
          <Input id="folder-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Work accounts" autoFocus />
        </div>
      </Modal>
    </div>
  );
}