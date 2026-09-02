import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task } from '../types';
import { generateId } from '../utils';

interface TaskState {
  tasks: Task[];

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleStatus: (id: string) => void;
  getOpenTasks: () => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (task) => {
        const now = new Date().toISOString();
        const newTask: Task = { ...task, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ tasks: [newTask, ...s.tasks] }));
        return newTask;
      },

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      toggleStatus: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const statuses: Task['status'][] = ['todo', 'in_progress', 'done'];
            const next = statuses[(statuses.indexOf(t.status) + 1) % statuses.length];
            return { ...t, status: next, updatedAt: new Date().toISOString() };
          }),
        })),

      getOpenTasks: () => get().tasks.filter((t) => t.status !== 'done'),
    }),
    { name: 'cova-task-store' }
  )
);