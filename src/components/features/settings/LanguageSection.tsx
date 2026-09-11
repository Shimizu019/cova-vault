import { Globe } from 'lucide-react';
import { useSettingsStore } from '@store';
import type { Language } from '@lib/types';

const LANGUAGES: { value: Language; label: string; native: string; flag: string }[] = [
  { value: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
  { value: 'fil', label: 'Filipino', native: 'Filipino', flag: '🇵🇭' },
  { value: 'ko', label: 'Korean', native: '한국어', flag: '🇰🇷' },
  { value: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳' },
  { value: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { value: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { value: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'id', label: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { value: 'pt', label: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { value: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
];

export function LanguageSection() {
  const { settings, updateSettings } = useSettingsStore();

  const current = LANGUAGES.find((l) => l.value === settings.language) || LANGUAGES[0];

  return (
    <div id="language" className="card mb-4 overflow-hidden">
      <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
        <Globe className="w-4 h-4 text-cova-textMuted" />
        <h2 className="text-sm font-semibold text-cova-text">Language</h2>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cova-text">Display Language</p>
            <p className="text-xs text-cova-textMuted mt-0.5">Choose your preferred language for the app interface</p>
          </div>
          <select
            value={settings.language}
            onChange={(e) => updateSettings({ language: e.target.value as Language })}
            className="input w-auto min-w-[180px] cursor-pointer"
            aria-label="Select language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.flag} {lang.native}
              </option>
            ))}
          </select>
        </div>

        {/* Currently selected */}
        <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-cova-surfaceHover border border-cova-border">
          <span className="text-xl">{current.flag}</span>
          <div>
            <p className="text-sm font-medium text-cova-text">{current.native}</p>
            <p className="text-xs text-cova-textMuted">{current.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}