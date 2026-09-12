import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isPluginAvailable('Preferences');

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createLocalStorageAdapter(): StorageLike {
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  };
}

function createNativeAdapter(): StorageLike {
  const cache = new Map<string, string>();

  return {
    getItem: (key) => {
      if (cache.has(key)) return cache.get(key)!;
      return null;
    },
    setItem: (key, value) => {
      cache.set(key, value);
      Preferences.set({ key, value }).catch((err: unknown) => console.error('[storage] setItem failed', err));
    },
    removeItem: (key) => {
      cache.delete(key);
      Preferences.remove({ key }).catch((err: unknown) => console.error('[storage] removeItem failed', err));
    },
  };
}

const nativeAdapter = createNativeAdapter();

export function getStorage(): StorageLike {
  return isNative ? nativeAdapter : createLocalStorageAdapter();
}

export async function initStorage(): Promise<void> {
  if (!isNative) return;

  const result = await Preferences.keys();
  for (const key of result.keys) {
    const item = await Preferences.get({ key });
    if (item.value !== null) {
      nativeAdapter.setItem(key, item.value);
    }
  }
}

export { isNative };
