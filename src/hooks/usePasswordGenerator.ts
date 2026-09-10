import { useState, useCallback } from 'react';
import { useUIStore, useCredentialStore } from '@store';
import { calculatePasswordStrength } from '@lib/utils';
import { secureCopy } from '@lib/utils/clipboard';

interface GeneratorOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function generatePassword(len: number, opts: GeneratorOptions): string {
  let chars = '';
  if (opts.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (opts.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (opts.numbers) chars += '0123456789';
  if (opts.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

  const required: string[] = [];
  if (opts.uppercase) required.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]);
  if (opts.lowercase) required.push('abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]);
  if (opts.numbers) required.push('0123456789'[Math.floor(Math.random() * 10)]);
  if (opts.symbols) required.push('!@#$%^&*'[Math.floor(Math.random() * 8)]);

  let rest = '';
  for (let i = 0; i < len - required.length; i++) {
    rest += chars[Math.floor(Math.random() * chars.length)];
  }

  const all = [...(rest + required.join(''))];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join('').slice(0, len);
}

export function usePasswordGenerator() {
  const { addToast } = useUIStore();
  const { addCredential } = useCredentialStore();
  const [length, setLength] = useState(20);
  const [options, setOptions] = useState<GeneratorOptions>({
    uppercase: true, lowercase: true, numbers: true, symbols: true,
  });
  const [password, setPassword] = useState(() => generatePassword(20, {
    uppercase: true, lowercase: true, numbers: true, symbols: true,
  }));
  const [copied, setCopied] = useState(false);

  const strength = calculatePasswordStrength(password);

  const refresh = useCallback(() => {
    setPassword(generatePassword(length, options));
    setCopied(false);
  }, [length, options]);

  const handleCopy = async () => {
    await secureCopy(password);
    setCopied(true);
    addToast('Password copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    addCredential({ name: '', username: '', password, website: '', tags: ['generated'], favorite: false });
    addToast('Password saved to new credential', 'success');
  };

  const toggle = (k: keyof GeneratorOptions) =>
    setOptions((p) => ({ ...p, [k]: !p[k] }));

  return {
    length, setLength,
    options, toggle,
    password, strength,
    copied, refresh, handleCopy, handleUse,
  };
}