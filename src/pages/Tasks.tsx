import { useState, useMemo } from 'react';
import { CheckSquare, Plus, Search, Star, MoreVertical, Trash2, Pencil, CalendarDays, Filter } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input, Label } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { Dropdown } from '@components/ui/Dropdown';
import { EmptyState } from '@components/ui/Card';
import { useTaskStore, useUIStore } from '@store';
import type { Task } from '@lib/types';
import { formatDate } from '@lib/utils';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_COLORS = {
  todo: 'text-cova-textMuted',
  in_progress: 'text-cova-warning',
  done: 'text-cova-success',
};
const PRIORITY_COLORS = {
  low: 'bg-cova-success/15 text-cova-success',
  medium: 'bg-cova-warning/15 text-cova-warning',
  high: 'bg-cova-danger/15 text-cova-danger',
};

export function Tasks() {
  const { tasks, addTask, updateTask, deleteTask, toggleStatus } = useTaskStore();
  const { addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftPriority, setDraftPriority] = useState<Task['priority']>('medium');
  const [draftDue, setDraftDue] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter((t) => {
      const matchQ = !q || t.title.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || t.status === statusFilter;
      return matchQ && matchS;
    });
  }, [tasks, search, statusFilter]);

  const openNew = () => {
    setEditing(null);
    setDraftTitle(''); setDraftDesc(''); setDraftPriority('medium'); setDraftDue('');
    setIsModalOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setDraftTitle(t.title); setDraftDesc(t.description || '');
    setDraftPriority(t.priority); setDraftDue(t.dueDate || '');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!draftTitle.trim()) { addToast('Title is required', 'error'); return; }
    if (editing) {
      updateTask(editing.id, { title: draftTitle.trim(), description: draftDesc, priority: draftPriority, dueDate: draftDue || undefined });
      addToast('Task updated', 'success');
    } else {
      addTask({ title: draftTitle.trim(), description: draftDesc, priority: draftPriority, dueDate: draftDue || undefined, status: 'todo' });
      addToast('Task created', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (t: Task) => {
    if (confirm(`Delete "${t.title}"?`)) { deleteTask(t.id); addToast('Task deleted', 'info'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cova-tasks" aria-hidden="true" />
            Tasks
            <span className="ml-2 px-2 py-0.5 rounded-full bg-cova-surface border border-cova-border text-xs font-medium text-cova-textMuted">{tasks.length}</span>
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Manage your tasks and to-dos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cova-textMuted pointer-events-none" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="input pl-9 pr-3 w-full" aria-label="Search tasks" />
          </div>
          <Dropdown
            align="right"
            trigger={<Button variant="secondary"><Filter className="w-4 h-4" />{statusFilter === 'all' ? 'All' : STATUS_LABELS[statusFilter]}</Button>}
            items={[
              { label: 'All', onClick: () => setStatusFilter('all') },
              { label: 'To Do', onClick: () => setStatusFilter('todo') },
              { label: 'In Progress', onClick: () => setStatusFilter('in_progress') },
              { label: 'Done', onClick: () => setStatusFilter('done') },
            ]}
          />
          <Button variant="primary" onClick={openNew}><Plus className="w-4 h-4" /> New Task</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8"><EmptyState icon={<CheckSquare className="w-16 h-16 text-cova-textMuted" />} title="No tasks yet" description="Stay on top of your work by creating tasks." action={<Button variant="primary" onClick={openNew}><Plus className="w-4 h-4" /> Create task</Button>} /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="card px-5 py-4 flex items-start gap-3 hover:bg-cova-surfaceHover transition-colors">
              <button type="button" onClick={() => toggleStatus(t.id)} className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors" style={{ borderColor: t.status === 'done' ? '#22C55E' : '#4B5563', background: t.status === 'done' ? '#22C55E' : 'transparent' }} aria-label={`Mark as ${t.status}`}>
                {t.status === 'done' && <span className="text-white text-xs">&#10003;</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${t.status === 'done' ? 'line-through text-cova-textMuted' : 'text-cova-text'}`}>{t.title}</span>
                  <span className={'badge ' + PRIORITY_COLORS[t.priority]}>{t.priority}</span>
                  <span className={'badge ' + STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</span>
                </div>
                {t.description && <p className="text-sm text-cova-textSecondary mt-1 truncate">{t.description}</p>}
                {t.dueDate && <p className="text-xs text-cova-textMuted mt-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatDate(t.dueDate)}</p>}
              </div>
              <Dropdown
                align="right"
                trigger={<button type="button" className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surface hover:text-cova-text transition-colors" aria-label="More actions"><MoreVertical className="w-4 h-4" /></button>}
                items={[
                  { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: () => openEdit(t) },
                  { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => handleDelete(t), danger: true },
                ]}
              />
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit task' : 'New task'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSave}>{editing ? 'Save changes' : 'Create task'}</Button></>}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="task-title" required>Title</Label>
            <Input id="task-title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
          </div>
          <div>
            <Label htmlFor="task-desc">Description</Label>
            <textarea id="task-desc" value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} placeholder="Optional details..." className="input min-h-[100px] resize-y font-sans" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <div className="flex gap-2 mt-1">
                {(['low','medium','high'] as Task['priority'][]).map((p) => (
                  <button key={p} type="button" onClick={() => setDraftPriority(p)} className={'flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ' + (draftPriority === p ? 'border-cova-primary bg-cova-primary/15 text-cova-primary' : 'border-cova-border bg-cova-bg text-cova-textSecondary hover:border-cova-borderStrong')}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="task-due">Due Date</Label>
              <Input id="task-due" type="date" value={draftDue} onChange={(e) => setDraftDue(e.target.value)} className="mt-1" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}