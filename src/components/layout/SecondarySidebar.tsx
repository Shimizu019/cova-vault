import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@lib/utils';
import { User, Palette, Globe, Shield, Database } from 'lucide-react';

interface SettingsItem {
  id: string;
  label: string;
  href: string;
}

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SettingsItem[];
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
      { id: 'security', label: 'Security & 2FA', href: '/settings#security' },
    ],
  },
  {
    id: 'data',
    title: 'Data',
    icon: Database,
    items: [
      { id: 'data', label: 'Backup & Export', href: '/settings#data' },
    ],
  },
];

export function SecondarySidebar() {
  const location = useLocation();
  const activeHash = location.hash.replace('#', '') || 'account';

  return (
    <nav
      className="hidden md:block w-56 flex-shrink-0 bg-cova-surface border-r border-cova-border h-full overflow-y-auto scrollbar-thin py-4"
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
              {section.items.map((item) => {
                const isActive = activeHash === item.id;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    className={cn(
                      'sidebar-item text-xs',
                      isActive && 'sidebar-item-active bg-cova-primary/10 text-cova-primary font-medium'
                    )}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}