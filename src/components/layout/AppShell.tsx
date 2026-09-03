import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUIStore } from '@store';
import { PrimarySidebar } from './PrimarySidebar';
import { SecondarySidebar } from './SecondarySidebar';
import { Menu, Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@lib/utils';
import { Avatar } from '@components/ui/Badge';
import { useSettingsStore } from '@store';

export function AppShell() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, toasts, removeToast, searchQuery, setSearchQuery } = useUIStore();
  const { user } = useSettingsStore();
  const [settingsNavOpen, setSettingsNavOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Auto-collapse sidebar when on settings route (per spec)
  const shouldCollapse = sidebarCollapsed || location.pathname.startsWith('/settings');
  const showSecondarySidebar = location.pathname.startsWith('/settings');

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Update html lang attr for accessibility
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  return (
    <div className="flex h-screen w-full bg-cova-bg text-cova-text overflow-hidden">
      {/* Desktop primary sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <PrimarySidebar collapsed={shouldCollapse} />
      </div>

      {/* Mobile drawer overlay */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer (slides in from left) */}
      <div
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-slow ease-out',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="relative h-full">
          <PrimarySidebar collapsed={false} />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showSecondarySidebar && settingsNavOpen && <SecondarySidebar />}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 bg-cova-bg border-b border-cova-border px-3 sm:px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (showSecondarySidebar) {
                setSettingsNavOpen((open) => !open);
              } else {
                // On mobile, open the drawer; on desktop, toggle collapse
                if (window.innerWidth < 768) {
                  setMobileNavOpen(true);
                } else {
                  toggleSidebar();
                }
              }
            }}
            className="p-2 rounded-lg text-cova-textSecondary hover:bg-cova-surfaceHover hover:text-cova-text transition-colors"
            aria-label={showSecondarySidebar
              ? (settingsNavOpen ? 'Hide settings navigation' : 'Show settings navigation')
              : (shouldCollapse ? 'Expand sidebar' : 'Collapse sidebar')}
          >
            <Menu className="w-5 h-5" />
          </button>

          {!showSecondarySidebar && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cova-textMuted pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="input pl-9 pr-3 w-full"
                aria-label="Global search"
              />
            </div>
          )}

          <div className="flex-1" />

          {/* User */}
          <div className="flex items-center gap-2 sm:gap-2.5 px-1.5 sm:px-2 py-1.5 rounded-lg hover:bg-cova-surfaceHover transition-colors cursor-pointer">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="User avatar"
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <Avatar initial={user.avatarInitial} />
            )}
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
      <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto px-4 py-3 rounded-xl shadow-lg border animate-slide-in flex items-center gap-3 sm:min-w-[280px]',
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