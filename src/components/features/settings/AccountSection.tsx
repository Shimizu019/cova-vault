import { useEffect, useRef, useState } from 'react';
import { User, Camera } from 'lucide-react';
import { Input, Label } from '@components/ui/Input';
import { useSettingsStore, useUIStore } from '@store';
import { getInitials } from '@lib/utils';
import { setMasterPassword } from '@lib/auth/authStorage';

export function AccountSection() {
  const { user, updateUser } = useSettingsStore();
  const { addToast } = useUIStore();

  // Local state for the inputs — auto-save to the store on every keystroke
  const nameRef = useRef(user.name);
  const displayNameRef = useRef(user.displayName);
  const emailRef = useRef(user.email);

  // Master-password change form (separate from the auto-save above because
  // it has validation, confirmation, and a click-to-save action).
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sync to store on input change (with a short debounce)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueSave = (patch: Partial<typeof user>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateUser(patch);
      addToast('Profile updated', 'success', 1500);
    }, 600);
  };

  useEffect(() => {
    nameRef.current = user.name;
    displayNameRef.current = user.displayName;
    emailRef.current = user.email;
  }, [user.name, user.displayName, user.email]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingPassword) return;
    setPasswordErr(null);

    if (!newPassword) {
      setPasswordErr('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordErr('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('Passwords do not match');
      return;
    }

    setIsSavingPassword(true);
    try {
      await setMasterPassword(newPassword);
      addToast('Master password updated', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      addToast('Could not update master password', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div id="account" className="card mb-4 overflow-hidden">
      <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
        <User className="w-4 h-4 text-cova-textMuted" />
        <h2 className="text-sm font-semibold text-cova-text">Account</h2>
      </div>
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
            ) : (
              getInitials(user.displayName)
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                  addToast('Please select an image file', 'error');
                  return;
                }
                if (file.size > 2 * 1024 * 1024) {
                  addToast('Image must be smaller than 2 MB', 'error');
                  return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const url = ev.target?.result as string;
                  updateUser({ avatarUrl: url });
                  addToast('Avatar updated', 'success');
                };
                reader.readAsDataURL(file);
              };
              input.click();
            }}
          >
            <Camera className="w-4 h-4" /> Change Avatar
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" defaultValue={user.name} onChange={(e) => { nameRef.current = e.target.value; queueSave({ name: e.target.value }); }} placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="profile-display">Display Name</Label>
            <Input id="profile-display" defaultValue={user.displayName} onChange={(e) => { displayNameRef.current = e.target.value; queueSave({ displayName: e.target.value }); }} placeholder="Display name" />
          </div>
          <div>
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" defaultValue={user.email} onChange={(e) => { emailRef.current = e.target.value; queueSave({ email: e.target.value }); }} placeholder="email@example.com" />
          </div>
        </div>
        <form onSubmit={handleChangePassword} noValidate className="space-y-3" aria-label="Change master password">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profile-password" required>New Password</Label>
              <Input
                id="profile-password"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (passwordErr) setPasswordErr(null); }}
                placeholder="At least 8 characters"
                error={passwordErr ?? undefined}
                aria-invalid={!!passwordErr || undefined}
                autoComplete="new-password"
                disabled={isSavingPassword}
              />
            </div>
            <div>
              <Label htmlFor="profile-password-confirm" required>Confirm Password</Label>
              <Input
                id="profile-password-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (passwordErr) setPasswordErr(null); }}
                placeholder="Re-enter new password"
                error={passwordErr ?? undefined}
                aria-invalid={!!passwordErr || undefined}
                autoComplete="new-password"
                disabled={isSavingPassword}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary text-sm"
              disabled={isSavingPassword}
              aria-busy={isSavingPassword || undefined}
            >
              {isSavingPassword ? 'Saving…' : 'Update master password'}
            </button>
            <p className="text-xs text-cova-textMuted">
              Use a long, unique passphrase. There is no email-based recovery for a local vault.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}