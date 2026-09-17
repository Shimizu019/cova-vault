/// <reference types="vite/client" />

/**
 * Build identity injected by vite.config.ts at build time
 * (see `define.__BUILD_INFO__`). Allows any installed APK/web build to be
 * traced back to the exact source:
 *   Source Code → Git Commit → GitHub Actions → APK → Installed App
 */
interface BuildInfo {
  version: string;
  tag: string;
  buildNumber: string;
  commitSha: string;
  buildTime: string;
}

declare const __BUILD_INFO__: BuildInfo;
