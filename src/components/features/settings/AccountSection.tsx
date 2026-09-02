import { User, Camera } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input, Label } from '@components/ui/Input';
import { useSettingsStore, useUIStore } from '@store';
import { getInitials } from '@lib/utils';

interface Props {
  profileName: string;
  profileEmail: string;
  profileDisplayName: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onDisplayNameChange: (v: string) => void;
}

export function AccountSection({ profileName, profileEmail, profileDisplayName, onNameChange, onEmailChange, onDisplayNameChange }: Props) {
  const { user, updateUser } = useSettingsStore();
  const { addToast } = useUIStore();

  const handleSave = () => {
    updateUser({ name: profileName, email: profileEmail, displayName: profileDisplayName });
    addToast('Profile updated successfully', 'success');
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
            <Input id="profile-name" value={profileName} onChange={(e) => onNameChange(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="profile-display">Display Name</Label>
            <Input id="profile-display" value={profileDisplayName} onChange={(e) => onDisplayNameChange(e.target.value)} placeholder="Display name" />
          </div>
          <div>
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" value={profileEmail} onChange={(e) => onEmailChange(e.target.value)} placeholder="email@example.com" />
          </div>
        </div>
        <div>
          <Label htmlFor="profile-password">New Password</Label>
          <Input id="profile-password" type="password" value="" placeholder="Leave blank to keep current" />
        </div>
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}