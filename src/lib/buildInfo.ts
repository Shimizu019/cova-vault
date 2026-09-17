/**
 * Build identity of the running bundle. Injected at build time by
 * vite.config.ts (`define.__BUILD_INFO__`) so every build — local or CI — can
 * prove which source it was built from. Displayed in Settings → Diagnostics
 * and on the Lock screen footer.
 */
export interface BuildInfo {
  version: string;
  tag: string;
  buildNumber: string;
  commitSha: string;
  commitShort: string;
  buildTime: string;
}

function fallbackBuildInfo(): BuildInfo {
  return {
    version: '0.0.0',
    tag: 'unknown',
    buildNumber: 'unknown',
    commitSha: 'unknown',
    commitShort: 'unknown',
    buildTime: 'unknown',
  };
}

export function getBuildInfo(): BuildInfo {
  let injected: Omit<BuildInfo, 'commitShort'> | undefined;
  try {
    if (typeof __BUILD_INFO__ !== 'undefined') {
      injected = __BUILD_INFO__;
    }
  } catch {
    injected = undefined;
  }
  if (!injected) return fallbackBuildInfo();
  return {
    ...injected,
    commitShort:
      injected.commitSha && injected.commitSha !== 'unknown'
        ? injected.commitSha.slice(0, 7)
        : 'unknown',
  };
}
