import { deriveKey } from './vaultCrypto';
import { getStorage } from '../storage/storage';

const storage = getStorage();

const DEBUG = true;

function log(...args: unknown[]) {
  if (DEBUG) console.log('[vaultStorage]', ...args);
}

function logError(...args: unknown[]) {
  if (DEBUG) console.error('[vaultStorage]', ...args);
}

type Listener = () => void;

interface VaultStorageEngine {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  subscribe: (key: string, listener: Listener) => () => void;
}

let vaultKey: CryptoKey | null = null;
const VAULT_SALT_KEY = 'cova:vault-salt';

export function setVaultKey(key: CryptoKey | null) {
  log('setVaultKey', key ? 'SET' : 'CLEARED');
  vaultKey = key;
}

export function getVaultKey(): CryptoKey | null {
  return vaultKey;
}

export function isVaultUnlocked(): boolean {
  return vaultKey !== null;
}

const PERSISTED_STORE_KEYS = [
  'cova-credential-store',
  'cova-note-store',
  'cova-task-store',
  'cova-wallet-store',
  'cova-savings-store',
  'cova-activity-store',
  'cova-settings-store',
];

export async function logVaultDataMetadata(stage: string): Promise<void> {
  const summary: Record<string, unknown> = {};
  for (const key of PERSISTED_STORE_KEYS) {
    const raw = storage.getItem(key);
    if (!raw) {
      summary[key] = { present: false };
      continue;
    }

    const metadata: Record<string, unknown> = { present: true, encryptedChars: raw.length };
    if (vaultKey) {
      try {
        const parsed = JSON.parse(await decryptPayload(raw)) as Record<string, unknown>;
        for (const field of ['credentials', 'notes', 'tasks', 'records', 'budgets', 'goals', 'activities']) {
          const value = parsed[field];
          if (Array.isArray(value)) metadata[`${field}Count`] = value.length;
        }
      } catch {
        metadata.decryptable = false;
      }
    }
    summary[key] = metadata;
  }
  log('metadata', stage, summary);
}

export async function getOrCreateVaultSalt(): Promise<Uint8Array> {
  log('getOrCreateVaultSalt: reading...');
  const existing = await storage.getItem(VAULT_SALT_KEY);
  if (existing) {
    log('getOrCreateVaultSalt: found existing');
    const decoded = atob(existing);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  }

  log('getOrCreateVaultSalt: generating new salt');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  await storage.setItem(VAULT_SALT_KEY, btoa(String.fromCharCode(...salt)));
  log('getOrCreateVaultSalt: new salt saved');
  return salt;
}

export async function setVaultSalt(salt: Uint8Array): Promise<void> {
  log('setVaultSalt: saving');
  await storage.setItem(VAULT_SALT_KEY, btoa(String.fromCharCode(...salt)));
  log('setVaultSalt: saved');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptPayload(plaintext: string): Promise<string> {
  if (!vaultKey) {
    throw new Error('Vault is locked');
  }

  log('encryptPayload: encrypting', `${plaintext.length} chars`);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    vaultKey,
    encoded
  );

  const payload = {
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    data: arrayBufferToBase64(ciphertext),
  };

  const result = JSON.stringify(payload);
  log('encryptPayload: done', `${result.length} chars`);
  return result;
}

export async function decryptPayload(encrypted: string): Promise<string> {
  if (!vaultKey) {
    throw new Error('Vault is locked');
  }

  log('decryptPayload: decrypting', `${encrypted.length} chars`);
  try {
    const payload = JSON.parse(encrypted);
    const iv = base64ToBuffer(payload.iv);
    const data = base64ToBuffer(payload.data);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      vaultKey,
      data.buffer as ArrayBuffer
    );
    const result = new TextDecoder().decode(decrypted);
    log('decryptPayload: success', `${result.length} chars`);
    return result;
  } catch (err) {
    logError('decryptPayload: failed', err);
    return encrypted;
  }
}

export const vaultStorage: VaultStorageEngine = {
  async getItem(key) {
    log('getItem', key, 'vaultKey:', vaultKey ? 'SET' : 'NULL');
    if (!vaultKey) {
      log('getItem', key, 'vault locked, returning null');
      return null;
    }
    const raw = storage.getItem(key);
    if (!raw) {
      log('getItem', key, 'no data in storage');
      return null;
    }
    log('getItem', key, 'found encrypted data', `${raw.length} chars`);
    try {
      return await decryptPayload(raw);
    } catch (err) {
      logError('getItem decrypt failed', key, err);
      return null;
    }
  },

  async setItem(key, value) {
    log('setItem', key, 'plaintext', `${value.length} chars`);
    const encrypted = await encryptPayload(value);
    log('setItem', key, 'encrypted', `${encrypted.length} chars`, 'writing...');
    await storage.setItem(key, encrypted);
    log('setItem', key, 'SUCCESS');
  },

  async removeItem(key) {
    log('removeItem', key);
    await storage.removeItem(key);
    log('removeItem', key, 'SUCCESS');
  },

  subscribe(key, listener) {
    log('subscribe', key);
    const handler = () => listener();
    window.addEventListener('storage', (e) => {
      if (e.key === key) listener();
    });
    return () => window.removeEventListener('storage', handler);
  },
};

export async function purgeVaultData() {
  const keys = [
    'cova:vault-salt',
    'cova-credential-store',
    'cova-note-store',
    'cova-task-store',
    'cova-wallet-store',
    'cova-savings-store',
    'cova-activity-store',
    'cova-settings-store',
    'cova-ui-store',
  ];
  for (const key of keys) {
    await storage.removeItem(key);
  }
}

export async function reencryptVault(oldKey: CryptoKey, newPassword: string): Promise<CryptoKey> {
  const { key: newKey, salt: newSalt } = await deriveKey(newPassword);
  await setVaultSalt(newSalt);
  
  const storeKeys = [
    'cova-credential-store',
    'cova-note-store',
    'cova-task-store',
    'cova-wallet-store',
    'cova-savings-store',
    'cova-activity-store',
    'cova-settings-store',
    'cova-ui-store',
  ];

  for (const storeKey of storeKeys) {
    const raw = await storage.getItem(storeKey);
    if (!raw) continue;
    
    let plaintext: string;
    try {
      const payload = JSON.parse(raw);
      const iv = base64ToBuffer(payload.iv);
      const data = base64ToBuffer(payload.data);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
        oldKey,
        data.buffer as ArrayBuffer
      );
      plaintext = new TextDecoder().decode(decrypted);
    } catch {
      continue;
    }

    const newIv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const newCiphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: newIv.buffer as ArrayBuffer },
      newKey,
      encoded
    );

    const newPayload = {
      iv: arrayBufferToBase64(newIv.buffer as ArrayBuffer),
      data: arrayBufferToBase64(newCiphertext),
    };
     await storage.setItem(storeKey, JSON.stringify(newPayload));
  }

  return newKey;
}

export { deriveKey } from './vaultCrypto';

