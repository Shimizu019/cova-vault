import { useState, useMemo } from 'react';
import { FileText, Plus, Search, Star, MoreVertical, Trash2, Pencil, Eye, StickyNote } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input, Label } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { Dropdown } from '@components/ui/Dropdown';
import { EmptyState } from '@components/ui/Card';
import { useNoteStore, useUIStore } from '@store';
import type { Note } from '@lib/types';
import { formatDate } from '@lib/utils';

export function Notes() {
  const { notes, addNote, updateNote, deleteNote, toggleFavorite } = useNoteStore();
  const { addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [viewing, setViewing] = useState<Note | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');

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
    setIsModalOpen(true);
  };

  const openEdit = (n: Note) => {
    setEditing(n);
    setDraftTitle(n.title);
    setDraftContent(n.content);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!draftTitle.trim()) {
      addToast('Title is required', 'error');
      return;
    }
    if (editing) {
      updateNote(editing.id, { title: draftTitle.trim(), content: draftContent });
      addToast('Note updated', 'success');
    } else {
      addNote({ title: draftTitle.trim(), content: draftContent, favorite: false });
      addToast('Note created', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (n: Note) => {
    if (confirm(`Delete "${n.title}"? This cannot be undone.`)) {
      deleteNote(n.id);
      addToast('Note deleted', 'info');
    }
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
                <button type="button" onClick={() => toggleFavorite(n.id)} className="p-1 rounded text-cova-textSecondary hover:text-cova-warning transition-colors flex-shrink-0" aria-label={n.favorite ? 'Unfavorite' : 'Favorite'}>
                  <Star className={'w-4 h-4 ' + (n.favorite ? 'fill-cova-warning text-cova-warning' : '')} />
                </button>
              </div>
              <p className="text-sm text-cova-textSecondary line-clamp-4 whitespace-pre-wrap break-words">
                {n.content || <span className="italic text-cova-textMuted">Empty note</span>}
              </p>
              <div className="flex items-center justify-between pt-2 mt-auto border-t border-cova-border/50">
                <span className="text-xs text-cova-textMuted">{formatDate(n.updatedAt)}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setViewing(n)} className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surface hover:text-cova-text transition-colors" aria-label="View note">
                    <Eye className="w-3.5 h-3.5" />
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
                      { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => handleDelete(n), danger: true },
                    ]}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Edit note' : 'New note'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? 'Save changes' : 'Create note'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="note-title" required>Title</Label>
            <Input id="note-title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="e.g. Bank PIN recovery" autoFocus />
          </div>
          <div>
            <Label htmlFor="note-content">Content</Label>
            <textarea id="note-content" value={draftContent} onChange={(e) => setDraftContent(e.target.value)} placeholder="Write your note here..." className="input min-h-[180px] resize-y font-sans" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={viewing?.title || ''} size="lg" footer={<><Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>{viewing && <Button variant="primary" onClick={() => { openEdit(viewing); setViewing(null); }}><Pencil className="w-4 h-4" /> Edit</Button>}</>}>
        {viewing && (
          <div className="space-y-3">
            <p className="text-xs text-cova-textMuted">Last updated {formatDate(viewing.updatedAt)}</p>
            <p className="text-sm text-cova-text whitespace-pre-wrap break-words">{viewing.content || <span className="italic text-cova-textMuted">Empty note</span>}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}