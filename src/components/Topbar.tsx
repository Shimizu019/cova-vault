import { useState, useRef, useEffect } from 'react';
import { cn } from '@lib/utils';
import { Button } from '@components/ui/Button';
import { SearchBar } from '@components/ui/SearchBar';
import { Avatar } from '@components/ui/Avatar';
import { Dropdown } from '@components/ui/Dropdown';
import { ThemeSelector } from '@components/ui/ThemeSelector';
import { GlobalSearch } from './GlobalSearch';
import { useData } from '@context/DataContext';
import { useTheme } from '@context/ThemeContext';
import { LogOut, User, Shield, Command, Search } from 'lucide-react';

export function Topbar({ onSearch, searchValue }: { onSearch: (value: string) => void; searchValue: string }) {
  const { user, lock, isLocked } = useData();
  const { resolvedTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-12 bg-[#1a1a1a] dark:bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Keepr</span>
        </div>

        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#111] border border-[#333] rounded-lg px-10 py-2 text-sm text-white placeholder-[#666] focus:border-[#555] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSelector />
          
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#222] transition-colors text-[#888] hover:text-white"
            aria-label="Global Search (⌘K)"
            title="Global Search (⌘K)"
          >
            <Search className="w-4 h-4" />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-[#666] bg-[#222] border border-[#333] rounded">
              ⌘K
            </kbd>
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#222] transition-colors"
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
            >
              <Avatar name={user.name} size="sm" />
              <span className="text-sm font-medium text-white hidden md:block">{user.name}</span>
            </button>

            {showProfileMenu && (
              <Dropdown
                align="right"
                trigger={<span />}
                items={[
                  { label: 'Profile', icon: <User className="w-4 h-4" />, onClick: () => { /* Navigate to profile */ } },
                  { label: 'Security', icon: <Shield className="w-4 h-4" />, onClick: () => { /* Navigate to security */ } },
                  { label: 'Lock Vault', icon: <LogOut className="w-4 h-4" />, onClick: () => lock(), danger: false },
                ]}
              />
            )}
          </div>
        </div>
      </header>

      <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
    </>
  );
}