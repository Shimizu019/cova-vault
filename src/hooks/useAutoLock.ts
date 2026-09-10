import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setVaultKey } from '@lib/crypto/vaultStorage';
import { useSettingsStore } from '@store';

const MIN_TIMEOUT = 60 * 1000;

export function useAutoLock() {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();

  useEffect(() => {
    if (!settings.autoLock) return;
    const timeoutMs = Math.max(settings.autoLockTimeout, MIN_TIMEOUT);

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];

    let timer: ReturnType<typeof setTimeout> | null = null;

    const lock = () => {
      setVaultKey(null);
      navigate('/lock');
    };

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(lock, timeoutMs);
    };

    const handleBlur = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(lock, 1000);
    };

    const handleFocus = () => {
      if (timer) clearTimeout(timer);
      resetTimer();
    };

    resetTimer();

    for (const event of events) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (timer) clearTimeout(timer);
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate, settings.autoLock, settings.autoLockTimeout]);
}
