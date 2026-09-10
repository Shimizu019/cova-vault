import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setVaultKey } from '@lib/crypto/vaultStorage';

const DEFAULT_TIMEOUT = 5 * 60 * 1000;

export function useAutoLock(timeoutMs = DEFAULT_TIMEOUT) {
  const navigate = useNavigate();

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];

    let timer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setVaultKey(null);
        navigate('/lock');
      }, timeoutMs);
    };

    resetTimer();

    for (const event of events) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timer) clearTimeout(timer);
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [navigate, timeoutMs]);
}
