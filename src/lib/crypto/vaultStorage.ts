import { deriveKey } from './vaultCrypto';

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
  vaultKey = key;
}

export function getVaultKey(): CryptoKey | null {
  return vaultKey;
}

export function isVaultUnlocked(): boolean {
  return vaultKey !== null;
}

export async function getOrCreateVaultSalt(): Promise<Uint8Array> {
  const existing = localStorage.getItem(VAULT_SALT_KEY);
  if (existing) {
    const decoded = atob(existing);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(VAULT_SALT_KEY, btoa(String.fromCharCode(...salt)));
  return salt;
}

export async function setVaultSalt(salt: Uint8Array): Promise<void> {
  localStorage.setItem(VAULT_SALT_KEY, btoa(String.fromCharCode(...salt)));
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

  return JSON.stringify(payload);
}

export async function decryptPayload(encrypted: string): Promise<string> {
  if (!vaultKey) {
    throw new Error('Vault is locked');
  }

  try {
    const payload = JSON.parse(encrypted);
    const iv = base64ToBuffer(payload.iv);
    const data = base64ToBuffer(payload.data);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      vaultKey,
      data.buffer as ArrayBuffer
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return encrypted;
  }
}

export const vaultStorage: VaultStorageEngine = {
  async getItem(key) {
    if (!vaultKey) {
      return null;
    }
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return await decryptPayload(raw);
    } catch {
      return null;
    }
  },

  async setItem(key, value) {
    const encrypted = await encryptPayload(value);
    localStorage.setItem(key, encrypted);
  },

  async removeItem(key) {
    localStorage.removeItem(key);
  },

  subscribe(key, listener) {
    const handler = () => listener();
    window.addEventListener('storage', (e) => {
      if (e.key === key) listener();
    });
    return () => window.removeEventListener('storage', handler);
  },
};

export function purgeVaultData() {
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
    localStorage.removeItem(key);
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
    const raw = localStorage.getItem(storeKey);
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
    localStorage.setItem(storeKey, JSON.stringify(newPayload));
  }

  return newKey;
}

export { deriveKey } from './vaultCrypto';

