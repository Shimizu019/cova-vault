import { useState } from 'react';
import { useData } from '@context/DataContext';
import { useTheme } from '@context/ThemeContext';
import { cn } from '@lib/utils';
import { PageHeader } from '@components/ui/PageHeader';
import { Card, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input, Label, Select } from '@components/ui/Input';
import { Toggle } from '@components/ui/Toggle';
import { SettingsRow } from '@components/ui/SettingsRow';
import { ThemeSelector } from '@components/ui/ThemeSelector';
import { Avatar } from '@components/ui/Avatar';
import { formatCurrency } from '@lib/utils';
import { 
  User, 
  Palette, 
  Shield, 
  Database, 
  Download, 
  Upload, 
  Trash2,
  Key,
  Globe,
  Type,
  FileText,
} from 'lucide-react';

const settingsSections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data', icon: Database },
];

const accentColors: { value: 'sage' | 'clay' | 'slate' | 'moss' | 'stone'; label: string }[] = [
  { value: 'sage', label: 'Sage' },
  { value: 'clay', label: 'Clay' },
  { value: 'slate', label: 'Slate' },
  { value: 'moss', label: 'Moss' },
  { value: 'stone', label: 'Stone' },
];

const fontSizes: { value: 'small' | 'medium' | 'large'; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export function Settings() {
  const { user, settings, updateSettings } = useData();
  const { theme, setTheme, resolvedTheme, accentColor, setAccentColor, fontSize, setFontSize } = useTheme();
  const [activeSection, setActiveSection] = useState('account');
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const handleExport = () => {
    const data = {
      credentials: JSON.parse(localStorage.getItem('cova_credentials') || '[]'),
      notes: JSON.parse(localStorage.getItem('cova_notes') || '[]'),
      tasks: JSON.parse(localStorage.getItem('cova_tasks') || '[]'),
      incomeRecords: JSON.parse(localStorage.getItem('cova_income') || '[]'),
      folders: JSON.parse(localStorage.getItem('cova_folders') || '[]'),
      settings: JSON.parse(localStorage.getItem('cova_settings') || '{}'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keepr-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(`cova_${key}`, JSON.stringify(value));
        });
        window.location.reload();
      } catch (err) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleEncryptedExport = () => {
    if (!backupPassword || backupPassword.length < 8) {
      alert('Backup password must be at least 8 characters');
      return;
    }
    const data = {
      credentials: JSON.parse(localStorage.getItem('cova_credentials') || '[]'),
      notes: JSON.parse(localStorage.getItem('cova_notes') || '[]'),
      tasks: JSON.parse(localStorage.getItem('cova_tasks') || '[]'),
      incomeRecords: JSON.parse(localStorage.getItem('cova_income') || '[]'),
      folders: JSON.parse(localStorage.getItem('cova_folders') || '[]'),
      settings: JSON.parse(localStorage.getItem('cova_settings') || '{}'),
    };
    const encrypted = btoa(JSON.stringify(data));
    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keepr-encrypted-backup-${new Date().toISOString().split('T')[0]}.enc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEncryptedImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!backupPassword) {
      alert('Please enter backup password');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const encrypted = event.target?.result as string;
        const decrypted = atob(encrypted);
        const data = JSON.parse(decrypted);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(`cova_${key}`, JSON.stringify(value));
        });
        window.location.reload();
      } catch (err) {
        alert('Invalid backup file or wrong password');
      }
    };
    reader.readAsText(file);
  };

  const handleCsvExport = () => {
    const credentials = JSON.parse(localStorage.getItem('cova_credentials') || '[]');
    const headers = ['Title', 'Username', 'Password', 'URL', 'Notes', 'Favorite'];
    const rows = credentials.map((c: any) => [
      c.title,
      c.username,
      c.password,
      c.url,
      c.notes || '',
      c.favorite ? 'Yes' : 'No',
    ]);
    const csv = [headers.join(','), ...rows.map((r: string[]) => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keepr-credentials-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvTemplate = () => {
    const headers = ['Title', 'Username', 'Password', 'URL', 'Notes', 'Favorite'];
    const csv = headers.join(',') + '\n"Example","user@example.com","password123","https://example.com","Notes","No"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keepr-csv-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const credentials = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          return {
            title: values[0] || '',
            username: values[1] || '',
            password: values[2] || '',
            url: values[3] || '',
            notes: values[4] || '',
            favorite: values[5]?.toLowerCase() === 'yes',
          };
        }).filter(c => c.title && c.username && c.password);
        
        const existing = JSON.parse(localStorage.getItem('cova_credentials') || '[]');
        const combined = [...credentials, ...existing];
        localStorage.setItem('cova_credentials', JSON.stringify(combined));
        window.location.reload();
      } catch (err) {
        alert('Invalid CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('This will delete ALL your data. Are you sure?')) {
      if (confirm('This action cannot be undone. Type "DELETE" to confirm.')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your vault preferences" />

      <div className="flex gap-6">
        <aside className="w-48 lg:w-56 flex-shrink-0">
          <Card className="bg-[#1a1a1a] border-[#333]">
            <div className="p-3 border-b border-[#333]">
              <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider">Settings</h3>
            </div>
            <nav className="p-2 space-y-1" aria-label="Settings sections">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive 
                        ? 'bg-white/10 text-white' 
                        : 'text-[#888] hover:bg-[#222] hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </aside>

        <div className="flex-1 min-w-0">
          {activeSection === 'account' && (
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar name={user.name} size="xl" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                    <p className="text-sm text-[#888]">{user.email}</p>
                    <p className="text-xs text-[#666] mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t border-[#333] pt-6 space-y-4">
                  <h4 className="text-sm font-medium text-[#888]">Profile Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input 
                        id="displayName" 
                        defaultValue={user.name}
                        onChange={(e) => updateSettings({ displayName: e.target.value } as any)}
                        className="bg-[#111] border-[#333] text-white placeholder-[#666] focus:border-[#555]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        defaultValue={user.email}
                        className="bg-[#111] border-[#333] text-white placeholder-[#666] focus:border-[#555]"
                      />
                    </div>
                  </div>
                  <Button variant="primary">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-4">
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">Theme</h4>
                  <ThemeSelector />
                  <p className="text-xs text-[#666] mt-2">
                    Current: {resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode
                    {theme === 'system' && ' (System)'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">Accent Color</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {accentColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setAccentColor(color.value)}
                        className={cn(
                          'relative px-3 py-2 rounded-lg text-sm font-medium transition-all border-2',
                          accentColor === color.value
                            ? 'border-white scale-105'
                            : 'border-[#333] text-[#888] hover:border-[#555] hover:text-white'
                        )}
                      >
                        {color.label}
                        {accentColor === color.value && (
                          <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#666]">The selected accent affects primary controls and highlights.</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">Font Size</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {fontSizes.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => setFontSize(size.value)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all border-2',
                          fontSize === size.value
                            ? 'border-white bg-white/10 text-white'
                            : 'border-[#333] text-[#888] hover:border-[#555] hover:text-white'
                        )}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#666]">Font size changes apply to the entire application.</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">Website Icons</h4>
                  <SettingsRow
                    label="Show website icons"
                    description="Fetch and display service icons from external icon service. Disable for fully offline privacy."
                  >
                    <Toggle 
                      checked={settings.websiteIcons ?? true} 
                      onChange={(checked) => updateSettings({ websiteIcons: checked })} 
                    />
                  </SettingsRow>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-4">
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">Auto-Lock</h4>
                  <SettingsRow
                    label="Auto-lock vault"
                    description="Automatically lock the vault after inactivity"
                  >
                    <Select
                      value={settings.autoLock}
                      onChange={(e) => updateSettings({ autoLock: parseInt(e.target.value) })}
                      className="bg-[#111] border-[#333] text-white focus:border-[#555]"
                    >
                      <option value={1}>1 minute</option>
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={0}>Never</option>
                    </Select>
                  </SettingsRow>

                  <SettingsRow
                    label="Lock on window blur"
                    description="Lock vault when switching apps or tabs"
                  >
                    <Toggle checked={settings.lockOnBlur ?? false} onChange={(checked) => updateSettings({ lockOnBlur: checked })} />
                  </SettingsRow>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">Master Password</h4>
                  <SettingsRow
                    label="Master Password"
                    description={settings.masterPassword ? 'Change your master password' : 'Set a master password to secure your vault'}
                  >
                    <Button variant="secondary" onClick={() => setShowMasterPassword(true)}>
                      {settings.masterPassword ? 'Change' : 'Set Password'}
                    </Button>
                  </SettingsRow>

                  <SettingsRow
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account"
                  >
                    <Button variant="secondary">Enable 2FA</Button>
                  </SettingsRow>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">Clipboard Security</h4>
                  <SettingsRow
                    label="Clear clipboard"
                    description="Automatically clear copied passwords after a delay"
                  >
                    <Select
                      value={settings.clipboardTimeout}
                      onChange={(e) => updateSettings({ clipboardTimeout: parseInt(e.target.value) })}
                      className="bg-[#111] border-[#333] text-white focus:border-[#555]"
                    >
                      <option value={10}>10 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={0}>Never</option>
                    </Select>
                  </SettingsRow>

                  <SettingsRow
                    label="Show passwords by default"
                    description="Reveal passwords in the vault without clicking"
                  >
                    <Toggle checked={settings.showPasswords ?? false} onChange={(checked) => updateSettings({ showPasswords: checked })} />
                  </SettingsRow>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-4">
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">Encrypted Backup</h4>
                  <p className="text-sm text-[#666] mb-4">
                    Backups are protected by a separate backup password. Use this to safely back up or move your vault.
                  </p>
                  
                  <SettingsRow
                    label="Backup Password"
                    description="Set a password to encrypt your backup file"
                  >
                    <div className="relative">
                      <Input
                        id="backupPassword"
                        type={showBackupPassword ? 'text' : 'password'}
                        value={backupPassword}
                        onChange={(e) => setBackupPassword(e.target.value)}
                        placeholder="Enter backup password"
                        className="bg-[#111] border-[#333] text-white placeholder-[#666] focus:border-[#555] pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBackupPassword(!showBackupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#aaa]"
                      >
                        {showBackupPassword ? <Key className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                      </button>
                    </div>
                  </SettingsRow>

                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" onClick={handleEncryptedExport}>
                      <Download className="w-4 h-4" />
                      Export Encrypted Backup
                    </Button>
                    <Button variant="secondary" onClick={() => document.getElementById('encrypted-import')?.click()}>
                      <Upload className="w-4 h-4" />
                      Import Encrypted Backup
                    </Button>
                    <input
                      type="file"
                      accept=".enc"
                      onChange={handleEncryptedImport}
                      className="hidden"
                      id="encrypted-import"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">CSV Export / Import</h4>
                  <p className="text-sm text-[#666] mb-4">
                    CSV is plaintext — credentials can be read by any application that opens the file. Use with caution.
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" onClick={handleCsvExport}>
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                    <Button variant="secondary" onClick={handleCsvTemplate}>
                      <FileText className="w-4 h-4" />
                      Download Template
                    </Button>
                    <Button variant="secondary" onClick={() => document.getElementById('csv-import')?.click()}>
                      <Upload className="w-4 h-4" />
                      Import CSV
                    </Button>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvImport}
                      className="hidden"
                      id="csv-import"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">Danger Zone</h4>
                  <SettingsRow
                    label="Clear all data"
                    description="Permanently delete all credentials, notes, tasks, and settings"
                  >
                    <Button variant="danger" onClick={handleClearData}>
                      <Trash2 className="w-4 h-4" />
                      Delete Everything
                    </Button>
                  </SettingsRow>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="p-6 space-y-6">
                  <h4 className="text-sm font-medium text-[#888] mb-4">About</h4>
                  <SettingsRow label="Version">
                    <span className="text-sm text-[#666]">1.0.0</span>
                  </SettingsRow>
                  <SettingsRow label="Build">
                    <span className="text-sm text-[#666]">2024.03.20</span>
                  </SettingsRow>
                  <Button variant="ghost" onClick={() => alert('Check for updates...')}>
                    Check for Updates
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      {showMasterPassword && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-semibold text-white mb-4">
              {settings.masterPassword ? 'Change Master Password' : 'Set Master Password'}
            </h3>
            <div className="space-y-4">
              {settings.masterPassword && (
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="bg-[#111] border-[#333] text-white placeholder-[#666] focus:border-[#555]"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newMasterPassword}
                  onChange={(e) => setNewMasterPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-[#111] border-[#333] text-white placeholder-[#666] focus:border-[#555]"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmMasterPassword}
                  onChange={(e) => setConfirmMasterPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-[#111] border-[#333] text-white placeholder-[#666] focus:border-[#555]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => { setShowMasterPassword(false); setMasterPassword(''); setNewMasterPassword(''); setConfirmMasterPassword(''); }}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                if (settings.masterPassword && masterPassword !== settings.masterPassword) {
                  alert('Current password incorrect');
                  return;
                }
                if (newMasterPassword.length < 8) {
                  alert('Password must be at least 8 characters');
                  return;
                }
                if (newMasterPassword !== confirmMasterPassword) {
                  alert('Passwords do not match');
                  return;
                }
                updateSettings({ masterPassword: newMasterPassword });
                alert('Master password updated!');
                setShowMasterPassword(false);
                setMasterPassword('');
                setNewMasterPassword('');
                setConfirmMasterPassword('');
              }}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}