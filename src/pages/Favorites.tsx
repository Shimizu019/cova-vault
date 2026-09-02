import { useData } from '@context/DataContext';
import { cn } from '@lib/utils';
import { PageHeader } from '@components/ui/PageHeader';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Dropdown } from '@components/ui/Dropdown';
import { formatRelativeTime, getServiceNameFromUrl, getServiceColor } from '@lib/utils';
import { Credential, Note } from '@lib/types';
import { 
  Star, 
  Database, 
  FileText, 
  MoreVertical,
  Copy,
  Eye,
  EyeOff,
  Edit,
  Trash2,
} from 'lucide-react';

export function Favorites() {
  const { credentials, notes, toggleFavoriteCredential, toggleFavoriteNote, updateCredential, updateNote, deleteCredential, deleteNote } = useData();

  const favoriteCredentials = credentials.filter(c => c.favorite);
  const favoriteNotes = notes.filter(n => n.favorite);

  const getCredentialActions = (cred: Credential) => [
    { label: 'Copy Password', icon: <Copy className="w-4 h-4" />, onClick: () => navigator.clipboard.writeText(cred.password) },
    { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: () => { /* edit */ } },
    { label: 'Remove from Favorites', icon: <Star className="w-4 h-4" />, onClick: () => toggleFavoriteCredential(cred.id) },
    { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => { if (confirm('Delete?')) deleteCredential(cred.id); }, danger: true },
  ];

  const getNoteActions = (note: Note) => [
    { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: () => { /* edit */ } },
    { label: 'Remove from Favorites', icon: <Star className="w-4 h-4" />, onClick: () => toggleFavoriteNote(note.id) },
    { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => { if (confirm('Delete?')) deleteNote(note.id); }, danger: true },
  ];

  if (favoriteCredentials.length === 0 && favoriteNotes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Favorites" subtitle="Quick access to your starred items" />
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-surfaceHover dark:bg-dark-surfaceHover flex items-center justify-center">
              <Star className="w-8 h-8 text-light-textMuted dark:text-dark-textMuted" />
            </div>
            <h3 className="text-sm font-medium text-light-textSecondary dark:text-dark-textSecondary mb-1">
              No favorites yet
            </h3>
            <p className="text-xs text-light-textMuted dark:text-dark-textMuted">
              Star credentials and notes to access them quickly here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Favorites" subtitle="Quick access to your starred items" />

      {favoriteCredentials.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-light-border dark:border-dark-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              Favorite Credentials
              <Badge variant="neutral">{favoriteCredentials.length}</Badge>
            </h3>
          </div>
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {favoriteCredentials.map((cred) => {
              const serviceName = getServiceNameFromUrl(cred.url);
              const serviceColor = getServiceColor(serviceName);
              return (
                <div key={cred.id} className="px-4 py-3 flex items-center gap-3 hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: serviceColor + '20' }}>
                    <span className="text-sm font-medium" style={{ color: serviceColor }}>{serviceName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">{cred.title}</p>
                    <p className="text-xs text-light-textMuted dark:text-dark-textMuted truncate">{cred.username}</p>
                  </div>
                  <Dropdown
                    align="right"
                    trigger={
                      <button className="text-light-textMuted dark:text-dark-textMuted hover:text-light-text dark:hover:text-dark-text p-1.5 rounded hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    }
                    items={getCredentialActions(cred)}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {favoriteNotes.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-light-border dark:border-dark-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Favorite Notes
              <Badge variant="neutral">{favoriteNotes.length}</Badge>
            </h3>
          </div>
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {favoriteNotes.map((note) => (
              <div key={note.id} className="px-4 py-3 flex items-center gap-3 hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover">
                <div className="w-8 h-8 rounded-lg bg-light-surfaceHover dark:bg-dark-surfaceHover flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-light-success dark:text-dark-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">{note.title}</p>
                  <p className="text-xs text-light-textMuted dark:text-dark-textMuted truncate">Updated {formatRelativeTime(note.updatedAt)}</p>
                </div>
                <Dropdown
                  align="right"
                  trigger={
                    <button className="text-light-textMuted dark:text-dark-textMuted hover:text-light-text dark:hover:text-dark-text p-1.5 rounded hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  }
                  items={getNoteActions(note)}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}