import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

// ---------------------------------------------------------------------------
// Build identity — injected into the bundle as __BUILD_INFO__ so any installed
// build can prove which source produced it. CI (GitHub Actions) supplies
// GITHUB_SHA / GITHUB_RUN_NUMBER / GITHUB_REF_NAME; local builds fall back to
// the local git state.
// ---------------------------------------------------------------------------
function resolveGitCommitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'unknown'
  }
}

function resolveBuildNumber(): string {
  if (process.env.GITHUB_RUN_NUMBER) return String(process.env.GITHUB_RUN_NUMBER)
  try {
    return execSync('git rev-list --count HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return '0'
  }
}

const buildInfo = {
  // CI: prefer the release tag (v0.1.8-beta → 0.1.8-beta) since package.json
  // stays at 0.0.0 between releases. Local builds fall back to package.json.
  version: process.env.GITHUB_REF_NAME?.startsWith('v')
    ? process.env.GITHUB_REF_NAME.slice(1)
    : (JSON.parse(readFileSync('./package.json', 'utf-8')) as { version?: string }).version ?? '0.0.0',
  tag: process.env.GITHUB_REF_NAME ?? 'local',
  buildNumber: resolveBuildNumber(),
  commitSha: resolveGitCommitSha(),
  buildTime: new Date().toISOString(),
}


// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png'],
      manifest: {
        name: 'Cova - Password Manager',
        short_name: 'Cova',
        description: 'Your secure password manager and personal vault',
        theme_color: '#0B0C10',
        background_color: '#0B0C10',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@components': path.resolve(__dirname, './src/components'),
      '@context': path.resolve(__dirname, './src/context'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@modals': path.resolve(__dirname, './src/modals'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@features': path.resolve(__dirname, './src/components/features'),
      '@layout': path.resolve(__dirname, './src/components/layout'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@store': path.resolve(__dirname, './src/lib/store'),
    },
  },
})