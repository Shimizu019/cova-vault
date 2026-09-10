const DEFAULT_CLEAR_DELAY = 30000;

export async function secureCopy(text: string, clearAfterMs = DEFAULT_CLEAR_DELAY) {
  await navigator.clipboard.writeText(text);
  setTimeout(async () => {
    try {
      await navigator.clipboard.writeText('');
    } catch {
      // clipboard may be unavailable; ignore
    }
  }, clearAfterMs);
}
