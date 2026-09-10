import { create } from 'zustand';
import type { AppSettings, User } from '../types';
import { encryptedPersist } from '../crypto/encryptedStorage';

interface SettingsState {
  settings: AppSettings;
  user: User;

  updateSettings: (updates: Partial<AppSettings>) => void;
  updateUser: (updates: Partial<User>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  accentColor: 'violet',
  fontSize: 'medium',
  layoutDensity: 'comfortable',
  language: 'en',
  notifications: true,
  twoFactorEnabled: false,
  backupEnabled: false,
  autoLock: true,
  autoLockTimeout: 5 * 60 * 1000,
  showPasswords: false,
  clipboardClearDelay: 30 * 1000,
};

const defaultUser: User = {
  id: 'user-1',
  name: 'Cova User',
  displayName: 'Cova User',
  email: 'user@cova.app',
  avatarInitial: 'CU',
  createdAt: new Date().toISOString(),
};

export const useSettingsStore = create<SettingsState>()(
  encryptedPersist(
    (set) => ({
      settings: defaultSettings,
      user: defaultUser,

      updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

      resetSettings: () => set({ settings: defaultSettings }),
    }),
    { name: 'cova-settings-store' }
  )
);