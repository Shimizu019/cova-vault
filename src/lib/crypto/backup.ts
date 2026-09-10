import { encryptPayload, decryptPayload } from './vaultStorage';

export async function exportEncryptedBackup(data: unknown): Promise<void> {
  const plaintext = JSON.stringify(data);
  const encrypted = await encryptPayload(plaintext);
  const payload = {
    version: 1,
    encrypted: true,
    data: encrypted,
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cova-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importEncryptedBackup(file: File): Promise<unknown> {
  const text = await file.text();
  const payload = JSON.parse(text);
  
  if (!payload.encrypted || !payload.data) {
    throw new Error('Invalid backup format');
  }

  const decrypted = await decryptPayload(payload.data);
  return JSON.parse(decrypted);
}
