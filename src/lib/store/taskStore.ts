import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, Folder, ActivityItem } from "../types";
import { generateId } from "../utils";
import { useActivityStore } from "./activityStore";

interface TaskState {
  tasks: Task[];
  folders: Folder[];

  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleStatus: (id: string) => void;
  getOpenTasks: () => Task[];

  moveTaskToFolder: (id: string, folderId: string | undefined) => void;
  addFolder: (name: string, type?: Folder["type"]) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
}

const pushActivity = (activity: Omit<ActivityItem, "id" | "timestamp">) => {
  try {
    useActivityStore.getState().addActivity(activity);
  } catch (e) {
    // silently fail if store is not yet initialized
  }
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      folders: [],

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

      moveTaskToFolder: (id, folderId) => {
        const task = get().tasks.find((t) => t.id === id);
        const folder = folderId ? get().folders.find((f) => f.id === folderId) : null;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, folderId, updatedAt: new Date().toISOString() } : t
          ),
        }));
        if (task) {
          pushActivity({
            type: "tasks",
            title: "Moved task",
            detail: task.title + " to " + (folder ? folder.name : "No Folder"),
          });
        }
      },

      addFolder: (name, type = "tasks") => {
        const newFolder: Folder = { id: generateId(), name, type, createdAt: new Date().toISOString() };
        set((s) => ({ folders: [...s.folders, newFolder] }));
        pushActivity({ type: "tasks", title: "Created folder", detail: name });
        return newFolder;
      },

      renameFolder: (id, name) => {
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        }));
        pushActivity({ type: "tasks", title: "Renamed folder", detail: name });
      },

      deleteFolder: (id) => {
        const folder = get().folders.find((f) => f.id === id);
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          tasks: s.tasks.map((t) =>
            t.folderId === id ? { ...t, folderId: undefined, updatedAt: new Date().toISOString() } : t
          ),
        }));
        if (folder) {
          pushActivity({ type: "tasks", title: "Deleted folder", detail: folder.name });
        }
      },
    }),
    {
      name: "cova-task-store",
      partialize: (state) => ({
        tasks: state.tasks,
        folders: state.folders,
      }),
    }
  )
);
