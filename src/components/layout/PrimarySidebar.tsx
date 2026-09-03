import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Key, Wallet, PiggyBank, FileText, CheckSquare,
  Folder, Star, Calendar, Clock, KeyRound, Activity, Settings, Lock,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { useUIStore } from '@store';
import CovaLogo from '@/assets/image/CovaLogo.png';
import lockLogo from '@/assets/image/lockLogo.png';
import type { ComponentType } from 'react';

interface NavLinkSpec {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  /** When true, the link is rendered disabled and clicking it shows a "Coming soon" toast. */
  comingSoon?: boolean;
}

const moduleItems: NavLinkSpec[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'credentials', label: 'Credentials', icon: Key, href: '/credentials' },
  { id: 'wallet', label: 'My Wallet', icon: Wallet, href: '/wallet' },
  { id: 'savings', label: 'Savings', icon: PiggyBank, href: '/savings' },
];

const sampleItems: NavLinkSpec[] = [
  { id: 'notes', label: 'Notes', icon: FileText, href: '/notes' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { id: 'folder', label: 'Folder', icon: Folder, href: '/folders' },
  { id: 'favorites', label: 'Favorites', icon: Star, href: '/favorites' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
  { id: 'schedule', label: 'Schedule', icon: Clock, href: '/schedule' },
  { id: 'generator', label: 'Password Generator', icon: KeyRound, href: '/generator' },
];

const securityItems: NavLinkSpec[] = [
  { id: 'activity', label: 'Activity Log', icon: Activity, href: '/activity' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  { id: 'lock', label: 'Lock', icon: Lock, href: '/lock' },
];

interface PrimarySidebarProps {
  collapsed: boolean;
}

function NavGroup({ title, items, collapsed }: { title: string; items: NavLinkSpec[]; collapsed: boolean }) {
  const { addToast } = useUIStore();

  const handleClick = (e: React.MouseEvent, item: NavLinkSpec) => {
    if (item.comingSoon) {
      e.preventDefault();
      addToast(`${item.label} — coming soon!`, 'info');
    }
  };

  return (
    <div className="mb-5">
      {!collapsed && (
        <h3 className="px-3 mb-1.5 text-xs font-semibold text-cova-textMuted uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-0.5" aria-label={`${title} navigation`}>
        {items.map((item) => {
          const Icon = item.icon;

          if (item.comingSoon) {
            // Render as a disabled <button> so the hash href doesn't win and the toast fires
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleClick(e, item)}
                className={cn(
                  'sidebar-item w-full text-left opacity-50 cursor-not-allowed',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
                aria-label={`${item.label} — coming soon`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          }

          if (item.href.includes('#')) {
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn('sidebar-item', collapsed && 'justify-center px-2')}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </a>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.href}
              className={({ isActive: navActive }) =>
                cn(
                  'sidebar-item',
                  navActive && 'sidebar-item-active',
                  collapsed && 'justify-center px-2'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export function PrimarySidebar({ collapsed }: PrimarySidebarProps) {
  return (
    <aside
      className={cn(
        'flex-shrink-0 bg-cova-sidebar border-r border-cova-sidebarBorder h-full overflow-y-auto scrollbar-thin transition-all duration-slow',
        collapsed ? 'w-20' : 'w-64'
      )}
      aria-label="Primary navigation"
    >
      {/* Logo */}
      <div className={cn('flex items-center justify-center py-5 border-b border-cova-sidebarBorder', collapsed ? 'px-2' : 'px-4')}>
        <img
          src={collapsed ? lockLogo : CovaLogo}
          alt="Cova"
          className={cn('flex-shrink-0', collapsed ? 'w-9 h-9' : 'h-9 w-auto')}
        />
      </div>

      <div className="px-3 py-4">
        <NavGroup title="Module" items={moduleItems} collapsed={collapsed} />
        <NavGroup title="Sample" items={sampleItems} collapsed={collapsed} />
        <NavGroup title="Security" items={securityItems} collapsed={collapsed} />
      </div>

      {/* Upgrade card */}
      {!collapsed && (
        <div className="mx-3 mb-4 p-4 rounded-xl bg-gradient-to-br from-cova-primary/20 to-purple-900/20 border border-cova-primary/30">
          <div className="w-8 h-8 rounded-lg bg-cova-primary/30 flex items-center justify-center mb-2">
            <Star className="w-4 h-4 text-cova-primary" />
          </div>
          <h4 className="text-sm font-semibold text-cova-text mb-1">Upgrade Pro</h4>
          <p className="text-xs text-cova-textMuted mb-3">Unlock 2FA, backup and more.</p>
          <button
            className="w-full text-xs py-1.5 rounded-lg bg-cova-primary hover:bg-cova-primaryHover text-white font-medium transition-colors"
            onClick={() => {
              const { addToast } = useUIStore.getState();
              addToast('Upgrade to Pro — coming soon!', 'info');
            }}
          >
            Upgrade
          </button>
        </div>
      )}
    </aside>
  );
}