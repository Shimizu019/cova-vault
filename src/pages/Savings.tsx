import { useState } from 'react';
import { PiggyBank, Plus, Trash2, Pencil, Target } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input, Label } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { EmptyState } from '@components/ui/Card';
import { useUIStore } from '@store';
import { formatPHP } from '@lib/utils';
import { generateId } from '@lib/utils';

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  createdAt: string;
}

const PRESETS = [
  { name: 'Emergency Fund', target: 50000 },
  { name: 'Vacation', target: 25000 },
  { name: 'New Gadget', target: 15000 },
  { name: 'Investments', target: 100000 },
];

export function Savings() {
  const { addToast } = useUIStore();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftTarget, setDraftTarget] = useState('');
  const [draftCurrent, setDraftCurrent] = useState('');

  const openNew = (preset?: { name: string; target: number }) => {
    setEditing(null);
    setDraftName(preset?.name || '');
    setDraftTarget(preset?.target.toString() || '');
    setDraftCurrent('0');
    setIsModalOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    setDraftName(g.name);
    setDraftTarget(g.target.toString());
    setDraftCurrent(g.current.toString());
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const target = parseFloat(draftTarget);
    const current = parseFloat(draftCurrent || '0');
    if (!draftName.trim() || isNaN(target) || target <= 0) { addToast('Fill in name and target amount', 'error'); return; }
    if (editing) {
      setGoals((prev) => prev.map((g) => g.id === editing.id ? { ...g, name: draftName.trim(), target, current } : g));
      addToast('Goal updated', 'success');
    } else {
      setGoals((prev) => [...prev, { id: generateId(), name: draftName.trim(), target, current, createdAt: new Date().toISOString() }]);
      addToast('Savings goal created', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (g: SavingsGoal) => {
    if (confirm(`Delete "${g.name}"?`)) { setGoals((prev) => prev.filter((x) => x.id !== g.id)); addToast('Goal deleted', 'info'); }
  };

  const totalSaved = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-cova-primary" aria-hidden="true" />
            Savings
            <span className="ml-2 px-2 py-0.5 rounded-full bg-cova-surface border border-cova-border text-xs font-medium text-cova-textMuted">{goals.length}</span>
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Track your savings goals and progress</p>
        </div>
        <Button variant="primary" onClick={() => openNew()}><Plus className="w-4 h-4" /> New Goal</Button>
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold">Total Saved</p>
            <p className="text-2xl font-bold mt-1 text-cova-primary">{formatPHP(totalSaved)}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold">Overall Progress</p>
            <p className="text-2xl font-bold mt-1 text-cova-success">{totalTarget > 0 ? Math.round(totalSaved / totalTarget * 100) : 0}%</p>
          </div>
        </div>
      )}

      {/* Quick add */}
      {goals.length === 0 && (
        <div className="mb-4">
          <p className="text-xs text-cova-textMuted mb-2 font-medium">Quick start with a preset:</p>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <button key={p.name} type="button" onClick={() => openNew(p)} className="px-3 py-1.5 rounded-lg border border-cova-border text-xs text-cova-textSecondary hover:border-cova-primary hover:text-cova-primary transition-colors">
                {p.name} &middot; {formatPHP(p.target)}
              </button>
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="card p-8"><EmptyState icon={<PiggyBank className="w-16 h-16 text-cova-textMuted" />} title="No savings goals yet" description="Set a goal and track your progress over time." action={<Button variant="primary" onClick={() => openNew()}><Plus className="w-4 h-4" /> Create first goal</Button>} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(Math.round(g.current / g.target * 100), 100);
            const color = pct >= 100 ? '#22C55E' : pct >= 50 ? '#F97316' : '#7C3AED';
            return (
              <div key={g.id} className="card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-cova-primary/15 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-cova-primary" />
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openEdit(g)} className="p-1.5 rounded text-cova-textMuted hover:bg-cova-surface hover:text-cova-text transition-colors" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => handleDelete(g)} className="p-1.5 rounded text-cova-textMuted hover:bg-cova-danger/10 hover:text-cova-danger transition-colors" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-cova-text">{g.name}</p>
                  <p className="text-xs text-cova-textMuted mt-0.5">{formatPHP(g.current)} of {formatPHP(g.target)}</p>
                </div>
                <div>
                  <div className="w-full h-2 bg-cova-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', backgroundColor: color }} />
                  </div>
                  <p className="text-xs text-cova-textMuted mt-1 text-right" style={{ color }}>{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit goal' : 'New savings goal'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSave}>{editing ? 'Save changes' : 'Create goal'}</Button></>}>
        <div className="space-y-3">
          <div><Label htmlFor="sav-name" required>Goal name</Label><Input id="sav-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Emergency fund" autoFocus /></div>
          <div><Label htmlFor="sav-target" required>Target amount (PHP)</Label><Input id="sav-target" type="number" min="1" value={draftTarget} onChange={(e) => setDraftTarget(e.target.value)} placeholder="50000" /></div>
          {editing && <div><Label htmlFor="sav-current">Current saved (PHP)</Label><Input id="sav-current" type="number" min="0" value={draftCurrent} onChange={(e) => setDraftCurrent(e.target.value)} placeholder="0" /></div>}
        </div>
      </Modal>
    </div>
  );
}