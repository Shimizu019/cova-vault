import { useState } from 'react';
import { Star, Search, Key, ExternalLink, Eye, EyeOff, Copy, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { Dropdown } from '@components/ui/Dropdown';
import { EmptyState } from '@components/ui/Card';
import { useCredentialStore, useUIStore } from '@store';
import { maskPassword, getDomainFromUrl } from '@lib/utils';
import type { Credential } from '@lib/types';

export function Favorites() {
  const { credentials, toggleFavorite, deleteCredential } = useCredentialStore();
  const { passwordVisibility, togglePasswordVisibility, addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Credential | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const favs = credentials.filter((c) => c.favorite);
  const q = search.toLowerCase();
  const shown = favs.filter((c) => !q || c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q));

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(label + ' copied to clipboard', 'success');
  };

  const handleOpen = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-cova-text flex items-center gap-2">
            <Star className="w-5 h-5 text-cova-warning fill-cova-warning" aria-hidden="true" />
            Favorites
            <span className="ml-2 px-2 py-0.5 rounded-full bg-cova-surface border border-cova-border text-xs font-medium text-cova-textMuted">{favs.length}</span>
          </h1>
          <p className="text-sm text-cova-textMuted mt-1">Your starred credentials and notes</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cova-textMuted pointer-events-none" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search favorites..." className="input pl-9 pr-3 w-full" aria-label="Search favorites" />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card p-8"><EmptyState icon={<Star className="w-16 h-16 text-cova-textMuted" />} title={favs.length === 0 ? 'No favorites yet' : 'No results'} description={favs.length === 0 ? 'Star any credential to add it to your favorites.' : 'Try a different search term.'} /></div>
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
                {shown.map((c) => {
                  const visible = passwordVisibility[c.id] ?? false;
                  return (
                    <tr key={c.id} className="border-b border-cova-border/50 hover:bg-cova-surfaceHover/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-cova-primary/15 flex items-center justify-center flex-shrink-0"><Key className="w-4 h-4 text-cova-primary" /></div>
                          <div className="min-w-0">
                            <div className="font-medium text-cova-text truncate flex items-center gap-1"><Star className="w-3 h-3 text-cova-warning fill-cova-warning flex-shrink-0" />{c.name}</div>
                            <div className="text-xs text-cova-textMuted truncate">{getDomainFromUrl(c.website) || c.website || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><span className="text-sm text-cova-textSecondary truncate block max-w-[200px]">{c.username}</span></td>
                      <td className="py-3 px-4"><span className="font-mono text-sm text-cova-text">{visible ? c.password : maskPassword(c.password)}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => handleCopy(c.password, 'Password')} className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors" aria-label="Copy password"><Copy className="w-4 h-4" /></button>
                          <button type="button" onClick={() => togglePasswordVisibility(c.id)} className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors" aria-label={visible ? 'Hide' : 'Show'}>{visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                          <button type="button" onClick={() => toggleFavorite(c.id)} className="p-1.5 rounded text-cova-warning hover:bg-cova-surfaceHover transition-colors" aria-label="Unfavorite"><Star className="w-4 h-4 fill-cova-warning text-cova-warning" /></button>
                          <Dropdown align="right" trigger={<button type="button" className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors" aria-label="More"><ExternalLink className="w-4 h-4" /></button>}
                            items={[
                              { label: 'Open website', onClick: () => handleOpen(c.website), disabled: !c.website },
                              { label: 'Delete', onClick: () => { if (confirm(`Delete "${c.name}"?`)) { deleteCredential(c.id); addToast('Credential deleted', 'info'); } }, danger: true },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}