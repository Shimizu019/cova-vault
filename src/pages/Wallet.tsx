import { useState } from 'react';
import { Wallet as WalletIcon, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input, Label } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { EmptyState } from '@components/ui/Card';
import { useWalletStore, useUIStore } from '@store';
import { formatPHP, formatDate } from '@lib/utils';
import type { WalletRecord } from '@lib/types';

const CATEGORIES = ['Food','Transport','Entertainment','Shopping','Bills','Health','Salary','Freelance','Other'];

export function Wallet() {
  const { records, addRecord, deleteRecord, getBalance, getMonthlyIncome, getMonthlyExpense } = useWalletStore();
  const { addToast } = useUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftType, setDraftType] = useState<WalletRecord['type']>('expense');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftAmount, setDraftAmount] = useState('');
  const [draftCategory, setDraftCategory] = useState('Other');
  const [draftDate, setDraftDate] = useState(new Date().toISOString().split('T')[0]);

  const balance = getBalance();
  const income = getMonthlyIncome();
  const expense = getMonthlyExpense();

  const handleAdd = () => {
    const amt = parseFloat(draftAmount);
    if (!draftDesc.trim() || isNaN(amt) || amt <= 0) { addToast('Fill in description and a valid amount', 'error'); return; }
    addRecord({ description: draftDesc.trim(), category: draftCategory, amount: amt, type: draftType, date: draftDate + 'T00:00:00.000Z' });
    addToast(draftType === 'income' ? 'Income recorded' : 'Expense recorded', 'success');
    setIsModalOpen(false);
    setDraftDesc(''); setDraftAmount(''); setDraftCategory('Other');
  };

  const handleDelete = (r: WalletRecord) => {
    if (confirm(`Delete this ${r.type}?`)) { deleteRecord(r.id); addToast('Record deleted', 'info'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-cova-success" aria-hidden="true" />
            My Wallet
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Track your income and expenses</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> Add Record</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold">Current Balance</p>
          <p className={'text-2xl font-bold mt-1 ' + (balance >= 0 ? 'text-cova-success' : 'text-cova-danger')}>{formatPHP(balance)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3 text-cova-success" /> Income this month</p>
          <p className="text-2xl font-bold mt-1 text-cova-success">{formatPHP(income)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold flex items-center gap-1"><TrendingDown className="w-3 h-3 text-cova-danger" /> Expenses this month</p>
          <p className="text-2xl font-bold mt-1 text-cova-danger">{formatPHP(expense)}</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card p-8"><EmptyState icon={<WalletIcon className="w-16 h-16 text-cova-textMuted" />} title="No records yet" description="Start tracking your income and expenses." action={<Button variant="primary" onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> Add first record</Button>} /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-cova-border">
            {records.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center gap-3 hover:bg-cova-surfaceHover transition-colors">
                <div className={'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ' + (r.type === 'income' ? 'bg-cova-success/15' : 'bg-cova-danger/15')}>
                  {r.type === 'income' ? <TrendingUp className="w-4 h-4 text-cova-success" /> : <TrendingDown className="w-4 h-4 text-cova-danger" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cova-text truncate">{r.description}</p>
                  <p className="text-xs text-cova-textMuted">{r.category} &middot; {formatDate(r.date)}</p>
                </div>
                <span className={'font-bold ' + (r.type === 'income' ? 'text-cova-success' : 'text-cova-danger')}>
                  {r.type === 'income' ? '+' : '-'}{formatPHP(r.amount)}
                </span>
                <button type="button" onClick={() => handleDelete(r)} className="p-1.5 rounded text-cova-textMuted hover:bg-cova-danger/10 hover:text-cova-danger transition-colors flex-shrink-0" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add record" footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleAdd}>Add record</Button></>}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setDraftType('expense')} className={'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ' + (draftType === 'expense' ? 'border-cova-danger bg-cova-danger/15 text-cova-danger' : 'border-cova-border bg-cova-bg text-cova-textSecondary')}>Expense</button>
            <button type="button" onClick={() => setDraftType('income')} className={'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ' + (draftType === 'income' ? 'border-cova-success bg-cova-success/15 text-cova-success' : 'border-cova-border bg-cova-bg text-cova-textSecondary')}>Income</button>
          </div>
          <div>
            <Label htmlFor="w-desc" required>Description</Label>
            <Input id="w-desc" value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} placeholder="e.g. Grocery shopping" autoFocus />
          </div>
          <div>
            <Label htmlFor="w-amount" required>Amount (PHP)</Label>
            <Input id="w-amount" type="number" min="0" step="0.01" value={draftAmount} onChange={(e) => setDraftAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} className="input mt-1">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="w-date">Date</Label>
              <Input id="w-date" type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} className="mt-1" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}