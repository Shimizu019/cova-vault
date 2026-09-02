import { Palette } from 'lucide-react';
import { Label } from '@components/ui/Input';
import { useSettingsStore } from '@store';
import type { Theme, AccentColor, FontSize, LayoutDensity } from '@lib/types';

const ACCENT_COLORS: { value: AccentColor; label: string; hex: string }[] = [
  { value: 'violet', label: 'Violet', hex: '#7C3AED' },
  { value: 'blue', label: 'Blue', hex: '#3B82F6' },
  { value: 'green', label: 'Green', hex: '#22C55E' },
  { value: 'orange', label: 'Orange', hex: '#F97316' },
  { value: 'pink', label: 'Pink', hex: '#EC4899' },
  { value: 'red', label: 'Red', hex: '#EF4444' },
];

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const DENSITIES: { value: LayoutDensity; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
];

export function AppearanceSection() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div id="appearance" className="card mb-4 overflow-hidden">
      <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
        <Palette className="w-4 h-4 text-cova-textMuted" />
        <h2 className="text-sm font-semibold text-cova-text">Appearance</h2>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <Label>Theme</Label>
          <div className="flex gap-2 mt-2">
            {(['dark', 'light'] as Theme[]).map((t) => (
              <button key={t} onClick={() => updateSettings({ theme: t })}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors capitalize
                  ${settings.theme === t ? 'border-cova-primary bg-cova-primary/15 text-cova-primary' : 'border-cova-border bg-cova-bg text-cova-textSecondary hover:border-cova-borderStrong'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Accent Color</Label>
          <div className="flex gap-3 mt-2">
            {ACCENT_COLORS.map((c) => (
              <button key={c.value} onClick={() => updateSettings({ accentColor: c.value })}
                className="flex flex-col items-center gap-1.5"
                aria-label={`${c.label} accent`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${settings.accentColor === c.value ? 'ring-2 ring-offset-2 ring-offset-cova-bg scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c.hex, boxShadow: settings.accentColor === c.value ? `0 0 0 2px ${c.hex}` : undefined }}>
                  {settings.accentColor === c.value && <span className="text-white text-sm">✓</span>}
                </div>
                <span className="text-xs text-cova-textMuted">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Font Size</Label>
          <div className="flex gap-2 mt-2">
            {FONT_SIZES.map((s) => (
              <button key={s.value} onClick={() => updateSettings({ fontSize: s.value })}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors
                  ${settings.fontSize === s.value ? 'border-cova-primary bg-cova-primary/15 text-cova-primary' : 'border-cova-border bg-cova-bg text-cova-textSecondary hover:border-cova-borderStrong'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Layout Density</Label>
          <div className="flex gap-2 mt-2">
            {DENSITIES.map((d) => (
              <button key={d.value} onClick={() => updateSettings({ layoutDensity: d.value })}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors
                  ${settings.layoutDensity === d.value ? 'border-cova-primary bg-cova-primary/15 text-cova-primary' : 'border-cova-border bg-cova-bg text-cova-textSecondary hover:border-cova-borderStrong'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}