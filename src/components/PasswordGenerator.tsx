import { useState, useCallback, useEffect } from 'react';
import { cn } from '@lib/utils';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Toggle } from '@components/ui/Toggle';
import { Label } from '@components/ui/Input';
import { calculatePasswordStrength, formatDateTime } from '@lib/utils';
import { useData } from '@context/DataContext';
import { Copy, RefreshCw, Check, Plus } from 'lucide-react';

export function PasswordGenerator() {
  const { addCredential } = useData();
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let chars = '';
    if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      setPassword('');
      return;
    }

    let result = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    
    setPassword(result);
    setCopied(false);
  }, [length, uppercase, lowercase, numbers, symbols]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const { score, label } = calculatePasswordStrength(password);

  const strengthColors = ['bg-[#ef4444]', 'bg-[#ef4444]', 'bg-[#eab308]', 'bg-[#22c55e]', 'bg-[#22c55e]', 'bg-[#22c55e]'];
  
  const copyToClipboard = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const useInNewCredential = () => {
    if (!password) return;
    addCredential({
      title: 'New Credential',
      username: '',
      password: password,
      url: '',
      notes: 'Generated password - edit details',
      favorite: false,
    });
    // Navigate to vault
    window.location.href = '/vault';
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
        <Label htmlFor="password">Generated Password</Label>
        <div className="relative mt-2">
          <Input
            id="password"
            type="text"
            value={password}
            readOnly
            className="font-mono text-sm pr-12 bg-[#111] border-[#333] text-white"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button variant="icon" onClick={copyToClipboard} aria-label="Copy password">
              {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="icon" onClick={generatePassword} aria-label="Regenerate password">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Length: {length}</Label>
          </div>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-1.5 bg-[#333] rounded-full appearance-none accent-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Toggle
            label="Uppercase"
            checked={uppercase}
            onChange={setUppercase}
            description="A-Z"
          />
          <Toggle
            label="Lowercase"
            checked={lowercase}
            onChange={setLowercase}
            description="a-z"
          />
          <Toggle
            label="Numbers"
            checked={numbers}
            onChange={setNumbers}
            description="0-9"
          />
          <Toggle
            label="Symbols"
            checked={symbols}
            onChange={setSymbols}
            description="!@#$..."
          />
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Label>Strength</Label>
          <span className="text-xs text-[#666]">{label}</span>
        </div>
        <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', strengthColors[score])}
            style={{ width: `${((score + 1) / 6) * 100}%` }}
          />
        </div>
        <p className="text-xs text-[#666] mt-2">
          {score <= 1 ? 'Very weak - easily guessed' : score <= 2 ? 'Weak - could be cracked' : score <= 3 ? 'Fair - moderate security' : score <= 4 ? 'Good - strong password' : 'Very strong - excellent security'}
        </p>
      </div>

      <Button className="w-full" onClick={useInNewCredential}>
        <Plus className="w-4 h-4" />
        Use in New Credential
      </Button>
    </div>
  );
}