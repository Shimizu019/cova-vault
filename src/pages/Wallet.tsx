import { useState, useMemo } from 'react';
import { Plus, Wallet as WalletIcon, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { EmptyState } from '@components/ui/Card';
import { useWalletStore, useUIStore } from '@store';
import { formatPHP, formatDate, generateId } from '@lib/utils';
import type { WalletRecord, Budget } from '@lib/types';

const EXPENSE_CATS = ['Food', 'Transportation', 'School', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Other'];
const INCOME_CATS = ['Salary', 'Allowance', 'Gift', 'Refund', 'Freelance', 'Other'];

export function Wallet() {
  const {
    records, startingBalance, budgets,
    setStartingBalance, addRecord, updateRecord, deleteRecord,
    getBalance, getMonthlyIncome, getMonthlyExpense, getTodaysExpense,
    getWeeklyExpense, getSpendingByCategory, setBudget, updateBudget, deleteBudget,
  } = useWalletStore();
  const { addToast } = useUIStore();

  const [showSetup, setShowSetup] = useState(startingBalance === 0 && records.length === 0);
  const [setupAmt, setSetupAmt] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [selRecord, setSelRecord] = useState<WalletRecord | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [dDesc, setDDesc] = useState('');
  const [dAmt, setDAmt] = useState('');
  const [dCash, setDCash] = useState('');
  const [dCat, setDCat] = useState('Food');
  const [dDate, setDDate] = useState(new Date().toISOString().split('T')[0]);
  const [dTime, setDTime] = useState(new Date().toTimeString().slice(0, 5));
  const [dNote, setDNote] = useState('');

  const [bCat, setBCat] = useState('Food');
  const [bLimit, setBLimit] = useState('');

  const [srch, setSrch] = useState('');
  const [fType, setFType] = useState<'all' | 'income' | 'expense'>('all');
  const [fCat, setFCat] = useState('all');
  const [sBy, setSBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const balance = getBalance();
  const moIncome = getMonthlyIncome();
  const moExpense = getMonthlyExpense();
  const todayExp = getTodaysExpense();
  const wkExp = getWeeklyExpense();
  const byCat = getSpendingByCategory();
  const net = moIncome - moExpense;
  const change = formType === 'expense' && dCash ? Math.max(0, parseFloat(dCash || '0') - parseFloat(dAmt || '0')) : 0;

  const fRecords = useMemo(() => {
    let r = [...records];
    if (fType !== 'all') r = r.filter((x) => x.type === fType);
    if (fCat !== 'all') r = r.filter((x) => x.category === fCat);
    if (srch) {
      const q = srch.toLowerCase();
      r = r.filter((x) => x.description.toLowerCase().includes(q) || x.category.toLowerCase().includes(q) || (x.note && x.note.toLowerCase().includes(q)));
    }
    r.sort((a, b) => {
      if (sBy === 'newest') return new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime();
      if (sBy === 'oldest') return new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime();
      if (sBy === 'highest') return b.amount - a.amount;
      return a.amount - b.amount;
    });
    return r.filter((x) => x.id !== 'starting-balance');
  }, [records, fType, fCat, srch, sBy]);

  const doSetup = () => {
    const a = parseFloat(setupAmt);
    if (isNaN(a) || a <= 0) { addToast('Enter valid amount', 'error'); return; }
    setStartingBalance(a);
    setShowSetup(false);
    addToast('Wallet created', 'success');
  };

  const resetF = () => { setDDesc(''); setDAmt(''); setDCash(''); setDCat('Food'); setDNote(''); setEditMode(false); setSelRecord(null); };

  const openNew = (t: 'income' | 'expense') => { setFormType(t); setDCat(t === 'income' ? 'Allowance' : 'Food'); setIsModalOpen(true); };

  const openEdit = (r: WalletRecord) => {
    setSelRecord(r); setFormType(r.type); setDDesc(r.description); setDAmt(r.amount.toString());
    setDCash(r.cashGiven?.toString() || ''); setDCat(r.category); setDDate(r.date); setDTime(r.time);
    setDNote(r.note || ''); setEditMode(true); setIsModalOpen(true);
  };

  const openDetail = (r: WalletRecord) => { setSelRecord(r); setIsDetailOpen(true); };

  const doSave = () => {
    const a = parseFloat(dAmt);
    if (!dDesc.trim()) { addToast('Enter description', 'error'); return; }
    if (isNaN(a) || a <= 0) { addToast('Enter valid amount', 'error'); return; }
    if (formType === 'expense' && dCash && parseFloat(dCash) < a) { addToast('Cash given cannot be less than amount', 'error'); return; }
    const cg = formType === 'expense' && dCash ? parseFloat(dCash) : undefined;
    const ch = formType === 'expense' && cg ? Math.max(0, cg - a) : undefined;
    if (editMode && selRecord) {
      updateRecord(selRecord.id, { description: dDesc.trim(), amount: a, category: dCat, date: dDate, time: dTime, note: dNote || undefined, cashGiven: cg, change: ch });
      addToast('Updated', 'success');
    } else {
      addRecord({ type: formType, description: dDesc.trim(), amount: a, category: dCat, date: dDate, time: dTime, note: dNote || undefined, cashGiven: cg, change: ch });
      addToast(formType === 'income' ? 'Income recorded' : 'Expense recorded', 'success');
    }
    setIsModalOpen(false); resetF();
  };

  const doDel = (r: WalletRecord) => { if (confirm('Delete this ' + r.type + '?')) { deleteRecord(r.id); setIsDetailOpen(false); addToast('Deleted', 'info'); } };

  const doBudget = () => {
    const l = parseFloat(bLimit);
    if (isNaN(l) || l <= 0) { addToast('Enter valid limit', 'error'); return; }
    const ex = budgets.find((x) => x.category === bCat);
    if (ex) { updateBudget(ex.id, l); addToast('Budget updated', 'success'); }
    else { setBudget({ id: generateId(), category: bCat, limit: l, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); addToast('Budget set', 'success'); }
    setIsBudgetOpen(false); setBLimit('');
  };

  if (showSetup) return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="card p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-cova-success/15 flex items-center justify-center mx-auto mb-6"><WalletIcon className="w-8 h-8 text-cova-success" /></div>
        <h2 className="text-xl font-bold text-cova-text mb-2">Welcome to PeraLog</h2>
        <p className="text-sm text-cova-textMuted mb-6">How much money do you currently have?</p>
        <Input type="number" min="0" step="0.01" value={setupAmt} onChange={(e) => setSetupAmt(e.target.value)} placeholder="0.00" className="text-center text-xl font-semibold mb-6" />
        <Button variant="primary" size="lg" onClick={doSetup} className="w-full">Create Wallet</Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cova-text"><span className="text-gradient">PeraLog</span></h1>
          <p className="text-sm text-cova-textMuted mt-1">Track your money, expenses, and income.</p>
        </div>
        <Button variant="primary" onClick={() => openNew('expense')}><Plus className="w-4 h-4" /> Add Transaction</Button>
      </div>

      <div className="card p-6 bg-gradient-to-br from-cova-surface to-cova-bg border border-cova-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold mb-1">Available Balance</p>
            <p className={'text-4xl font-bold ' + (balance >= 0 ? 'text-cova-success' : 'text-cova-danger')}>{formatPHP(balance)}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8">
            <div><p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold">Starting</p><p className="text-lg font-bold text-cova-text mt-1">{formatPHP(startingBalance)}</p></div>
            <div><p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3 text-cova-success" /> Income</p><p className="text-lg font-bold text-cova-success mt-1">{formatPHP(moIncome)}</p></div>
            <div><p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold flex items-center gap-1"><TrendingDown className="w-3 h-3 text-cova-danger" /> Expenses</p><p className="text-lg font-bold text-cova-danger mt-1">{formatPHP(moExpense)}</p></div>
            <div><p className="text-xs text-cova-textMuted uppercase tracking-wider font-semibold">Today</p><p className="text-lg font-bold text-cova-text mt-1">{formatPHP(todayExp)}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-cova-text mb-4">This Month</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-cova-textMuted">Income</span><span className="text-sm font-semibold text-cova-success">{formatPHP(moIncome)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-cova-textMuted">Expenses</span><span className="text-sm font-semibold text-cova-danger">{formatPHP(moExpense)}</span></div>
            <div className="h-px bg-cova-border" />
            <div className="flex justify-between"><span className="text-sm font-semibold text-cova-text">Net</span><span className={'text-sm font-bold ' + (net >= 0 ? 'text-cova-success' : 'text-cova-danger')}>{formatPHP(net)}</span></div>
            <div className="h-px bg-cova-border" />
            <div className="flex justify-between"><span className="text-xs text-cova-textMuted">Today</span><span className="text-xs font-medium text-cova-text">{formatPHP(todayExp)}</span></div>
            <div className="flex justify-between"><span className="text-xs text-cova-textMuted">This Week</span><span className="text-xs font-medium text-cova-text">{formatPHP(wkExp)}</span></div>
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-cova-text">Spending by Category</h3><Button variant="ghost" size="sm" onClick={() => setIsBudgetOpen(true)}>Set Budget</Button></div>
          {byCat.length === 0 ? <p className="text-sm text-cova-textMuted text-center py-8">No expenses this month</p> : (
            <div className="space-y-3">
              {byCat.slice(0, 6).map((item) => {
                const bud = budgets.find((x) => x.category === item.category);
                const pct = bud ? (item.amount / bud.limit) * 100 : 0;
                return (
                  <div key={item.category}>
                    <div className="flex justify-between mb-1"><span className="text-sm text-cova-textMuted">{item.category}</span><span className="text-sm font-medium text-cova-text">{formatPHP(item.amount)}</span></div>
                    {bud && <div className="w-full h-1.5 bg-cova-border rounded-full overflow-hidden"><div className={'h-full rounded-full transition-all ' + (pct > 90 ? 'bg-cova-danger' : pct > 70 ? 'bg-cova-warning' : 'bg-cova-primary')} style={{ width: Math.min(pct, 100) + '%' }} /></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-cova-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm font-semibold text-cova-text">Recent Transactions</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cova-textMuted" /><input type="text" placeholder="Search..." value={srch} onChange={(e) => setSrch(e.target.value)} className="input pl-9 pr-3 py-1.5 text-sm w-40" /></div>
              <select value={fType} onChange={(e) => setFType(e.target.value as 'all' | 'income' | 'expense')} className="input py-1.5 text-sm"><option value="all">All</option><option value="income">Income</option><option value="expense">Expense</option></select>
              <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="input py-1.5 text-sm"><option value="all">All Categories</option>{[...EXPENSE_CATS, ...INCOME_CATS].map((c) => <option key={c} value={c}>{c}</option>)}</select>
              <select value={sBy} onChange={(e) => setSBy(e.target.value as 'newest' | 'oldest' | 'highest' | 'lowest')} className="input py-1.5 text-sm"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="highest">Highest</option><option value="lowest">Lowest</option></select>
            </div>
          </div>
        </div>
        {fRecords.length === 0 ? <EmptyState icon={<WalletIcon className="w-10 h-10" />} title="No transactions yet" description="Add your first income or expense to begin tracking your money." action={<Button variant="primary" onClick={() => openNew('expense')}><Plus className="w-4 h-4" /> Add Transaction</Button>} /> : (
          <div className="divide-y divide-cova-border">
            {fRecords.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center gap-3 hover:bg-cova-surfaceHover transition-colors cursor-pointer" onClick={() => openDetail(r)}>
                <div className={'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ' + (r.type === 'income' ? 'bg-cova-success/15' : 'bg-cova-danger/15')}>{r.type === 'income' ? <TrendingUp className="w-5 h-5 text-cova-success" /> : <TrendingDown className="w-5 h-5 text-cova-danger" />}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-cova-text truncate">{r.description}</p><p className="text-xs text-cova-textMuted">{r.category} � {formatDate(r.date)}</p></div>
                <span className={'font-bold text-sm ' + (r.type === 'income' ? 'text-cova-success' : 'text-cova-danger')}>{r.type === 'income' ? '+' : '-'}{formatPHP(r.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetF(); }} title={editMode ? 'Edit Transaction' : 'Add Transaction'} size="md" footer={<><Button variant="secondary" onClick={() => { setIsModalOpen(false); resetF(); }}>Cancel</Button><Button variant="primary" onClick={doSave}>{editMode ? 'Update' : formType === 'income' ? 'Save Income' : 'Save Expense'}</Button></>}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => { setFormType('expense'); setDCat('Food'); }} className={'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ' + (formType === 'expense' ? 'border-cova-danger bg-cova-danger/15 text-cova-danger' : 'border-cova-border bg-cova-bg text-cova-textSecondary')}><TrendingDown className="w-4 h-4 inline mr-1" /> Expense</button>
            <button type="button" onClick={() => { setFormType('income'); setDCat('Allowance'); }} className={'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ' + (formType === 'income' ? 'border-cova-success bg-cova-success/15 text-cova-success' : 'border-cova-border bg-cova-bg text-cova-textSecondary')}><TrendingUp className="w-4 h-4 inline mr-1" /> Income</button>
          </div>
          <div><label className="label">Description</label><Input value={dDesc} onChange={(e) => setDDesc(e.target.value)} placeholder={formType === 'expense' ? 'e.g. Burger' : 'e.g. Allowance'} autoFocus /></div>
          <div><label className="label">Amount (?)</label><Input type="number" min="0" step="0.01" value={dAmt} onChange={(e) => setDAmt(e.target.value)} placeholder="0.00" /></div>
          {formType === 'expense' && (
            <div><label className="label">Cash Given (optional)</label><Input type="number" min="0" step="0.01" value={dCash} onChange={(e) => setDCash(e.target.value)} placeholder="0.00" />{dCash && parseFloat(dAmt) > 0 && <div className="mt-2 p-3 bg-cova-surface rounded-lg"><div className="flex justify-between text-sm"><span className="text-cova-textMuted">Change:</span><span className="font-medium text-cova-text">{formatPHP(change)}</span></div></div>}</div>
          )}
          <div><label className="label">Category</label><select value={dCat} onChange={(e) => setDCat(e.target.value)} className="input w-full">{(formType === 'expense' ? EXPENSE_CATS : INCOME_CATS).map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Date</label><Input type="date" value={dDate} onChange={(e) => setDDate(e.target.value)} /></div><div><label className="label">Time</label><Input type="time" value={dTime} onChange={(e) => setDTime(e.target.value)} /></div></div>
          <div><label className="label">Note (optional)</label><Input value={dNote} onChange={(e) => setDNote(e.target.value)} placeholder="Add a note..." /></div>
        </div>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelRecord(null); }} title={selRecord?.description || ''} size="md" footer={<><Button variant="danger" onClick={() => selRecord && doDel(selRecord)}>Delete</Button><Button variant="primary" onClick={() => { setIsDetailOpen(false); selRecord && openEdit(selRecord); }}>Edit</Button></>}>
        {selRecord && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-cova-surface rounded-lg">
              <div className={'w-12 h-12 rounded-lg flex items-center justify-center ' + (selRecord.type === 'income' ? 'bg-cova-success/15' : 'bg-cova-danger/15')}>{selRecord.type === 'income' ? <TrendingUp className="w-6 h-6 text-cova-success" /> : <TrendingDown className="w-6 h-6 text-cova-danger" />}</div>
              <div><p className={'text-2xl font-bold ' + (selRecord.type === 'income' ? 'text-cova-success' : 'text-cova-danger')}>{selRecord.type === 'income' ? '+' : '-'}{formatPHP(selRecord.amount)}</p><p className="text-sm text-cova-textMuted capitalize">{selRecord.type}</p></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-cova-textMuted">Category</span><span className="text-sm font-medium text-cova-text">{selRecord.category}</span></div>
              <div className="flex justify-between"><span className="text-sm text-cova-textMuted">Date</span><span className="text-sm font-medium text-cova-text">{formatDate(selRecord.date)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-cova-textMuted">Time</span><span className="text-sm font-medium text-cova-text">{selRecord.time}</span></div>
              {selRecord.cashGiven !== undefined && selRecord.cashGiven > 0 && <><div className="flex justify-between"><span className="text-sm text-cova-textMuted">Cash Given</span><span className="text-sm font-medium text-cova-text">{formatPHP(selRecord.cashGiven)}</span></div><div className="flex justify-between"><span className="text-sm text-cova-textMuted">Change</span><span className="text-sm font-medium text-cova-text">{formatPHP(selRecord.change || 0)}</span></div></>}
              {selRecord.note && <div className="pt-2 border-t border-cova-border"><p className="text-sm text-cova-textMuted mb-1">Note</p><p className="text-sm text-cova-text">{selRecord.note}</p></div>}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} title="Set Budget" size="sm" footer={<><Button variant="secondary" onClick={() => setIsBudgetOpen(false)}>Cancel</Button><Button variant="primary" onClick={doBudget}>Save Budget</Button></>}>
        <div className="space-y-4">
          <div><label className="label">Category</label><select value={bCat} onChange={(e) => setBCat(e.target.value)} className="input w-full">{EXPENSE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="label">Budget Limit (₱)</label><Input type="number" min="0" step="0.01" value={bLimit} onChange={(e) => setBLimit(e.target.value)} placeholder="0.00" /></div>
        </div>
      </Modal>
    </div>
  );
}