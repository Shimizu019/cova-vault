import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@lib/utils';
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  FolderKanban, 
  Star, 
  Key,
  Activity,
  Settings,
  Lock,
  UserCircle,
} from 'lucide-react';
import { useData } from '@context/DataContext';
import { Avatar } from '@components/ui/Avatar';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', group: 'main' as const },
  { id: 'vault', label: 'My Vault', icon: Database, href: '/vault', group: 'main' as const },
  { id: 'notes', label: 'Notes', icon: FileText, href: '/notes', group: 'main' as const },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, href: '/tasks', group: 'main' as const },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar', group: 'main' as const },
  { id: 'income', label: 'Income', icon: DollarSign, href: '/income', group: 'main' as const },
  { id: 'folders', label: 'Folders', icon: FolderKanban, href: '/folders', group: 'main' as const },
  { id: 'favorites', label: 'Favorites', icon: Star, href: '/favorites', group: 'main' as const },
  { id: 'password-generator', label: 'Generate Password', icon: Key, href: '/password-generator', group: 'main' as const },
  { id: 'activity', label: 'Activity Log', icon: Activity, href: '/activity', group: 'secondary' as const },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings', group: 'secondary' as const },
  { id: 'lock', label: 'Lock', icon: Lock, href: '/lock', group: 'secondary' as const },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useData();

  return (
    <aside className="w-64 bg-light-sidebar dark:bg-dark-sidebar border-r border-light-sidebarBorder dark:border-dark-sidebarBorder flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-light-sidebarBorder dark:border-dark-sidebarBorder">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-light-primary dark:bg-dark-primary flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-light-text dark:text-dark-text truncate">Keepr</h2>
            <p className="text-xs text-light-textMuted dark:text-dark-textMuted truncate">{user.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
        <div>
          {navItems.filter(item => item.group === 'main').map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <NavLink
                key={item.id}
                to={item.href}
                className={({ isActive: active }) => cn(
                  'sidebar-item',
                  active && 'sidebar-item-active'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-light-sidebarBorder dark:border-dark-sidebarBorder space-y-1">
          {navItems.filter(item => item.group === 'secondary').map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.id}
                to={item.href}
                className={({ isActive: active }) => cn(
                  'sidebar-item',
                  active && 'sidebar-item-active'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-light-sidebarBorder dark:border-dark-sidebarBorder">
        <div className="text-xs text-light-textMuted dark:text-dark-textMuted text-center">
          v1.0.0
        </div>
      </div>
    </aside>
  );
}