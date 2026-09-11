import { create } from "zustand";
import type { Note, Folder, ActivityItem } from "../types";
import { generateId } from "../utils";
import { useActivityStore } from "./activityStore";
import { encryptedPersist } from "../crypto/encryptedStorage";

interface NoteState {
  notes: Note[];
  folders: Folder[];

  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  toggleFavorite: (id: string) => void;

  moveNoteToFolder: (id: string, folderId: string | undefined) => void;
  addFolder: (name: string, type?: Folder["type"]) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
}

const pushActivity = (activity: Omit<ActivityItem, "id" | "timestamp">) => {
  try {
    useActivityStore.getState().addActivity(activity);
  } catch {
    // silently fail if store is not yet initialized
  }
};

export const useNoteStore = create<NoteState>()(
  encryptedPersist(
    (set, get) => ({
      notes: [],
      folders: [],

      addNote: (note) => {
        const now = new Date().toISOString();
        const newNote: Note = { ...note, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ notes: [newNote, ...s.notes] }));
        pushActivity({ type: "notes", title: "Note created", detail: note.title });
        return newNote;
      },
      updateNote: (id, updates) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        }));
        const note = get().notes.find((n) => n.id === id);
        if (note) {
          pushActivity({ type: "notes", title: "Note updated", detail: note.title });
        }
      },
      deleteNote: (id) => {
        const note = get().notes.find((n) => n.id === id);
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        if (note) {
          pushActivity({ type: "notes", title: "Note deleted", detail: note.title });
        }
      },
      toggleFavorite: (id) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, favorite: !n.favorite, updatedAt: new Date().toISOString() } : n
          ),
        }));
        const note = get().notes.find((n) => n.id === id);
        if (note) {
          pushActivity({
            type: "notes",
            title: note.favorite ? "Note unfavorited" : "Note favorited",
            detail: note.title,
          });
        }
      },

      moveNoteToFolder: (id, folderId) => {
        const note = get().notes.find((n) => n.id === id);
        const folder = folderId ? get().folders.find((f) => f.id === folderId) : null;
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, folderId, updatedAt: new Date().toISOString() } : n
          ),
        }));
        if (note) {
          pushActivity({
            type: "notes",
            title: "Moved note",
            detail: note.title + " to " + (folder ? folder.name : "No Folder"),
          });
        }
      },

      addFolder: (name, type = "notes") => {
        const newFolder: Folder = { id: generateId(), name, type, createdAt: new Date().toISOString() };
        set((s) => ({ folders: [...s.folders, newFolder] }));
        pushActivity({ type: "notes", title: "Created folder", detail: name });
        return newFolder;
      },

      renameFolder: (id, name) => {
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        }));
        pushActivity({ type: "notes", title: "Renamed folder", detail: name });
      },

      deleteFolder: (id) => {
        const folder = get().folders.find((f) => f.id === id);
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          notes: s.notes.map((n) =>
            n.folderId === id ? { ...n, folderId: undefined, updatedAt: new Date().toISOString() } : n
          ),
        }));
        if (folder) {
          pushActivity({ type: "notes", title: "Deleted folder", detail: folder.name });
        }
      },
    }),
    {
      name: "cova-note-store",
      partialize: (state) => ({
        notes: state.notes,
        folders: state.folders,
      }),
    }
  )
);
