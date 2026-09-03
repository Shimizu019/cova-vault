import { NavLink } from 'react-router-dom';
import { cn } from '@lib/utils';
import { User } from 'lucide-react';

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