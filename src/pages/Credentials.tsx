import { useState, useMemo } from 'react';
import {
  Key, Search, Plus, Star, MoreVertical, Eye, EyeOff,
  Copy, ExternalLink, Pencil, Trash2, Globe, Filter,
} from 'lucide-react';
import lockLogo from '../assets/image/lockLogo.png';
import { Button } from '@components/ui/Button';
import { Dropdown } from '@components/ui/Dropdown';
import { EmptyState } from '@components/ui/Card';
import { useCredentialStore, useUIStore } from '@store';
import { CredentialModal } from '@features/credentials/CredentialModal';
import { CredentialRow } from '@features/credentials/CredentialRow';
import { maskPassword } from '@lib/utils';
import type { Credential } from '@lib/types';

export function Credentials() {
  const { credentials, deleteCredential } = useCredentialStore();
  const { addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<Credential | null>(null);

  const allTags = useMemo(() => [...new Set(credentials.flatMap((c) => c.tags))], [credentials]);

  const filteredCreds = useMemo(() => {
    const q = search.toLowerCase();
    return credentials.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.website.toLowerCase().includes(q);
      const matchesTag = !selectedTag || c.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [credentials, search, selectedTag]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard`, 'success');
  };

  const handleOpenWebsite = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEdit = (cred: Credential) => {
    setEditingCred(cred);
    setIsModalOpen(true);
  };

  const handleDelete = (cred: Credential) => {
    if (confirm(`Delete "${cred.name}"? This cannot be undone.`)) {
      deleteCredential(cred.id);
      addToast('Credential deleted', 'info');
    }
  };

  const handleNew = () => {
    setEditingCred(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <Key className="w-5 h-5 text-cova-credentials" aria-hidden="true" />
            Credentials
            <span className="ml-2 px-2 py-0.5 rounded-full bg-cova-surface border border-cova-border text-xs font-medium text-cova-textMuted">
              {credentials.length}
            </span>
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Manage your stored passwords securely</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Dropdown
            align="right"
            trigger={
              <button className="btn btn-secondary">
                <Filter className="w-4 h-4" />
                <span>{selectedTag || 'All Tags'}</span>
              </button>
            }
            items={[
              { label: 'All Tags', icon: <Globe className="w-3.5 h-3.5" />, onClick: () => setSelectedTag(null) },
              ...allTags.map((tag) => ({ label: tag, onClick: () => setSelectedTag(tag) })),
            ]}
          />

          <div className="search-input-wrapper w-full sm:w-64">
            <Search className="search-icon w-4 h-4" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search credentials..."
              className="search-input w-full"
              aria-label="Search credentials"
            />
          </div>

          <Button variant="primary" onClick={handleNew}>
            <Plus className="w-4 h-4" /> New
          </Button>
        </div>
      </div>

      {filteredCreds.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<img src={lockLogo} alt="" className="w-24 h-24 opacity-50" />}
            title="NO CREDENTIAL HAS FOUND!"
            description="Start by creating your first credential to keep your passwords safe."
            action={
              <Button variant="primary" onClick={handleNew}>
                <Plus className="w-4 h-4" /> Create credential
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-2/5">Name</th>
                  <th className="w-1/5">Username</th>
                  <th className="w-1/5">Password</th>
                  <th className="w-1/6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreds.map((cred) => (
                  <CredentialRow
                    key={cred.id}
                    credential={cred}
                    onCopy={handleCopy}
                    onOpenWebsite={handleOpenWebsite}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CredentialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editCredential={editingCred}
      />
    </div>
  );
}