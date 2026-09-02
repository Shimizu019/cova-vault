import { useState, useRef, useEffect } from 'react';
import { useData } from '@context/DataContext';
import { cn } from '@lib/utils';
import { PageHeader } from '@components/ui/PageHeader';
import { SearchBar } from '@components/ui/SearchBar';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Dropdown } from '@components/ui/Dropdown';
import { Input, Label, Textarea } from '@components/ui/Input';
import { formatRelativeTime, truncate } from '@lib/utils';
import { Note } from '@lib/types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Star, 
  MoreVertical,
  FileText,
  Eye,
  Edit2,
} from 'lucide-react';
import { NoteEditorModal } from '@modals/NoteEditorModal';

function renderMarkdown(content: string) {
  // Simple markdown rendering
  return content
    .split('\n')
    .map((line, i) => {
      let processed = line;
      
      // Headers
      if (processed.startsWith('### ')) processed = `<h3>${processed.slice(4)}</h3>`;
      else if (processed.startsWith('## ')) processed = `<h2>${processed.slice(3)}</h2>`;
      else if (processed.startsWith('# ')) processed = `<h1>${processed.slice(2)}</h1>`;
      // Bold
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Code
      processed = processed.replace(/`(.*?)`/g, '<code>$1</code>');
      // Code blocks
      // Lists
      if (processed.match(/^[-*+]\s/)) processed = `<li>${processed.replace(/^[-*+]\s/, '')}</li>`;
      
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} className="whitespace-pre-wrap" />;
    })
    .join('');
}

