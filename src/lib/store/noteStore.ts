import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Note, ActivityItem } from "../types";
import { generateId } from "../utils";
import { useCredentialStore } from "./credentialStore";

interface NoteState {
  notes: Note[];
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

const pushActivity = (activity: Omit<ActivityItem, "id" | "timestamp">) => {
  try {
    useCredentialStore.getState().addActivity(activity);
  } catch (e) {
    // silently fail if store is not yet initialized
  }
};

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
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
    }),
    { name: "cova-note-store" }
  )
);