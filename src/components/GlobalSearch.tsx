import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@lib/utils';
import { useData } from '@context/DataContext';
import {
  Search,
  LayoutDashboard,
  Database,
  FileText,
  CheckSquare,
  Calendar,
  DollarSign,
  FolderKanban,
  Star,
  Key,
  ArrowRight,
  X,
} from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'navigation' | 'credential' | 'note' | 'task';
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'vault', label: 'My Vault', icon: Database, href: '/vault' },
  { id: 'notes', label: 'Notes', icon: FileText, href: '/notes' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
  { id: 'income', label: 'Income', icon: DollarSign, href: '/income' },
  { id: 'folders', label: 'Folders', icon: FolderKanban, href: '/folders' },
  { id: 'favorites', label: 'Favorites', icon: Star, href: '/favorites' },
  { id: 'password-generator', label: 'Generate Password', icon: Key, href: '/password-generator' },
];

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { credentials, notes, tasks } = useData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(navigationItems.map(item => ({
        id: item.id,
        type: 'navigation' as const,
        icon: <item.icon className="w-4 h-4" />,
        title: item.label,
        href: item.href,
      })));
      return;
    }

    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search navigation
    navigationItems
      .filter(item => item.label.toLowerCase().includes(lowerQuery))
      .forEach(item => {
        searchResults.push({
          id: item.id,
          type: 'navigation',
          icon: <item.icon className="w-4 h-4" />,
          title: item.label,
          href: item.href,
        });
      });

    // Search credentials
    credentials
      .filter(c =>
        c.title.toLowerCase().includes(lowerQuery) ||
        c.username.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(c => {
        searchResults.push({
          id: c.id,
          type: 'credential',
          icon: <Database className="w-4 h-4" />,
          title: c.title,
          subtitle: c.username,
          href: '/vault',
        });
      });

    // Search notes
    notes
      .filter(n =>
        n.title.toLowerCase().includes(lowerQuery) ||
        n.content.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(n => {
        searchResults.push({
          id: n.id,
          type: 'note',
          icon: <FileText className="w-4 h-4" />,
          title: n.title,
          subtitle: n.content.substring(0, 50) + '...',
          href: '/notes',
        });
      });

    // Search tasks
    tasks
      .filter(t =>
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(t => {
        searchResults.push({
          id: t.id,
          type: 'task',
          icon: <CheckSquare className="w-4 h-4" />,
          title: t.title,
          subtitle: t.description?.substring(0, 50),
          href: '/tasks',
        });
      });

    setResults(searchResults.slice(0, 10));
  }, [query, credentials, notes, tasks]);

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.href) {
      navigate(result.href);
    }
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/60 flex items-start justify-center pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#333]">
          <Search className="w-5 h-5 text-[#666]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vault, notes, tasks, ledger — or jump to..."
            className="flex-1 bg-transparent text-white placeholder-[#666] outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-[#666] bg-[#222] border border-[#333] rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-[#666] text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              {query.trim() === '' && (
                <div className="px-4 py-1.5 text-[10px] font-medium text-[#666] uppercase tracking-wider">
                  Quick Navigation
                </div>
              )}
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#222] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#222] flex items-center justify-center text-[#888]">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-[#666] truncate">{result.subtitle}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#666]" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}