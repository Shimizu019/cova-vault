import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, ActivityItem } from "../types";
import { generateId } from "../utils";
import { useCredentialStore } from "./credentialStore";

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleStatus: (id: string) => void;
  getOpenTasks: () => Task[];
}

const pushActivity = (activity: Omit<ActivityItem, "id" | "timestamp">) => {
  try {
    useCredentialStore.getState().addActivity(activity);
  } catch (e) {
    // silently fail if store is not yet initialized
  }
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: (task) => {
        const now = new Date().toISOString();
        const newTask: Task = { ...task, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ tasks: [newTask, ...s.tasks] }));
        pushActivity({ type: "tasks", title: "Task created", detail: task.title });
        return newTask;
      },
      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          pushActivity({ type: "tasks", title: "Task updated", detail: task.title });
        }
      },
      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        if (task) {
          pushActivity({ type: "tasks", title: "Task deleted", detail: task.title });
        }
      },
      toggleStatus: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const statuses: Task["status"][] = ["todo", "in_progress", "done"];
            const next = statuses[(statuses.indexOf(t.status) + 1) % statuses.length];
            return { ...t, status: next, updatedAt: new Date().toISOString() };
          }),
        }));
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          const labelMap: Record<Task["status"], string> = {
            todo: "To-do",
            in_progress: "In progress",
            done: "Completed",
          };
          pushActivity({
            type: "tasks",
            title: "Task moved to " + labelMap[task.status],
            detail: task.title,
          });
        }
      },
      getOpenTasks: () => get().tasks.filter((t) => t.status !== "done"),
    }),
    { name: "cova-task-store" }
  )
);