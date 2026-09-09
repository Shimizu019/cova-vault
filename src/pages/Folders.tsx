import { useState } from "react";
import { Folder as FolderIcon, Plus, Trash2, Pencil, FolderOpen, ArrowLeft, Key, FileText, CheckSquare } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input, Label } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { EmptyState } from "@components/ui/Card";
import { useCredentialStore, useNoteStore, useTaskStore, useUIStore } from "@store";
import type { Folder } from "@lib/types";

type Tab = "credentials" | "notes" | "tasks";

export function Folders() {
  const { folders, credentials, addFolder, renameFolder, deleteFolder, getCredentialsByFolder } = useCredentialStore();
  const { notes } = useNoteStore();
  const { tasks } = useTaskStore();
  const { addToast } = useUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editing, setEditing] = useState<Folder | null>(null);
  const [openFolder, setOpenFolder] = useState<Folder | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("credentials");

  const openNew = () => { setEditing(null); setDraftName(""); setIsModalOpen(true); };
  const openEdit = (f: Folder) => { setEditing(f); setDraftName(f.name); setIsModalOpen(true); };

  const handleSave = () => {
    if (!draftName.trim()) { addToast("Folder name is required", "error"); return; }
    if (editing) {
      renameFolder(editing.id, draftName.trim());
      addToast("Folder renamed", "success");
    } else {
      addFolder(draftName.trim());
      addToast("Folder created", "success");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (f: Folder) => {
    if (confirm(`Delete folder "${f.name}"? Items inside will not be deleted.`)) {
      deleteFolder(f.id);
      if (openFolder?.id === f.id) setOpenFolder(null);
      addToast("Folder deleted", "info");
    }
  };

  const folderCreds = openFolder ? getCredentialsByFolder(openFolder.id) : [];
  const folderNotes = openFolder ? notes.filter((n) => n.folderId === openFolder.id) : [];
  const folderTasks = openFolder ? tasks.filter((t) => t.folderId === openFolder.id) : [];
  const noFolderCreds = credentials.filter((c) => !c.folderId);
  const noFolderNotes = notes.filter((n) => !n.folderId);
  const noFolderTasks = tasks.filter((t) => !t.folderId);

  if (openFolder) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <button onClick={() => setOpenFolder(null)} className="flex items-center gap-2 text-sm text-cova-textMuted hover:text-cova-text transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Folders
          </button>
          <div className="flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-cova-primary" />
            <div>
              <h1 className="text-xl font-bold text-cova-text">{openFolder.name}</h1>
              <p className="text-sm text-cova-textMuted">{folderCreds.length} credentials · {folderNotes.length} notes · {folderTasks.length} tasks</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 border-b border-cova-border">
          {(['credentials', 'notes', 'tasks'] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={'px-4 py-2 text-sm font-medium capitalize transition-colors ' + (activeTab === tab ? 'text-cova-primary border-b-2 border-cova-primary' : 'text-cova-textMuted hover:text-cova-text')}>
              {tab} ({tab === 'credentials' ? folderCreds.length : tab === 'notes' ? folderNotes.length : folderTasks.length})
            </button>
          ))}
        </div>

        {activeTab === 'credentials' && (
          folderCreds.length === 0 ? (
            <div className="card p-8">
              <EmptyState icon={<Key className="w-12 h-12 text-cova-textMuted" />} title="No credentials in this folder" description="Move credentials here using the folder selector." />
            </div>
          ) : (
            <div className="space-y-2">
              {folderCreds.map((cred) => (
                <div key={cred.id} className="card px-5 py-4 flex items-center gap-3 hover:bg-cova-surfaceHover transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-cova-primary/15 flex items-center justify-center flex-shrink-0">
                    <Key className="w-5 h-5 text-cova-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-cova-text truncate">{cred.name}</p>
                    <p className="text-xs text-cova-textMuted truncate">{cred.username}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cova-primary/15 text-cova-primary text-xs font-medium">{openFolder.name}</span>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'notes' && (
          folderNotes.length === 0 ? (
            <div className="card p-8">
              <EmptyState icon={<FileText className="w-12 h-12 text-cova-textMuted" />} title="No notes in this folder" description="Move notes here using the folder selector." />
            </div>
          ) : (
            <div className="space-y-2">
              {folderNotes.map((note) => (
                <div key={note.id} className="card px-5 py-4 flex items-center gap-3 hover:bg-cova-surfaceHover transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-cova-success/15 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-cova-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-cova-text truncate">{note.title}</p>
                    <p className="text-xs text-cova-textMuted truncate">{note.content.slice(0, 80) || 'No content'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cova-success/15 text-cova-success text-xs font-medium">{openFolder.name}</span>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'tasks' && (
          folderTasks.length === 0 ? (
            <div className="card p-8">
              <EmptyState icon={<CheckSquare className="w-12 h-12 text-cova-textMuted" />} title="No tasks in this folder" description="Move tasks here using the folder selector." />
            </div>
          ) : (
            <div className="space-y-2">
              {folderTasks.map((task) => (
                <div key={task.id} className="card px-5 py-4 flex items-center gap-3 hover:bg-cova-surfaceHover transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-cova-warning/15 flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-5 h-5 text-cova-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-cova-text truncate">{task.title}</p>
                    <p className="text-xs text-cova-textMuted">{task.description ? task.description.slice(0, 80) : 'No description'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cova-warning/15 text-cova-warning text-xs font-medium">{openFolder.name}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-cova-primary" aria-hidden="true" />
            Folders
            <span className="ml-2 px-2 py-0.5 rounded-full bg-cova-surface border border-cova-border text-xs font-medium text-cova-textMuted">{folders.length}</span>
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Organize your credentials, notes, and tasks into folders</p>
        </div>
        <Button variant="primary" onClick={openNew}><Plus className="w-4 h-4" /> New Folder</Button>
      </div>

      {noFolderCreds.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-cova-textMuted uppercase tracking-wider mb-3">No Folder</h2>
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-cova-surface border-b border-cova-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cova-border flex items-center justify-center">
                <FolderIcon className="w-4 h-4 text-cova-textMuted" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-cova-text">No Folder</p>
                <p className="text-xs text-cova-textMuted">{noFolderCreds.length} credentials · {noFolderNotes.length} notes · {noFolderTasks.length} tasks</p>
              </div>
            </div>
            {noFolderCreds.slice(0, 3).map((cred) => (
              <div key={cred.id} className="px-5 py-3 flex items-center gap-3 hover:bg-cova-surfaceHover transition-colors border-b border-cova-border/50 last:border-b-0">
                <div className="w-8 h-8 rounded-lg bg-cova-primary/10 flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-cova-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cova-text truncate">{cred.name}</p>
                  <p className="text-xs text-cova-textMuted truncate">{cred.username}</p>
                </div>
              </div>
            ))}
            {noFolderCreds.length > 3 && (
              <div className="px-5 py-2 text-center">
                <p className="text-xs text-cova-textMuted">+{noFolderCreds.length - 3} more</p>
              </div>
            )}
          </div>
        </div>
      )}

      {folders.length === 0 && noFolderCreds.length === 0 && noFolderNotes.length === 0 && noFolderTasks.length === 0 ? (
        <div className="card p-8">
          <EmptyState icon={<FolderIcon className="w-16 h-16 text-cova-textMuted" />} title="No folders yet" description="Create folders to organize your credentials, notes, and tasks." action={<Button variant="primary" onClick={openNew}><Plus className="w-4 h-4" /> Create folder</Button>} />
        </div>
      ) : folders.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((f) => (
            <div key={f.id} className="card px-5 py-4 flex items-center gap-3 hover:bg-cova-surfaceHover transition-colors group cursor-pointer" onClick={() => setOpenFolder(f)}>
              <FolderOpen className="w-8 h-8 text-cova-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-cova-text truncate">{f.name}</p>
                <p className="text-xs text-cova-textMuted">{
                  credentials.filter((c) => c.folderId === f.id).length + notes.filter((n) => n.folderId === f.id).length + tasks.filter((t) => t.folderId === f.id).length
                } items</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => openEdit(f)} className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surface hover:text-cova-text transition-colors" aria-label="Rename folder"><Pencil className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => handleDelete(f)} className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-danger/10 hover:text-cova-danger transition-colors" aria-label="Delete folder"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Rename folder" : "New folder"} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSave}>{editing ? "Save" : "Create"}</Button></>}>
        <div>
          <Label htmlFor="folder-name" required>Folder name</Label>
          <Input id="folder-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Work accounts" autoFocus />
        </div>
      </Modal>
    </div>
  );
}
