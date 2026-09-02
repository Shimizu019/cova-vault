import { useState, useEffect } from 'react';
import { useData } from '@context/DataContext';
import { Credential, Folder } from '@lib/types';
import { Button } from '@components/ui/Button';
import { Input, Label, Textarea, Select } from '@components/ui/Input';
import { Toggle } from '@components/ui/Toggle';
import { cn } from '@lib/utils';
import { calculatePasswordStrength, generateId } from '@lib/utils';
import { Copy, RefreshCw, Eye, EyeOff, Check } from 'lucide-react';

interface NewCredentialModalProps {
  initialData?: Credential;
  onClose: () => void;
}

export function NewCredentialModal({ initialData, onClose }: NewCredentialModalProps) {
  const { folders, addCredential, updateCredential } = useData();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    folderId: '',
    notes: '',
    favorite: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        username: initialData.username,
        password: initialData.password,
        url: initialData.url,
        folderId: initialData.folderId || '',
        notes: initialData.notes || '',
        favorite: initialData.favorite,
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (formData.url && !isValidUrl(formData.url)) newErrors.url = 'Invalid URL';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const generateNewPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    const array = new Uint32Array(16);
    crypto.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
      result += chars[array[i] % chars.length];
    }
    setGeneratedPassword(result);
    setFormData(prev => ({ ...prev, password: result }));
    setShowPassword(true);
  };

  const copyGeneratedPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPassword = async () => {
    if (formData.password) {
      await navigator.clipboard.writeText(formData.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const credentialData = {
      title: formData.title.trim(),
      username: formData.username.trim(),
      password: formData.password,
      url: formData.url.trim(),
      folderId: formData.folderId || undefined,
      notes: formData.notes.trim(),
      favorite: formData.favorite,
    };

    if (isEditing && initialData) {
      updateCredential(initialData.id, credentialData);
    } else {
      addCredential(credentialData);
    }
    onClose();
  };

  const { score, label } = calculatePasswordStrength(formData.password);

  const strengthColors = ['bg-light-danger dark:bg-dark-danger', 'bg-light-danger dark:bg-dark-danger', 'bg-light-warning dark:bg-dark-warning', 'bg-light-success dark:bg-dark-success', 'bg-light-success dark:bg-dark-success', 'bg-light-success dark:bg-dark-success'];

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Google Workspace"
            error={errors.title}
          />
          {errors.title && <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{errors.title}</p>}
        </div>

        <div>
          <Label htmlFor="username">Username / Email *</Label>
          <Input
            id="username"
            type="email"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="alex@company.com"
            error={errors.username}
          />
          {errors.username && <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{errors.username}</p>}
        </div>

        <div>
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter or generate password"
              className="pr-28"
              error={errors.password}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button variant="icon" type="button" onClick={copyPassword} aria-label="Copy password">
                {copied ? <Check className="w-4 h-4 text-light-success dark:text-dark-success" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="icon" type="button" onClick={generateNewPassword} aria-label="Generate password">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="icon" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          {errors.password && <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{errors.password}</p>}
          
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <Label className="mb-0">Strength</Label>
                <span className="text-xs text-light-textMuted dark:text-dark-textMuted">{label}</span>
              </div>
              <div className="h-1.5 bg-light-border dark:bg-dark-border rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', strengthColors[score])}
                  style={{ width: `${((score + 1) / 6) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="url">Website / URL</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com"
            error={errors.url}
          />
          {errors.url && <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{errors.url}</p>}
        </div>

        <div>
          <Label htmlFor="folder">Folder</Label>
          <Select
            id="folder"
            value={formData.folderId}
            onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value }))}
          >
            <option value="">No folder</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="mb-0">Favorite</Label>
          <Toggle
            checked={formData.favorite}
            onChange={(checked) => setFormData(prev => ({ ...prev, favorite: checked }))}
          />
        </div>
      </div>

      <div className="modal-footer">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          {isEditing ? 'Save Changes' : 'Save Credential'}
        </Button>
      </div>
    </form>
  );
}