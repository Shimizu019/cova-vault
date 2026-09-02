import { NavLink } from 'react-router-dom';
import { cn } from '@lib/utils';
import { User, Palette, Globe, Shield, Database, Trash2 } from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { id: string; label: string; href: string }[];
}

const sections: SettingsSection[] = [
  {
    id: 'general',
    title: 'General',
    icon: User,
    items: [
      { id: 'account', label: 'Account', href: '/settings#account' },
      { id: 'appearance', label: 'Appearance', href: '/settings#appearance' },
      { id: 'language', label: 'Language', href: '/settings#language' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    items: [
      { id: '2fa', label: '2FA', href: '/settings#2fa' },
      { id: 'sessions', label: 'Sessions', href: '/settings#sessions' },
      { id: 'privacy', label: 'Privacy', href: '/settings#privacy' },
    ],
  },
  {
    id: 'data',
    title: 'Data',
    icon: Database,
    items: [
      { id: 'backup', label: 'Backup', href: '/settings#backup' },
      { id: 'import', label: 'Import', href: '/settings#import' },
      { id: 'export', label: 'Export', href: '/settings#export' },
    ],
  },
  {
    id: 'danger',
    title: 'Danger Zone',
    icon: Trash2,
    items: [
      { id: 'clear-activities', label: 'Clear All Activities', href: '/settings#clear-activities' },
      { id: 'delete-all', label: 'Delete All Data', href: '/settings#delete-all' },
    ],
  },
];

export function SecondarySidebar() {
  return (
    <nav
      className="w-56 flex-shrink-0 bg-cova-surface border-r border-cova-border h-full overflow-y-auto scrollbar-thin py-4"
      aria-label="Settings navigation"
    >
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.id} className="mb-5">
            <div className="px-4 mb-1.5 flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-cova-textMuted" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-cova-textMuted uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'sidebar-item text-xs',
                      isActive && 'sidebar-item-active bg-cova-primary/10 text-cova-primary font-medium'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}