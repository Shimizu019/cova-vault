import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WalletRecord } from '../types';
import { generateId } from '../utils';

interface WalletState {
  records: WalletRecord[];

  addRecord: (record: Omit<WalletRecord, 'id' | 'createdAt'>) => WalletRecord;
  updateRecord: (id: string, updates: Partial<WalletRecord>) => void;
  deleteRecord: (id: string) => void;
  getBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpense: () => number;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) => {
        const newRecord: WalletRecord = { ...record, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ records: [newRecord, ...s.records] }));
        return newRecord;
      },

      updateRecord: (id, updates) =>
        set((s) => ({ records: s.records.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),

      deleteRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),

      getBalance: () => get().records.reduce((sum, r) => sum + (r.type === 'income' ? r.amount : -r.amount), 0),

      getMonthlyIncome: () => {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        return get().records.filter((r) => r.type === 'income' && r.date >= startOfMonth).reduce((sum, r) => sum + r.amount, 0);
      },

      getMonthlyExpense: () => {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        return get().records.filter((r) => r.type === 'expense' && r.date >= startOfMonth).reduce((sum, r) => sum + r.amount, 0);
      },
    }),
    { name: 'cova-wallet-store' }
  )
);