export function Notes() {
  const { notes, folders, addNote, updateNote, deleteNote, toggleFavoriteNote } = useData();
  const [search, setSearch] = useState('');
  const [filterFolder, setFilterFolder] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('preview');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = !filterFolder || n.folderId === filterFolder;
    return matchesSearch && matchesFolder;
  });

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setViewMode('preview');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(id);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    }
  };

  const getNoteActions = (note: Note) => [
    { 
      label: 'Edit', 
      icon: <Edit className="w-4 h-4" />, 
      onClick: () => { setEditingNote(note); setViewMode('write'); } 
    },
    { 
      label: note.favorite ? 'Remove from Favorites' : 'Add to Favorites', 
      icon: <Star className="w-4 h-4" />, 
      onClick: () => toggleFavoriteNote(note.id) 
    },
    { 
      label: 'Delete', 
      icon: <Trash2 className="w-4 h-4" />, 
      onClick: () => handleDelete(note.id),
      danger: true 
    },
  ];

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedNote) {
      updateNote(selectedNote.id, { content: e.target.value, updatedAt: new Date().toISOString() });
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-200px)] flex flex-col">
      <PageHeader
        title="Notes"
        subtitle="Create and organize your notes"
        actions={
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <div className={cn('w-72 lg:w-80 flex-shrink-0 border-r border-[#333] flex flex-col', sidebarOpen ? '' : 'hidden lg:flex')}>
          <div className="p-3 border-b border-[#333]">
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
            />
          </div>
          <div className="p-3 border-b border-[#333]">
            <Label className="text-xs text-[#666] mb-1 block">Folder</Label>
            <select
              value={filterFolder}
              onChange={(e) => setFilterFolder(e.target.value)}
              className="input-sm w-full bg-[#111] border-[#333] text-white focus:border-[#555]"
            >
              <option value="">All Folders</option>
              {folders.filter(f => f.type === 'notes' || f.type === 'mixed').map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#333]">
            {filteredNotes.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#666]">
                {search || filterFolder ? 'No notes found' : 'No notes yet'}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={cn(
                    'w-full text-left p-3 hover:bg-[#222] transition-colors',
                    selectedNote?.id === note.id && 'bg-white/5'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      selectedNote?.id === note.id 
                        ? 'bg-white/10' 
                        : 'bg-[#222]'
                    )}>
                      <FileText className={cn('w-4 h-4', selectedNote?.id === note.id ? 'text-[#3b82f6]' : 'text-[#666]')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', selectedNote?.id === note.id ? 'text-[#3b82f6]' : 'text-white')}>
                        {note.title}
                      </p>
                      <p className={cn('text-xs truncate mt-0.5', selectedNote?.id === note.id ? 'text-[#3b82f6]/80' : 'text-[#666]')}>
                        {truncate(note.content, 60)}
                      </p>
                      <p className={cn('text-xs mt-1', selectedNote?.id === note.id ? 'text-[#3b82f6]/70' : 'text-[#666]')}>
                        {formatRelativeTime(note.updatedAt)}
                      </p>
                    </div>
                    {note.favorite && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedNote ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#333]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedNote.title}</h2>
                    <p className="text-xs text-[#666] mt-0.5">
                      Updated {formatRelativeTime(selectedNote.updatedAt)}
                      {selectedNote.folderId && folders.find(f => f.id === selectedNote.folderId) && (
                        <>
                          {' • '}
                          <Badge variant="neutral" className="bg-[#222] text-[#888]">{folders.find(f => f.id === selectedNote!.folderId)!.name}</Badge>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-[#1a1a1a] border border-[#333] rounded-lg">
                      <button
                        onClick={() => setViewMode('write')}
                        className={cn('px-3 py-1.5 rounded-l-lg text-sm font-medium transition-colors', viewMode === 'write' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white')}
                      >
                        <Edit2 className="w-4 h-4" />
                        Write
                      </button>
                      <button
                        onClick={() => setViewMode('preview')}
                        className={cn('px-3 py-1.5 rounded-r-lg text-sm font-medium transition-colors', viewMode === 'preview' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white')}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                    <Dropdown
                      align="right"
                      trigger={
                        <button className="text-[#666] hover:text-white p-1.5 rounded hover:bg-[#222] transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      }
                      items={getNoteActions(selectedNote)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {viewMode === 'write' ? (
                  <Textarea
                    ref={editorRef}
                    value={selectedNote.content}
                    onChange={handleContentChange}
                    placeholder="Write your note here..."
                    className="w-full h-full bg-[#111] border-[#333] text-white placeholder-[#666] focus:border-[#555] font-mono text-sm resize-none"
                    spellCheck={false}
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-white">
                    <div dangerouslySetInnerHTML={{ __html: selectedNote.content
                      .split('\n')
                      .map((line, i) => {
                        let processed = line;
                        if (processed.startsWith('### ')) processed = `<h3>${processed.slice(4)}</h3>`;
                        else if (processed.startsWith('## ')) processed = `<h2>${processed.slice(3)}</h2>`;
                        else if (processed.startsWith('# ')) processed = `<h1>${processed.slice(2)}</h1>`;
                        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
                        processed = processed.replace(/`(.*?)`/g, '<code class="bg-[#222] px-1 rounded">$1</code>');
                        if (processed.match(/^[-*+]\s/)) processed = `<li>${processed.replace(/^[-*+]\s/, '')}</li>`;
                        return `<p>${processed || '<br />'}</p>`;
                      })
                      .join('')
                    }} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#222] flex items-center justify-center">
                  <FileText className="w-8 h-8 text-[#666]" />
                </div>
                <h3 className="text-sm font-medium text-[#888] mb-1">
                  Select a note
                </h3>
                <p className="text-xs text-[#666] mb-4">
                  Choose a note from the sidebar or create a new one
                </p>
                <Button onClick={() => setShowNewModal(true)}>
                  <Plus className="w-4 h-4" />
                  Create Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Note" size="lg">
        <NoteEditorModal onClose={() => setShowNewModal(false)} />
      </Modal>

      <Modal isOpen={!!editingNote} onClose={() => setEditingNote(null)} title="Edit Note" size="lg">
        {editingNote && <NoteEditorModal initialData={editingNote} onClose={() => setEditingNote(null)} />}
      </Modal>
    </div>
  );
}