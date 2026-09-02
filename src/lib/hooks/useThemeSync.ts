import { useEffect } from 'react';
import { useSettingsStore } from '@store';
import type { AccentColor } from '@lib/types';

const ACCENT_HEX: Record<AccentColor, string> = {
  violet: '#7C3AED',
  blue: '#3B82F6',
  green: '#22C55E',
  orange: '#F97316',
  pink: '#EC4899',
  red: '#EF4444',
};

export function useThemeSync() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
    } else {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    }
    const accent = ACCENT_HEX[settings.accentColor] || ACCENT_HEX.violet;
    root.style.setProperty('--cova-accent', accent);
    root.style.setProperty('--cova-primary', accent);
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', settings.theme === 'light' ? '#F7F8FA' : '#0B0C10');
  }, [settings.theme, settings.accentColor]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.theme || 'dark';
    if (theme === 'light') { root.setAttribute('data-theme', 'light'); root.classList.remove('dark'); }
    else { root.setAttribute('data-theme', 'dark'); root.classList.add('dark'); }
    const accent = ACCENT_HEX[settings.accentColor] || ACCENT_HEX.violet;
    root.style.setProperty('--cova-accent', accent);
    root.style.setProperty('--cova-primary', accent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}