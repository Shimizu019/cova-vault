import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUIStore } from '@store';
import { PrimarySidebar } from './PrimarySidebar';
import { SecondarySidebar } from './SecondarySidebar';
import { Menu, Search, ChevronDown } from 'lucide-react';
import { cn } from '@lib/utils';
import { Avatar } from '@components/ui/Badge';
import { useSettingsStore } from '@store';

export function AppShell() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, toasts, removeToast, searchQuery, setSearchQuery } = useUIStore();
  const { user } = useSettingsStore();

  // Auto-collapse sidebar when on settings route (per spec)
  const shouldCollapse = sidebarCollapsed || location.pathname.startsWith('/settings');
  const showSecondarySidebar = location.pathname.startsWith('/settings');

  // Update html lang attr for accessibility
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  return (
    <div className="flex h-screen w-full bg-cova-bg text-cova-text overflow-hidden">
      <PrimarySidebar collapsed={shouldCollapse} />

      {showSecondarySidebar && <SecondarySidebar />}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 bg-cova-bg border-b border-cova-border px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors"
            aria-label={shouldCollapse ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-4 h-4" />
          </button>

          {!showSecondarySidebar && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cova-textMuted pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search credentials, notes, tasks..."
                className="input pl-9 pr-3 w-full"
                aria-label="Global search"
              />
            </div>
          )}

          <div className="flex-1" />

          {/* User */}
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-cova-surfaceHover transition-colors cursor-pointer">
            <Avatar initial={user.avatarInitial} />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-medium text-cova-text leading-tight">{user.displayName}</span>
              <span className="text-xs text-cova-textMuted leading-tight">{user.email}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-cova-textMuted hidden md:block" />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-cova-bg">
          <Outlet />
        </div>
      </main>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto px-4 py-3 rounded-xl shadow-lg border animate-slide-in flex items-center gap-3 min-w-[280px]',
              toast.type === 'success' && 'bg-cova-successLight border-cova-success text-cova-success',
              toast.type === 'error' && 'bg-cova-dangerLight border-cova-danger text-cova-danger',
              toast.type === 'info' && 'bg-cova-primaryLight border-cova-primary text-cova-primary'
            )}
          >
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-60 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}