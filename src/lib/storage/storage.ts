import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isPluginAvailable('Preferences');

const DEBUG = true;

function log(...args: unknown[]) {
  if (DEBUG) console.log('[storage]', ...args);
}

function logError(...args: unknown[]) {
  if (DEBUG) console.error('[storage]', ...args);
}

export interface StorageLike {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

function createLocalStorageAdapter(): StorageLike {
  return {
    getItem: (key) => {
      const val = localStorage.getItem(key);
      log('getItem(localStorage)', key, val ? `${val.length} chars` : 'null');
      return val;
    },
    setItem: (key, value) => {
      log('setItem(localStorage)', key, `${value.length} chars`);
      localStorage.setItem(key, value);
    },
    removeItem: (key) => {
      log('removeItem(localStorage)', key);
      localStorage.removeItem(key);
    },
  };
}

function createNativeAdapter(): StorageLike {
  const cache = new Map<string, string>();

  return {
    getItem: async (key) => {
      if (cache.has(key)) {
        const val = cache.get(key)!;
        log('getItem(native:cache)', key, `${val.length} chars`);
        return val;
      }
      // Fallback: read directly from Preferences if not in cache
      try {
        log('getItem(native:preferences)', key, 'reading...');
        const item = await Preferences.get({ key });
        if (item.value !== null) {
          cache.set(key, item.value);
          log('getItem(native:preferences)', key, `${item.value.length} chars`, 'cached');
          return item.value;
        }
        log('getItem(native:preferences)', key, 'null');
      } catch (err) {
        logError('getItem failed', key, err);
      }
      return null;
    },
    setItem: async (key, value) => {
      log('setItem(native)', key, `${value.length} chars`, 'writing...');
      cache.set(key, value);
      try {
        await Preferences.set({ key, value });
        log('setItem(native)', key, 'SUCCESS');
      } catch (err) {
        logError('setItem failed', key, err);
        throw err;
      }
    },
    removeItem: async (key) => {
      log('removeItem(native)', key);
      cache.delete(key);
      try {
        await Preferences.remove({ key });
        log('removeItem(native)', key, 'SUCCESS');
      } catch (err) {
        logError('removeItem failed', key, err);
        throw err;
      }
    },
  };
}

const nativeAdapter = createNativeAdapter();

export function getStorage(): StorageLike {
  const adapter = isNative ? nativeAdapter : createLocalStorageAdapter();
  log('getStorage()', isNative ? 'native' : 'web');
  return adapter;
}

export async function initStorage(): Promise<void> {
  if (!isNative) {
    log('initStorage: web platform, skipping');
    return;
  }

  log('initStorage: starting...');
  try {
    const result = await Preferences.keys();
    log('initStorage: found keys', result.keys.length, result.keys);
    for (const key of result.keys) {
      const item = await Preferences.get({ key });
      if (item.value !== null) {
        nativeAdapter.setItem(key, item.value);
        log('initStorage: cached', key, `${item.value.length} chars`);
      }
    }
    log('initStorage: complete');
  } catch (err) {
    logError('initStorage failed', err);
  }
}

export { isNative };
