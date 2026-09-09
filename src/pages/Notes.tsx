import { useState, useMemo } from 'react';
import { FileText, Plus, Search, Star, MoreVertical, Trash2, Pencil, Eye, StickyNote } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input, Label } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { Dropdown } from '@components/ui/Dropdown';
import { EmptyState } from '@components/ui/Card';
import { useNoteStore, useUIStore } from '@store';
import type { Note, Folder } from '@lib/types';
import { formatDate } from '@lib/utils';

export function Notes() {
  const { notes, folders, addFolder, renameFolder, deleteFolder, moveNoteToFolder, addNote, updateNote, deleteNote, toggleFavorite } = useNoteStore();
  const { addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [viewing, setViewing] = useState<Note | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftFolderId, setDraftFolderId] = useState<string | undefined>(undefined);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderDraftName, setFolderDraftName] = useState('');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return notes.filter((n) => {
      const matchQ = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      const matchFav = !showFavorites || n.favorite;
      return matchQ && matchFav;
    });
  }, [notes, search, showFavorites]);

  const openNew = () => {
    setEditing(null);
    setDraftTitle('');
    setDraftContent('');
    setDraftFolderId(undefined);
    setIsModalOpen(true);
  };

  const openEdit = (n: Note) => {
    setEditing(n);
    setDraftTitle(n.title);
    setDraftContent(n.content);
    setDraftFolderId(n.folderId);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!draftTitle.trim()) {
      addToast('Title is required', 'error');
      return;
    }
    if (editing) {
      updateNote(editing.id, { title: draftTitle.trim(), content: draftContent, folderId: draftFolderId });
      addToast('Note updated', 'success');
    } else {
      addNote({ title: draftTitle.trim(), content: draftContent, favorite: false, folderId: draftFolderId });
      addToast('Note created', 'success');
    }
    setIsModalOpen(false);
  };

  const handleMoveToFolder = (note: Note, folderId: string | undefined) => {
    moveNoteToFolder(note.id, folderId);
    const target = folderId ? folders.find((f) => f.id === folderId)?.name : 'No Folder';
    addToast(`Moved to ${target || 'No Folder'}`, 'success');
  };

  const handleDelete = (n: Note) => {
    if (confirm(`Delete "${n.title}"? This cannot be undone.`)) {
      deleteNote(n.id);
      addToast('Note deleted', 'info');
    }
  };

  const handleFolderSave = () => {
    if (!folderDraftName.trim()) { addToast('Folder name is required', 'error'); return; }
    if (editingFolder) {
      renameFolder(editingFolder.id, folderDraftName.trim());
      addToast('Folder renamed', 'success');
    } else {
      addFolder(folderDraftName.trim());
      addToast('Folder created', 'success');
    }
    setFolderModalOpen(false);
    setFolderDraftName('');
    setEditingFolder(null);
  };

  const handleFolderDelete = (f: Folder) => {
    if (confirm(`Delete folder "${f.name}"? Notes inside will be moved to No Folder.`)) {
      deleteFolder(f.id);
      addToast('Folder deleted', 'info');
    }
  };

  const openNewFolder = () => {
    setEditingFolder(null);
    setFolderDraftName('');
    setFolderModalOpen(true);
  };

  const openEditFolder = (f: Folder) => {
    setEditingFolder(f);
    setFolderDraftName(f.name);
    setFolderModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <FileText className="w-5 h-5 text-cova-success" aria-hidden="true" />
            Notes
            <span className="ml-2 px-2 py-0.5 rounded-full bg-cova-surface border border-cova-border text-xs font-medium text-cova-textMuted">{notes.length}</span>
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Keep your private thoughts and snippets safe</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={showFavorites ? 'primary' : 'secondary'} onClick={() => setShowFavorites((v) => !v)} aria-pressed={showFavorites}>
            <Star className={'w-4 h-4 ' + (showFavorites ? 'fill-cova-warning text-cova-warning' : '')} />
            Favorites
          </Button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cova-textMuted pointer-events-none" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="input pl-9 pr-3 w-full" aria-label="Search notes" />
          </div>
          <Button variant="primary" onClick={openNew}><Plus className="w-4 h-4" /> New Note</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<StickyNote className="w-16 h-16 text-cova-textMuted" />}
            title={showFavorites ? 'No favorite notes' : 'No notes yet'}
            description={showFavorites ? 'Tap the star on any note to favorite it.' : 'Capture your private thoughts, ideas, and snippets.'}
            action={!showFavorites ? <Button variant="primary" onClick={openNew}><Plus className="w-4 h-4" /> Create note</Button> : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n) => (
            <div key={n.id} className="card p-5 flex flex-col gap-3 hover:bg-cova-surfaceHover transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-cova-text truncate flex-1">{n.title}</h3>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => toggleFavorite(n.id)} className="p-1 rounded text-cova-textSecondary hover:text-cova-warning transition-colors flex-shrink-0" aria-label={n.favorite ? 'Unfavorite' : 'Favorite'}>
                    <Star className={'w-4 h-4 ' + (n.favorite ? 'fill-cova-warning text-cova-warning' : '')} />
                  </button>
                  <Dropdown
                    align="right"
                    trigger={
                      <button type="button" className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surface hover:text-cova-text transition-colors" aria-label="More actions">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    }
                    items={[
                      { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: () => openEdit(n) },
                      { label: 'View', icon: <Eye className="w-3.5 h-3.5" />, onClick: () => setViewing(n) },
                      { label: n.folderId ? 'Unassign folder' : 'Assign folder', icon: <FileText className="w-3.5 h-3.5" />, onClick: () => handleMoveToFolder(n, n.folderId ? undefined : folders[0]?.id) },
                      ...folders.filter((f) => f.id !== n.folderId).slice(0, 4).map((f) => ({ label: 'Move to ' + f.name, onClick: () => handleMoveToFolder(n, f.id) })),
                      { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => handleDelete(n), danger: true },
                    ]}
                  />
                </div>
              </div>
              <p className="text-sm text-cova-textSecondary line-clamp-4 whitespace-pre-wrap break-words">
                {n.content || <span className="italic text-cova-textMuted">Empty note</span>}
              </p>
              <div className="flex items-center justify-between pt-2 mt-auto border-t border-cova-border/50">
                <span className="text-xs text-cova-textMuted">{formatDate(n.updatedAt)}</span>
                {n.folderId && folders.find((f) => f.id === n.folderId) && (
                  <span className="px-2 py-0.5 rounded bg-cova-primary/15 text-cova-primary text-xs font-medium">{folders.find((f) => f.id === n.folderId)?.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit note' : 'New note'} size="lg" footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSave}>{editing ? 'Save changes' : 'Create note'}</Button></>}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="note-title" required>Title</Label>
            <Input id="note-title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="e.g. Bank PIN recovery" autoFocus />
          </div>
          <div>
            <Label htmlFor="note-content">Content</Label>
            <textarea id="note-content" value={draftContent} onChange={(e) => setDraftContent(e.target.value)} placeholder="Write your note here..." className="input min-h-[180px] resize-y font-sans" />
          </div>
          <div>
            <Label htmlFor="note-folder">Folder</Label>
            <select id="note-folder" value={draftFolderId || ''} onChange={(e) => setDraftFolderId(e.target.value || undefined)} className="input w-full">
              <option value="">No Folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button type="button" onClick={openNewFolder} className="mt-2 text-xs text-cova-primary hover:text-cova-primaryHover transition-colors">+ New folder</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={viewing?.title || ''} size="lg" footer={<><Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>{viewing && <Button variant="primary" onClick={() => { openEdit(viewing); setViewing(null); }}><Pencil className="w-4 h-4" /> Edit</Button>}</>}>
        {viewing && (
          <div className="space-y-3">
            <p className="text-xs text-cova-textMuted">Last updated {formatDate(viewing.updatedAt)}</p>
            {viewing.folderId && folders.find((f) => f.id === viewing.folderId) && (
              <p className="text-xs text-cova-primary">Folder: {folders.find((f) => f.id === viewing.folderId)?.name}</p>
            )}
            <p className="text-sm text-cova-text whitespace-pre-wrap break-words">{viewing.content || <span className="italic text-cova-textMuted">Empty note</span>}</p>
          </div>
        )}
      </Modal>

      <Modal isOpen={folderModalOpen} onClose={() => { setFolderModalOpen(false); setFolderDraftName(''); setEditingFolder(null); }} title={editingFolder ? "Rename folder" : "New folder"} footer={<><Button variant="secondary" onClick={() => { setFolderModalOpen(false); setFolderDraftName(''); setEditingFolder(null); }}>Cancel</Button><Button variant="primary" onClick={handleFolderSave}>{editingFolder ? "Save" : "Create"}</Button></>}>
        <div>
          <Label htmlFor="folder-name" required>Folder name</Label>
          <Input id="folder-name" value={folderDraftName} onChange={(e) => setFolderDraftName(e.target.value)} placeholder="e.g. Personal" autoFocus />
        </div>
      </Modal>

      {/* Manage Folders Section */}
      {folders.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-cova-textMuted uppercase tracking-wider">Folders</h2>
            <button type="button" onClick={openNewFolder} className="text-xs text-cova-primary hover:text-cova-primaryHover transition-colors">+ New folder</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {folders.map((f) => (
              <div key={f.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cova-surface border border-cova-border">
                <span className="text-sm text-cova-text">{f.name}</span>
                <button type="button" onClick={() => openEditFolder(f)} className="p-0.5 rounded text-cova-textSecondary hover:text-cova-text transition-colors" aria-label="Rename folder"><Pencil className="w-3 h-3" /></button>
                <button type="button" onClick={() => handleFolderDelete(f)} className="p-0.5 rounded text-cova-textSecondary hover:text-cova-danger transition-colors" aria-label="Delete folder"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
