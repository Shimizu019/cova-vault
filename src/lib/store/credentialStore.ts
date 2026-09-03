import { create } from "zustand";
import type { Credential, ActivityItem, Folder } from "../types";
import { generateId } from "../utils";
import { persist } from "zustand/middleware";

interface CredentialState {
  credentials: Credential[];
  folders: Folder[];
  activities: ActivityItem[];

  addCredential: (cred: Omit<Credential, "id" | "createdAt" | "updatedAt">) => Credential;
  updateCredential: (id: string, updates: Partial<Credential>) => void;
  deleteCredential: (id: string) => void;
  toggleFavorite: (id: string) => void;
  moveCredentialToFolder: (id: string, folderId: string | undefined) => void;

  addFolder: (name: string, type?: Folder["type"]) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  getCredentialById: (id: string) => Credential | undefined;
  getCredentialsByFolder: (folderId?: string) => Credential[];
  getFolderById: (id: string) => Folder | undefined;
  getFolderCount: (id: string) => number;
  getFavoriteCredentials: () => Credential[];
  getAllTags: () => string[];

  addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void;
  clearActivities: () => void;
}

export const useCredentialStore = create<CredentialState>()(
  persist(
    (set, get) => ({
      credentials: [],
      folders: [],
      activities: [],

      addCredential: (cred) => {
        const now = new Date().toISOString();
        const newCred: Credential = { ...cred, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ credentials: [newCred, ...s.credentials] }));
        get().addActivity({ type: "credentials", title: "Created credential", detail: cred.name });
        return newCred;
      },

      updateCredential: (id, updates) => {
        set((s) => ({
          credentials: s.credentials.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
        const cred = get().credentials.find((c) => c.id === id);
        if (cred) get().addActivity({ type: "credentials", title: "Updated credential", detail: cred.name });
      },

      deleteCredential: (id) => {
        const cred = get().credentials.find((c) => c.id === id);
        set((s) => ({ credentials: s.credentials.filter((c) => c.id !== id) }));
        if (cred) get().addActivity({ type: "credentials", title: "Deleted credential", detail: cred.name });
      },

      toggleFavorite: (id) => {
        set((s) => ({
          credentials: s.credentials.map((c) =>
            c.id === id ? { ...c, favorite: !c.favorite, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      moveCredentialToFolder: (id, folderId) => {
        set((s) => ({
          credentials: s.credentials.map((c) =>
            c.id === id ? { ...c, folderId, updatedAt: new Date().toISOString() } : c
          ),
        }));
        const cred = get().credentials.find((c) => c.id === id);
        const folder = folderId ? get().folders.find((f) => f.id === folderId) : null;
        if (cred) {
          get().addActivity({
            type: "credentials",
            title: "Moved credential",
            detail: cred.name + " to " + (folder ? folder.name : "No Folder"),
          });
        }
      },

      addFolder: (name, type = "mixed") => {
        const newFolder: Folder = { id: generateId(), name, type, createdAt: new Date().toISOString() };
        set((s) => ({ folders: [...s.folders, newFolder] }));
        get().addActivity({ type: "credentials", title: "Created folder", detail: name });
        return newFolder;
      },

      renameFolder: (id, name) => {
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        }));
        get().addActivity({ type: "credentials", title: "Renamed folder", detail: name });
      },

      deleteFolder: (id) => {
        const folder = get().folders.find((f) => f.id === id);
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          credentials: s.credentials.map((c) =>
            c.folderId === id ? { ...c, folderId: undefined } : c
          ),
        }));
        if (folder) get().addActivity({ type: "credentials", title: "Deleted folder", detail: folder.name });
      },

      getCredentialById: (id) => get().credentials.find((c) => c.id === id),
      getCredentialsByFolder: (folderId) =>
        get().credentials.filter((c) => c.folderId === folderId),
      getFolderById: (id) => get().folders.find((f) => f.id === id),
      getFolderCount: (id) => get().credentials.filter((c) => c.folderId === id).length,
      getFavoriteCredentials: () => get().credentials.filter((c) => c.favorite),
      getAllTags: () => [...new Set(get().credentials.flatMap((c) => c.tags))],

      addActivity: (activity) => {
        const newActivity: ActivityItem = { ...activity, id: generateId(), timestamp: new Date().toISOString() };
        set((s) => ({ activities: [newActivity, ...s.activities].slice(0, 100) }));
      },

      clearActivities: () => set({ activities: [] }),
    }),
    {
      name: "cova-credential-store",
      // Persist all state including folders
      partialize: (state) => ({
        credentials: state.credentials,
        folders: state.folders,
        activities: state.activities,
      }),
    }
  )
);