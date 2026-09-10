import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { deriveKey, setVaultKey } from './lib/crypto/vaultStorage'
import './index.css'
import App from './App.tsx'

async function bootstrap() {
  const pending = sessionStorage.getItem('cova:unlock-password');
  if (pending) {
    sessionStorage.removeItem('cova:unlock-password');
    const salt = await import('./lib/crypto/vaultStorage').then(m => m.getOrCreateVaultSalt());
    const { key } = await deriveKey(pending, salt);
    setVaultKey(key);
  }
}

bootstrap().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
