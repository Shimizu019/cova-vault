import { create } from "zustand";
import type { WalletRecord, Budget, ActivityItem, Wallet, WalletType } from "../types";
import { generateId, formatPHP } from "../utils";
import { useActivityStore } from "./activityStore";
import { encryptedPersist } from "../crypto/encryptedStorage";

export type WalletRecordInput = Omit<WalletRecord, "id" | "walletId" | "createdAt" | "updatedAt"> & {
  walletId?: string;
};

export interface WalletState {
  wallets: Wallet[];
  records: WalletRecord[];
  startingBalance: number;
  budgets: Budget[];
  setStartingBalance: (amount: number) => void;
  addRecord: (record: WalletRecordInput) => WalletRecord;
  updateRecord: (id: string, updates: Partial<WalletRecord>) => void;
  deleteRecord: (id: string) => void;
  getBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpense: () => number;
  getTodaysExpense: () => number;
  getWeeklyExpense: () => number;
  getSpendingByCategory: () => Array<{ category: string; amount: number }>;
  getIncomeByCategory: () => Array<{ category: string; amount: number }>;
  getBudgetProgress: (category: string) => { budget: number; spent: number; remaining: number; percentage: string } | null;
  setBudget: (budget: Budget) => void;
  updateBudget: (id: string, limit: number) => void;
  deleteBudget: (id: string) => void;
  addWallet: (name: string, type: WalletType, initialAmount?: number) => Wallet;
  updateWallet: (id: string, updates: Partial<Omit<Wallet, "id" | "createdAt">>) => void;
  deleteWallet: (id: string) => void;
  setStartingBalanceForWallet: (walletId: string, amount: number) => void;
  transferMoney: (sourceWalletId: string, destinationWalletId: string, amount: number, note?: string) => void;
  getWalletBalance: (walletId: string) => number;
  getTotalBalance: () => number;
  getWalletTransactions: (walletId: string) => WalletRecord[];
  getTransfers: () => WalletRecord[];
}

/** Helper to add a wallet activity to the activity store */
const pushActivity = (activity: Omit<ActivityItem, "id" | "timestamp">) => {
  try {
    useActivityStore.getState().addActivity(activity);
  } catch {
    // silently fail if store is not yet initialized
  }
};

const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (cents: number) => cents / 100;
const nowIso = () => new Date().toISOString();
const isStartingBalanceRecord = (record: Pick<WalletRecord, "id">) =>
  record.id === "starting-balance" || record.id.startsWith("starting-balance:");

type PersistedWalletData = {
  wallets?: Wallet[];
  records?: WalletRecord[];
  startingBalance?: number;
  budgets?: Budget[];
};

/** Normalize persisted or imported legacy wallet data without changing balances. */
export function normalizeWalletState(input: unknown): Partial<WalletState> {
  const source = input && typeof input === "object" ? input as PersistedWalletData : {};
  const wallets = Array.isArray(source.wallets) ? source.wallets : [];
  const records = Array.isArray(source.records) ? source.records : [];
  const startingBalance = typeof source.startingBalance === "number" ? source.startingBalance : 0;
  const budgets = Array.isArray(source.budgets) ? source.budgets : [];
  const hasLegacyData = records.length > 0 || startingBalance > 0;
  if (wallets.length === 0 && !hasLegacyData) return { wallets: [], records: [], startingBalance: 0, budgets };

  const now = nowIso();
  const normalizedWallets = wallets.length > 0
    ? wallets
    : [{
        id: "legacy-cash",
        name: "Cash",
        type: "cash",
        currency: "PHP",
        icon: "Wallet",
        createdAt: now,
        updatedAt: now,
      } satisfies Wallet];
  const fallbackWalletId = normalizedWallets[0].id;
  const walletIds = new Set(normalizedWallets.map((wallet) => wallet.id));
  const normalizedRecords = records
    .filter((record) => record.id !== "starting-balance" && (!record.id.startsWith("starting-balance:") || walletIds.has(record.walletId)))
    .map((record) => ({
      ...record,
      walletId: walletIds.has(record.walletId) ? record.walletId : fallbackWalletId,
    }));
  const currentStartingRecordId = `starting-balance:${fallbackWalletId}`;
  const hasStartingRecord = normalizedRecords.some((record) => record.id === currentStartingRecordId);
  const startingRecord: WalletRecord = {
    id: currentStartingRecordId,
    walletId: fallbackWalletId,
    date: now.split("T")[0],
    time: now.split("T")[1].split(".")[0],
    description: "Starting Balance",
    category: "Salary",
    amount: startingBalance,
    type: "income",
    cashGiven: 0,
    change: 0,
    note: "Initial starting balance",
    createdAt: now,
    updatedAt: now,
  };
  return {
    wallets: normalizedWallets,
    records: startingBalance > 0 && !hasStartingRecord
      ? [...normalizedRecords, startingRecord]
      : normalizedRecords,
    startingBalance,
    budgets,
  };
}

