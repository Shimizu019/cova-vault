import { useSettingsStore } from '@store';

const DEFAULT_CLEAR_DELAY = 30000;

export async function secureCopy(text: string, clearAfterMs?: number) {
  await navigator.clipboard.writeText(text);
  const finalDelay = clearAfterMs ?? useSettingsStore.getState().settings.clipboardClearDelay ?? DEFAULT_CLEAR_DELAY;
  if (finalDelay <= 0) return;
  setTimeout(async () => {
    try {
      await navigator.clipboard.writeText('');
    } catch {
      // clipboard may be unavailable; ignore
    }
  }, finalDelay);
}
