import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNativePlatform = Capacitor.isNativePlatform();
const isNative = Capacitor.isPluginAvailable('Preferences') && isNativePlatform;

const DEBUG = true;

function log(...args: unknown[]) {
  if (DEBUG) console.log('[storage]', ...args);
}

function logError(...args: unknown[]) {
  if (DEBUG) console.error('[storage]', ...args);
}

// Native Preferences writes are serialized so callers can flush them before
// locking or closing the vault.

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

interface NativeStorageLike extends StorageLike {
  cacheItem(key: string, value: string): void;
}

let nativeAdapterFlush: () => Promise<void> = async () => undefined;

function createLocalStorageAdapter(): StorageLike {
  return {
    getItem: (key) => {
      const val = localStorage.getItem(key);
      log('getItem(localStorage)', key, val ? `${val.length} chars` : 'null');
      return val;
    },
    setItem: async (key, value) => {
      log('setItem(localStorage)', key, `${value.length} chars`);
      localStorage.setItem(key, value);
    },
    removeItem: async (key) => {
      log('removeItem(localStorage)', key);
      localStorage.removeItem(key);
    },
  };
}

function createNativeAdapter(): NativeStorageLike {
  const cache = new Map<string, string>();
  const inFlight = new Set<Promise<void>>();

  const track = (write: Promise<void>): Promise<void> => {
    inFlight.add(write);
    void write.catch(() => undefined).finally(() => inFlight.delete(write));
    return write;
  };

  const adapter: NativeStorageLike = {
    cacheItem: (key, value) => {
      cache.set(key, value);
    },
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
      // Update the read cache first so immediate reads see the new value.
      cache.set(key, value);
      log('setItem(native)', key, `${value.length} chars`, 'writing');

      // Write DIRECTLY — no serialization queue. A queued write could still be
      // pending when Android kills the process (swipe-away / force-close), which
      // would silently lose the record. Rejections are propagated to the caller
      // instead of being swallowed, so a failed write can never be mistaken for
      // a successful save.
      const write = (async () => {
        await Preferences.set({ key, value });
        log('setItem(native)', key, 'SUCCESS');
      })();

      return track(write);
    },
    removeItem: (key) => {
      cache.delete(key);
      log('removeItem(native)', key, 'removing');
      const write = (async () => {
        await Preferences.remove({ key });
        log('removeItem(native)', key, 'SUCCESS');
      })();
      return track(write);
    },
  };

  nativeAdapterFlush = async () => {
    while (inFlight.size > 0) {
      await Promise.allSettled([...inFlight]);
    }
  };
  return adapter;
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
        // Hydration populates the synchronous cache without scheduling a rewrite.
        (nativeAdapter as NativeStorageLike).cacheItem(key, item.value);
        log('initStorage: cached', key, `${item.value.length} chars`);
      }
    }
    log('initStorage: complete');
  } catch (err) {
    logError('initStorage failed', err);
  }
}

export async function flushStorage(): Promise<void> {
  if (!isNative) return;
  log('flushStorage: waiting for pending native writes');
  await nativeAdapterFlush();
  log('flushStorage: complete');
}

export { isNative };
