import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note } from '../types';
import { generateId } from '../utils';

interface NoteState {
  notes: Note[];

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      notes: [],

      addNote: (note) => {
        const now = new Date().toISOString();
        const newNote: Note = { ...note, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ notes: [newNote, ...s.notes] }));
        return newNote;
      },

      updateNote: (id, updates) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        })),

      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      toggleFavorite: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, favorite: !n.favorite } : n)),
        })),
    }),
    { name: 'cova-note-store' }
  )
);