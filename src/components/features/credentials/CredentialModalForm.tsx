import { useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input, Label } from '@components/ui/Input';
import { calculatePasswordStrength } from '@lib/utils';
import type { Credential } from '@lib/types';

interface CredentialFormProps {
  initial?: Credential | null;
  onSubmit: (data: { name: string; username: string; password: string; website: string; tags: string[] }) => void;
}

export function CredentialForm({ initial, onSubmit }: CredentialFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [username, setUsername] = useState(initial?.username ?? '');
  const [password, setPassword] = useState(initial?.password ?? '');
  const [website, setWebsite] = useState(initial?.website ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = calculatePasswordStrength(password);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase();
      if (!tags.includes(t)) setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!username.trim()) errs.username = 'Username is required';
    if (!password.trim()) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit({ name, username, password, website, tags });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const len = 20;
    setPassword(Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
    setShowPassword(false);
  };

  return (
    <form id="cred-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cred-name" required>Name</Label>
        <Input id="cred-name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Google Workspace" error={errors.name} autoFocus />
      </div>

      <div>
        <Label htmlFor="cred-username" required>Username</Label>
        <Input id="cred-username" type="email" value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username@email.com" error={errors.username} />
      </div>

      <div>
        <Label htmlFor="cred-password" required>Password</Label>
        <div className="relative">
          <Input id="cred-password" type={showPassword ? 'text' : 'password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password" error={errors.password} className="pr-20" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 rounded text-cova-textMuted hover:bg-cova-surfaceHover transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button type="button" onClick={generatePassword}
              className="p-1.5 rounded text-cova-textMuted hover:bg-cova-surfaceHover transition-colors"
              aria-label="Generate password">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        {password && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{ backgroundColor: i < strength.score ? strength.color : '#1F2232' }} />
              ))}
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
              <span className="text-xs text-cova-textMuted">{strength.score}/5</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="cred-website">Website</Label>
        <Input id="cred-website" type="url" value={website}
          onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
      </div>

      <div>
        <Label htmlFor="cred-tags">Tags</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cova-primary/15 text-cova-primary text-xs font-medium">
              {tag}
              <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}
                className="hover:opacity-70" aria-label={`Remove tag ${tag}`}>×</button>
            </span>
          ))}
        </div>
        <Input id="cred-tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag} placeholder="Type and press Enter to add tags" />
      </div>
    </form>
  );
}