export const useWalletStore = create<WalletState>()(
  encryptedPersist(
    (set, get) => ({
      wallets: [],
      records: [],
      startingBalance: 0,
      budgets: [],
      setStartingBalance: (amount) => {
        let wallet = get().wallets[0];
        if (!wallet) {
          const now = nowIso();
          wallet = {
            id: generateId(),
            name: "Cash",
            type: "cash",
            currency: "PHP",
            icon: "Wallet",
            createdAt: now,
            updatedAt: now,
          };
          set({ wallets: [wallet] });
        }
        get().setStartingBalanceForWallet(wallet.id, amount);
        pushActivity({
          type: "wallet",
          title: "Starting balance updated",
          detail: "Set balance to " + formatPHP(amount),
        });
      },
      addRecord: (record) => {
        const now = nowIso();
        let wallet = get().wallets.find((item) => item.id === record.walletId);
        if (!wallet && record.walletId) throw new Error("Wallet not found");
        if (!wallet) {
          wallet = get().wallets[0];
        }
        if (!wallet) {
          wallet = {
            id: generateId(),
            name: "Cash",
            type: "cash",
            currency: "PHP",
            icon: "Wallet",
            createdAt: now,
            updatedAt: now,
          };
          set({ wallets: [wallet] });
        }
        const newRecord: WalletRecord = {
          ...record,
          walletId: wallet.id,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ records: [...s.records, newRecord] }));
        pushActivity({
          type: "wallet",
          title: newRecord.type === "income" ? "Income recorded" : "Expense recorded",
          detail: newRecord.description + " " + formatPHP(newRecord.amount),
        });
        return newRecord;
      },
      updateRecord: (id, updates) => {
        set((s) => ({
          records: s.records.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          ),
        }));
        const rec = get().records.find((r) => r.id === id);
        if (rec) {
          pushActivity({
            type: "wallet",
            title: "Transaction updated",
            detail: rec.description + " " + formatPHP(rec.amount),
          });
        }
      },
      deleteRecord: (id) => {
        const rec = get().records.find((r) => r.id === id);
        set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
        if (rec) {
          pushActivity({
            type: "wallet",
            title: rec.type === "income" ? "Income deleted" : "Expense deleted",
            detail: rec.description + " " + formatPHP(rec.amount),
          });
        }
      },
      getBalance: () => fromCents(get().records.reduce((sum, r) => {
        if (r.type === "transfer") return sum;
        return sum + (r.type === "income" ? toCents(r.amount) : -toCents(r.amount));
      }, 0)),
      getMonthlyIncome: () => {
        const month = new Date().toISOString().slice(0, 7);
        return get().records
          .filter((r) => r.type === "income" && r.date.startsWith(month) && !isStartingBalanceRecord(r))
          .reduce((sum, r) => sum + r.amount, 0);
      },
      getMonthlyExpense: () => {
        const month = new Date().toISOString().slice(0, 7);
        return get().records
          .filter((r) => r.type === "expense" && r.date.startsWith(month))
          .reduce((sum, r) => sum + r.amount, 0);
      },
      getTodaysExpense: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().records
          .filter((r) => r.type === "expense" && r.date === today)
          .reduce((sum, r) => sum + r.amount, 0);
      },
      getWeeklyExpense: () => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        return get().records
          .filter((r) => r.type === "expense" && r.date >= sevenDaysAgo)
          .reduce((sum, r) => sum + r.amount, 0);
      },
      getSpendingByCategory: () => {
        const month = new Date().toISOString().slice(0, 7);
        const map: Record<string, number> = {};
        get().records
          .filter((r) => r.type === "expense" && r.date.startsWith(month))
          .forEach((r) => {
            map[r.category] = (map[r.category] || 0) + r.amount;
          });
        return Object.entries(map)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount);
      },
      getIncomeByCategory: () => {
        const month = new Date().toISOString().slice(0, 7);
        const map: Record<string, number> = {};
        get().records
          .filter((r) => r.type === "income" && r.date.startsWith(month) && !isStartingBalanceRecord(r))
          .forEach((r) => {
            map[r.category] = (map[r.category] || 0) + r.amount;
          });
        return Object.entries(map)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount);
      },
      getBudgetProgress: (category) => {
        const budget = get().budgets.find((b) => b.category === category);
        if (!budget) return null;
        const month = new Date().toISOString().slice(0, 7);
        const spent = get().records
          .filter((r) => r.category === category && r.type === "expense" && r.date.startsWith(month))
          .reduce((sum, r) => sum + r.amount, 0);
        const remaining = budget.limit - spent;
        const percentage = budget.limit > 0 ? ((Math.min(spent, budget.limit) / budget.limit) * 100).toFixed(1) : "0";
        return {
          budget: budget.limit,
          spent,
          remaining,
          percentage,
        };
      },
      setBudget: (budget) => {
        set((s) => ({ budgets: [...s.budgets, budget] }));
        pushActivity({
          type: "wallet",
          title: "Budget created",
          detail: budget.category + " limit " + formatPHP(budget.limit),
        });
      },
      updateBudget: (id, limit) => {
        set((s) => ({
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, limit, updatedAt: new Date().toISOString() } : b)),
        }));
        const bud = get().budgets.find((b) => b.id === id);
        if (bud) {
          pushActivity({
            type: "wallet",
            title: "Budget updated",
            detail: bud.category + " limit " + formatPHP(limit),
          });
        }
      },
      deleteBudget: (id) => {
        const bud = get().budgets.find((b) => b.id === id);
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
        if (bud) {
          pushActivity({
            type: "wallet",
            title: "Budget deleted",
            detail: bud.category,
          });
        }
      },
      addWallet: (name, type, initialAmount = 0) => {
        const now = nowIso();
        const wallet: Wallet = {
          id: generateId(),
          name: name.trim() || "Wallet",
          type,
          currency: "PHP",
          icon: type === "cash" ? "Wallet" : type === "bank" ? "Landmark" : "Smartphone",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ wallets: [...s.wallets, wallet] }));
        if (initialAmount > 0) get().setStartingBalanceForWallet(wallet.id, initialAmount);
        pushActivity({
          type: "wallet",
          title: "Wallet added",
          detail: wallet.name,
        });
        return wallet;
      },
      updateWallet: (id, updates) => {
        set((s) => ({
          wallets: s.wallets.map((wallet) =>
            wallet.id === id
              ? { ...wallet, ...updates, name: updates.name?.trim() || wallet.name, updatedAt: nowIso() }
              : wallet
          ),
        }));
      },
      deleteWallet: (id) => {
        if (get().wallets.length <= 1) throw new Error("Keep at least one wallet");
        const wallet = get().wallets.find((item) => item.id === id);
        if (!wallet) return;
        set((s) => ({
          wallets: s.wallets.filter((item) => item.id !== id),
          records: s.records.filter((record) => record.walletId !== id),
        }));
        pushActivity({ type: "wallet", title: "Wallet deleted", detail: wallet.name });
      },
      setStartingBalanceForWallet: (walletId, amount) => {
        if (!get().wallets.some((wallet) => wallet.id === walletId)) throw new Error("Wallet not found");
        if (!Number.isFinite(amount) || amount < 0) throw new Error("Starting balance must be zero or greater");
        const now = nowIso();
        const record: WalletRecord = {
          id: `starting-balance:${walletId}`,
          walletId,
          date: now.slice(0, 10),
          time: now.slice(11, 19),
          description: "Starting Balance",
          category: "Salary",
          amount,
          type: "income",
          cashGiven: 0,
          change: 0,
          note: "Initial starting balance",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          startingBalance: s.wallets[0]?.id === walletId ? amount : s.startingBalance,
          records: [...s.records.filter((item) => item.id !== record.id), record],
        }));
      },
      transferMoney: (sourceWalletId, destinationWalletId, amount, note) => {
        if (sourceWalletId === destinationWalletId) throw new Error("Choose two different wallets");
        if (!get().wallets.some((wallet) => wallet.id === sourceWalletId) || !get().wallets.some((wallet) => wallet.id === destinationWalletId)) {
          throw new Error("Wallet not found");
        }
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("Transfer amount must be greater than zero");
        if (get().getWalletBalance(sourceWalletId) < amount) throw new Error("Insufficient wallet balance");
        const now = nowIso();
        const source = get().wallets.find((wallet) => wallet.id === sourceWalletId)!;
        const destination = get().wallets.find((wallet) => wallet.id === destinationWalletId)!;
        const record: WalletRecord = {
          id: generateId(),
          walletId: sourceWalletId,
          destinationWalletId,
          date: now.slice(0, 10),
          time: now.slice(11, 19),
          description: `Transfer to ${destination.name}`,
          category: "Transfer",
          amount,
          type: "transfer",
          note,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ records: [...s.records, record] }));
        pushActivity({
          type: "wallet",
          title: "Money transferred",
          detail: `${source.name} → ${destination.name} ${formatPHP(amount)}`,
        });
      },
      getWalletBalance: (walletId) => fromCents(get().records.reduce((sum, record) => {
        if (record.walletId === walletId && record.type !== "transfer") {
          return sum + (record.type === "income" ? toCents(record.amount) : -toCents(record.amount));
        }
        if (record.type === "transfer" && record.walletId === walletId) return sum - toCents(record.amount);
        if (record.type === "transfer" && record.destinationWalletId === walletId) return sum + toCents(record.amount);
        return sum;
      }, 0)),
      getTotalBalance: () => fromCents(get().records.reduce((sum, record) => {
        if (record.type === "transfer") return sum;
        return sum + (record.type === "income" ? toCents(record.amount) : -toCents(record.amount));
      }, 0)),
      getWalletTransactions: (walletId) => get().records.filter((record) =>
        record.walletId === walletId || (record.type === "transfer" && record.destinationWalletId === walletId)
      ),
      getTransfers: () => get().records.filter((record) => record.type === "transfer"),
    }),
    {
      name: "cova-wallet-store",
      partialize: (state) => ({
        wallets: state.wallets,
        records: state.records,
        startingBalance: state.startingBalance,
        budgets: state.budgets,
      }),
    }
  )
);
