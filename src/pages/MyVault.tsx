import { useState } from 'react';
import { useData } from '@context/DataContext';
import { cn } from '@lib/utils';
import { PageHeader } from '@components/ui/PageHeader';
import { SearchBar } from '@components/ui/SearchBar';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Dropdown } from '@components/ui/Dropdown';
import { Input, Label, Textarea, Select } from '@components/ui/Input';
import { formatRelativeTime, getServiceNameFromUrl, getServiceColor, calculatePasswordStrength } from '@lib/utils';
import { Credential } from '@lib/types';
import { 
  Plus, 
  Search, 
  Copy, 
  Eye, 
  EyeOff, 
  Star, 
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { NewCredentialModal } from '@modals/NewCredentialModal';

export function MyVault() {
  const { credentials, folders, addCredential, updateCredential, deleteCredential, toggleFavoriteCredential } = useData();
  const [search, setSearch] = useState('');
  const [filterFolder, setFilterFolder] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const filteredCredentials = credentials.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      getServiceNameFromUrl(c.url).toLowerCase().includes(search.toLowerCase());
    const matchesFolder = !filterFolder || c.folderId === filterFolder;
    return matchesSearch && matchesFolder;
  });

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      deleteCredential(id);
    }
  };

  const getCredentialActions = (cred: Credential) => [
    { 
      label: 'Copy Password', 
      icon: <Copy className="w-4 h-4" />, 
      onClick: () => handleCopy(cred.password) 
    },
    { 
      label: 'View Details', 
      icon: <Eye className="w-4 h-4" />, 
      onClick: () => setEditingCredential(cred) 
    },
    { 
      label: cred.favorite ? 'Remove from Favorites' : 'Add to Favorites', 
      icon: <Star className="w-4 h-4" />, 
      onClick: () => toggleFavoriteCredential(cred.id) 
    },
    { 
      label: 'Edit', 
      icon: <Edit className="w-4 h-4" />, 
      onClick: () => setEditingCredential(cred) 
    },
    { 
      label: 'Delete', 
      icon: <Trash2 className="w-4 h-4" />, 
      onClick: () => handleDelete(cred.id),
      danger: true 
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Vault"
        subtitle="Manage your credentials and passwords"
        actions={
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4" />
            New Credential
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search credentials..."
              />
            </div>
            <div className="flex items-center gap-3 sm:w-48">
              <Label className="text-xs text-light-textMuted dark:text-dark-textMuted mb-1 block">Folder</Label>
              <Select
                value={filterFolder}
                onChange={(e) => setFilterFolder(e.target.value)}
                className="w-full"
              >
                <option value="">All Folders</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        {filteredCredentials.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-surfaceHover dark:bg-dark-surfaceHover flex items-center justify-center">
              <Search className="w-8 h-8 text-light-textMuted dark:text-dark-textMuted" />
            </div>
            <h3 className="text-sm font-medium text-light-textSecondary dark:text-dark-textSecondary mb-1">
              {search || filterFolder ? 'No credentials found' : 'No credentials yet'}
            </h3>
            <p className="text-xs text-light-textMuted dark:text-dark-textMuted mb-4">
              {search || filterFolder ? 'Try adjusting your search or filter' : 'Add your first credential to get started'}
            </p>
            {!search && !filterFolder && (
              <Button onClick={() => setShowNewModal(true)}>
                <Plus className="w-4 h-4" />
                Add Credential
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">Service</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th className="w-32">Status</th>
                  <th className="w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredentials.map((cred) => {
                  const serviceName = getServiceNameFromUrl(cred.url);
                  const serviceColor = getServiceColor(serviceName);
                  const isPasswordVisible = showPasswords[cred.id];
                  
                  return (
                    <tr key={cred.id}>
                      <td>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: serviceColor + '20' }}>
                          <span className="text-sm font-medium" style={{ color: serviceColor }}>
                            {serviceName.charAt(0)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-light-text dark:text-dark-text">{cred.title}</span>
                          {cred.favorite && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />}
                        </div>
                      </td>
                      <td className="text-light-textSecondary dark:text-dark-textSecondary font-mono text-sm truncate max-w-xs">
                        {cred.username}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm flex-1" style={{ letterSpacing: '0.1em' }}>
                            {isPasswordVisible ? cred.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => setShowPasswords(prev => ({ ...prev, [cred.id]: !isPasswordVisible }))}
                            className="text-light-textMuted dark:text-dark-textMuted hover:text-light-text dark:hover:text-dark-text p-1"
                            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                          >
                            {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleCopy(cred.password)}
                            className="text-light-textMuted dark:text-dark-textMuted hover:text-light-text dark:hover:text-dark-text p-1"
                            aria-label="Copy password"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Badge variant="success">Active</Badge>
                          {cred.lastUsed && (
                            <span className="text-xs text-light-textMuted dark:text-dark-textMuted">
                              {formatRelativeTime(cred.lastUsed)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Dropdown
                          align="right"
                          trigger={
                            <button className="text-light-textMuted dark:text-dark-textMuted hover:text-light-text dark:hover:text-dark-text p-1.5 rounded hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          }
                          items={getCredentialActions(cred)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Credential" size="lg">
        <NewCredentialModal onClose={() => setShowNewModal(false)} />
      </Modal>

      <Modal isOpen={!!editingCredential} onClose={() => setEditingCredential(null)} title="Credential Details" size="lg">
        {editingCredential && (
          <NewCredentialModal 
            initialData={editingCredential} 
            onClose={() => setEditingCredential(null)} 
          />
        )}
      </Modal>
    </div>
  );
}