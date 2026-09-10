import { create } from 'zustand';
import type { ToastMessage } from '../types';
import { generateId } from '../utils';
import { encryptedPersist } from '../crypto/encryptedStorage';

interface UIState {
  sidebarCollapsed: boolean;
  searchQuery: string;
  toasts: ToastMessage[];
  passwordVisibility: Record<string, boolean>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchQuery: (query: string) => void;
  addToast: (message: string, type?: ToastMessage['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  togglePasswordVisibility: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  encryptedPersist(
    (set) => ({
      sidebarCollapsed: false,
      searchQuery: '',
      toasts: [],
      passwordVisibility: {},

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      addToast: (message, type = 'info', duration) => {
        const id = generateId();
        const toastDuration = duration ?? 3500;
        const toast: ToastMessage = { id, message, type, duration: toastDuration };
        set((s) => ({ toasts: [...s.toasts, toast] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, toastDuration);
      },

      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      togglePasswordVisibility: (id) =>
        set((s) => ({
          passwordVisibility: { ...s.passwordVisibility, [id]: !s.passwordVisibility[id] },
        })),
    }),
    { name: 'cova-ui-store' }
  )
);