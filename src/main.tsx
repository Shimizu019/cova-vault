import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initStorage } from '@lib/storage/storage'

initStorage().then(() => {
  import('./App.tsx').then(({ default: App }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
})
