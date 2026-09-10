export interface VaultCryptoKey {
  key: CryptoKey;
  salt: Uint8Array;
}

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const NONCE_LENGTH = 12;
const KEY_LENGTH = 256;

function getEncoder(): TextEncoder {
  return new TextEncoder();
}

function getDecoder(): TextDecoder {
  return new TextDecoder();
}

export async function deriveKey(password: string, salt?: Uint8Array): Promise<VaultCryptoKey> {
  const baseSalt = salt ?? crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    getEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: baseSalt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  return { key, salt: baseSalt };
}

export async function encryptData(key: CryptoKey, plaintext: string): Promise<{ ciphertext: string; nonce: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
  const encoded = getEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encoded
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    nonce: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

export async function decryptData(key: CryptoKey, ciphertext: string, nonce: string): Promise<string> {
  const iv = base64ToBuffer(nonce);
  const data = base64ToBuffer(ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );
  return getDecoder().decode(decrypted);
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return bufferToBase64(buffer);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const bytes = base64ToBuffer(base64);
  return bytes.buffer as ArrayBuffer;
}
