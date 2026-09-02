import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Theme, AccentColor, FontSize } from '../lib/types';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_COLORS: Record<AccentColor, { light: string; dark: string }> = {
  sage: { light: '#8FBC8F', dark: '#7BB97B' },
  clay: { light: '#C49A6C', dark: '#D4A574' },
  slate: { light: '#64748B', dark: '#94A3B8' },
  moss: { light: '#6B8E23', dark: '#8FBC8F' },
  stone: { light: '#78716C', dark: '#A8A29E' },
};

const FONT_SIZES: Record<FontSize, string> = {
  small: '0.8125rem',
  medium: '0.875rem',
  large: '1rem',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('accentColor') as AccentColor) || 'slate';
    }
    return 'slate';
  });
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('fontSize') as FontSize) || 'medium';
    }
    return 'medium';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme') as Theme;
    const storedAccent = localStorage.getItem('accentColor') as AccentColor;
    const storedFontSize = localStorage.getItem('fontSize') as FontSize;
    if (storedTheme) setThemeState(storedTheme);
    if (storedAccent) setAccentColorState(storedAccent);
    if (storedFontSize) setFontSizeState(storedFontSize);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let resolved: 'light' | 'dark';

    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }

    setResolvedTheme(resolved);
    root.classList.add(resolved);
    localStorage.setItem('theme', theme);

    // Apply accent color
    const accent = ACCENT_COLORS[accentColor];
    root.style.setProperty('--accent-light', accent.light);
    root.style.setProperty('--accent-dark', accent.dark);
    root.style.setProperty('--accent', resolved === 'dark' ? accent.dark : accent.light);

    // Apply font size
    root.style.setProperty('--base-font-size', FONT_SIZES[fontSize]);
  }, [theme, accentColor, fontSize, mounted]);

  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);

      // Update accent for system theme change
      const accent = ACCENT_COLORS[accentColor];
      document.documentElement.style.setProperty('--accent', resolved === 'dark' ? accent.dark : accent.light);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted, accentColor]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem('accentColor', color);
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('fontSize', size);
  }, []);

  // Always wrap children in the Provider so children that use useTheme() during
  // the initial (pre-mount) render don't throw. Once mounted, we update the
  // resolvedTheme in the useEffect below.
  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      accentColor,
      setAccentColor,
      fontSize,
      setFontSize,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}