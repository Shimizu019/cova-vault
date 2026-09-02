import {
  Key, Eye, EyeOff, Copy, ExternalLink, Pencil,
  Trash2, MoreVertical, Star,
} from 'lucide-react';
import { Dropdown } from '@components/ui/Dropdown';
import { useCredentialStore, useUIStore } from '@store';
import { maskPassword, getDomainFromUrl, getServiceNameFromUrl } from '@lib/utils';
import type { Credential } from '@lib/types';

interface CredentialRowProps {
  credential: Credential;
  onCopy: (text: string, label: string) => void;
  onOpenWebsite: (website: string) => void;
  onEdit: (cred: Credential) => void;
  onDelete: (cred: Credential) => void;
}

export function CredentialRow({
  credential: cred,
  onCopy,
  onOpenWebsite,
  onEdit,
  onDelete,
}: CredentialRowProps) {
  const { toggleFavorite } = useCredentialStore();
  const { passwordVisibility, togglePasswordVisibility } = useUIStore();
  const visible = passwordVisibility[cred.id] ?? false;

  const domain = getDomainFromUrl(cred.website);
  const service = getServiceNameFromUrl(cred.website);

  return (
    <tr className="border-b border-cova-border/50 hover:bg-cova-surfaceHover/40 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cova-primary/15 flex items-center justify-center flex-shrink-0">
            <Key className="w-4 h-4 text-cova-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-cova-text truncate">{cred.name}</div>
            <div className="text-xs text-cova-textMuted truncate">{domain || service || '—'}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-cova-textSecondary truncate block max-w-[200px]">{cred.username}</span>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-sm text-cova-text">{visible ? cred.password : maskPassword(cred.password)}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onCopy(cred.password, 'Password')}
            className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors"
            aria-label="Copy password"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => togglePasswordVisibility(cred.id)}
            className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(cred.id)}
            className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-warning transition-colors"
            aria-label={cred.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${cred.favorite ? 'fill-cova-warning text-cova-warning' : ''}`} />
          </button>
          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="p-1.5 rounded text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            }
            items={[
              { label: 'Copy username', onClick: () => onCopy(cred.username, 'Username') },
              { label: 'Open website', onClick: () => onOpenWebsite(cred.website), disabled: !cred.website },
              { label: 'Edit', onClick: () => onEdit(cred) },
              { label: 'Delete', onClick: () => onDelete(cred), danger: true },
            ]}
          />
        </div>
      </td>
    </tr>
  );
}
