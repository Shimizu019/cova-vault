import { useTheme } from '@context/ThemeContext';
import { cn } from '@lib/utils';
import { Button } from '@components/ui/Button';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 bg-[#222] border border-[#333] rounded-lg p-1">
      {themes.map((t) => (
        <Button
          key={t.value}
          variant={theme === t.value ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setTheme(t.value)}
          className="gap-1.5"
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </Button>
      ))}
    </div>
  );
}