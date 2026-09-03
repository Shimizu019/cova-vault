import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WalletRecord, Budget, ActivityItem } from "../types";
import { generateId, formatPHP } from "../utils";
import { useCredentialStore } from "./credentialStore";

export interface WalletState {
  records: WalletRecord[];
  startingBalance: number;
  budgets: Budget[];
  setStartingBalance: (amount: number) => void;
  addRecord: (record: Omit<WalletRecord, "id" | "createdAt" | "updatedAt">) => WalletRecord;
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
}

/** Helper to add a wallet activity to the credential store */
const pushActivity = (activity: Omit<ActivityItem, "id" | "timestamp">) => {
  try {
    useCredentialStore.getState().addActivity(activity);
  } catch (e) {
    // silently fail if store is not yet initialized
  }
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      records: [],
      startingBalance: 0,
      budgets: [],
      setStartingBalance: (amount) => {
        set((s) => {
          const filtered = s.records.filter((r) => r.id !== "starting-balance");
          const now = new Date().toISOString();
          const date = now.split("T")[0];
          const time = now.split("T")[1].split(".")[0];
          const startingRecord: WalletRecord = {
            id: "starting-balance",
            date,
            time,
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
          return {
            startingBalance: amount,
            records: [...filtered, startingRecord],
          };
        });
        pushActivity({
          type: "wallet",
          title: "Wallet created",
          detail: "Set starting balance to " + formatPHP(amount),
        });
      },
      addRecord: (record) => {
        const now = new Date().toISOString();
        const newRecord: WalletRecord = {
          ...record,
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
      getBalance: () => {
        return get().records.reduce((sum, r) => {
          return sum + (r.type === "income" ? r.amount : -r.amount);
        }, 0);
      },
      getMonthlyIncome: () => {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        return get().records
          .filter((r) => r.type === "income" && r.date >= startOfMonth && r.id !== "starting-balance")
          .reduce((sum, r) => sum + r.amount, 0);
      },
      getMonthlyExpense: () => {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        return get().records
          .filter((r) => r.type === "expense" && r.date >= startOfMonth)
          .reduce((sum, r) => sum + r.amount, 0);
      },
      getTodaysExpense: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().records
          .filter((r) => r.type === "expense" && r.date === today)
          .reduce((sum, r) => sum + r.amount, 0);
      },
      getWeeklyExpense: () => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        return get().records
          .filter((r) => r.type === "expense" && r.date >= sevenDaysAgo)
          .reduce((sum, r) => sum + r.amount, 0);
      },
      getSpendingByCategory: () => {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const map: Record<string, number> = {};
        get().records
          .filter((r) => r.type === "expense" && r.date >= startOfMonth)
          .forEach((r) => {
            map[r.category] = (map[r.category] || 0) + r.amount;
          });
        return Object.entries(map)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount);
      },
      getIncomeByCategory: () => {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const map: Record<string, number> = {};
        get().records
          .filter((r) => r.type === "income" && r.date >= startOfMonth && r.id !== "starting-balance")
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
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const spent = get().records
          .filter((r) => r.category === category && r.type === "expense" && r.date >= startOfMonth)
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
    }),
    { name: "cova-wallet-store" }
  )
);