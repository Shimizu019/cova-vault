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

// Direct native writes via Capacitor Preferences. We do NOT queue writes because
// queued writes can be lost if the app closes before the queue drains.
// Capacitor bridge calls are synchronous from the JS perspective.

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
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
    getItem: (key) => {
      if (cache.has(key)) {
        const val = cache.get(key)!;
        log('getItem(native:cache)', key, `${val.length} chars`);
        return val;
      }
      // Synchronous fallback: read from cache only
      // Native reads happen during initStorage()
      log('getItem(native:cache)', key, 'miss, returning null');
      return null;
    },
    setItem: (key, value) => {
      log('setItem(native)', key, `${value.length} chars`, 'writing directly');
      cache.set(key, value);
      try {
        Preferences.set({ key, value });
        log('setItem(native)', key, 'SUCCESS');
      } catch (err) {
        logError('setItem(native) failed', key, err);
      }
    },
    removeItem: (key) => {
      log('removeItem(native)', key, 'writing directly');
      cache.delete(key);
      try {
        Preferences.remove({ key });
        log('removeItem(native)', key, 'SUCCESS');
      } catch (err) {
        logError('removeItem(native) failed', key, err);
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
