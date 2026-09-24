#!/usr/bin/env node
/**
 * Cova Vault — canonical Android version resolver.
 *
 * WHY THIS EXISTS
 * ---------------
 * Android only installs a new APK over an installed one when ALL THREE match:
 *   1. the same applicationId (`com.cova.vault`),
 *   2. a strictly GREATER versionCode, and
 *   3. the same signing certificate.
 *
 * The old release workflow fed `github.run_number` into `COVA_VERSION_CODE`,
 * so the version code was arbitrary per workflow run instead of being tied to
 * the released version. This script derives both Android version values from
 * the release tag in one deterministic place, so every release is monotonic:
 *
 *   versionName = tag without the leading "v"   (0.1.9-beta -> "0.1.9-beta")
 *   versionCode = major * 10000 + minor * 100 + patch
 *                  0.1.8-beta -> 108
 *                  0.1.9-beta -> 109
 *                  0.2.0      -> 200
 *
 * The formula needs at most two digits per part, which is plenty for this
 * project and keeps 0.2.0 greater than every 0.1.x release (a bare "patch"
 * numbering scheme would reset to 0 at 0.2.0 and break future updates).
 *
 * USAGE
 * -----
 *   node scripts/android-version.mjs --name 0.1.9-beta
 *     versionName=0.1.9-beta
 *     versionCode=109
 *
 *   node scripts/android-version.mjs --name 0.1.9-beta --format json
 *   node scripts/android-version.mjs --name 0.1.9-beta --code 9   # explicit override
 *   node scripts/android-version.mjs --self-test
 *
 * The default `keyvalue` output is written straight into $GITHUB_OUTPUT.
 */

import process from 'node:process';

const NAME_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;
const MAX_PART = 99;

const USAGE = [
  'Usage:',
  '  node scripts/android-version.mjs --name <version> [--code <int>] [--format keyvalue|json]',
  '',
  'Examples:',
  '  node scripts/android-version.mjs --name 0.1.9-beta',
  '    versionName=0.1.9-beta',
  '    versionCode=109',
].join('\n');

/** @returns {{major:number,minor:number,patch:number}|null} */
export function parseVersionName(name) {
  const match = NAME_PATTERN.exec(String(name ?? '').trim());
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/**
 * Deterministic, monotonic versionCode for a release version name.
 * Returns null when the name is not a supported semantic version.
 */
export function versionCodeFromName(name) {
  const parts = parseVersionName(name);
  if (!parts) return null;
  const { major, minor, patch } = parts;
  if (major > MAX_PART || minor > MAX_PART || patch > MAX_PART) return null;
  return major * 10000 + minor * 100 + patch;
}

function fail(message) {
  console.error(`[android-version] ${message}`);
  console.error(USAGE);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { name: null, code: null, format: 'keyvalue', selfTest: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--name':
        args.name = argv[++i] ?? null;
        break;
      case '--code':
        args.code = argv[++i] ?? null;
        break;
      case '--format':
        args.format = argv[++i] ?? 'keyvalue';
        break;
      case '--self-test':
        args.selfTest = true;
        break;
      case '--help':
      case '-h':
        console.log(USAGE);
        process.exit(0);
        break;
      default:
        fail(`Unknown argument: ${token}`);
    }
  }
  return args;
}

function selfTest() {
  const cases = [
    ['0.1.0', 100],
    ['0.1.1', 101],
    ['0.1.8-beta', 108],
    ['0.1.9-beta', 109],
    ['0.2.0', 200],
    ['1.0.0', 10000],
    ['1.0.1-beta', 10001],
  ];

  let failed = 0;
  let previous = -1;
  for (const [name, expected] of cases) {
    const actual = versionCodeFromName(name);
    if (actual !== expected) {
      console.error(`[android-version] self-test FAIL: ${name} -> ${actual} (expected ${expected})`);
      failed += 1;
    }
    if (typeof actual === 'number' && actual <= previous) {
      console.error(`[android-version] self-test FAIL: ${name} is not greater than the previous version`);
      failed += 1;
    }
    if (typeof actual === 'number') previous = actual;
  }

  for (const invalid of ['', 'v0.1.9', '1.2', 'abc', '0.1.9.4', '1.200.0']) {
    if (versionCodeFromName(invalid) !== null) {
      console.error(`[android-version] self-test FAIL: "${invalid}" should be rejected`);
      failed += 1;
    }
  }

  if (failed > 0) {
    console.error(`[android-version] self-test finished with ${failed} failure(s).`);
    process.exit(1);
  }
  console.log('[android-version] self-test passed.');
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.selfTest) {
    selfTest();
    return;
  }

  if (!args.name) fail('--name is required (for example: --name 0.1.9-beta)');

  const versionName = args.name.trim();
  if (!parseVersionName(versionName)) {
    fail(`"${versionName}" is not a supported version name. Expected MAJOR.MINOR.PATCH with an optional suffix, e.g. 0.1.9-beta.`);
  }

  const derived = versionCodeFromName(versionName);
  if (derived === null) {
    fail(`Cannot derive versionCode from "${versionName}" (each part must be 0-${MAX_PART}).`);
  }

  let versionCode = derived;
  if (args.code !== null) {
    const explicit = String(args.code).trim();
    if (!/^\d+$/.test(explicit)) fail(`--code must be a positive integer, got "${explicit}".`);
    versionCode = Number(explicit);
  }
  if (!Number.isInteger(versionCode) || versionCode < 1) {
    fail(`versionCode must be an integer >= 1, got "${versionCode}".`);
  }

  if (args.format === 'json') {
    console.log(JSON.stringify({ versionName, versionCode }));
    return;
  }
  if (args.format !== 'keyvalue') {
    fail(`Unsupported --format "${args.format}" (expected keyvalue or json).`);
  }

  console.log(`versionName=${versionName}`);
  console.log(`versionCode=${versionCode}`);
}

main();
