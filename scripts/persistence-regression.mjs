// Run: node scripts/persistence-regression.mjs
// Real stores + encryption; only the Capacitor bridge is mocked. Not an Android test.
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(root, '.persistence-test-'));
const bridge = `
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const file = process.env.PERSISTENCE_FILE;
const read = () => existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
export const Capacitor = { isNativePlatform: () => true, isPluginAvailable: () => true };
export const Preferences = {
  async keys() { return { keys: Object.keys(read()) }; },
  async get({ key }) { return { value: read()[key] ?? null }; },
  async set({ key, value }) { const data = read(); data[key] = value; writeFileSync(file, JSON.stringify(data)); },
  async remove({ key }) { const data = read(); delete data[key]; writeFileSync(file, JSON.stringify(data)); }
};
`;
const worker = `
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
// Any accidental web fallback must fail, not silently pass against another mock.
Object.defineProperty(globalThis, 'localStorage', { get() { throw Error('Unexpected localStorage fallback'); } });
const storage = await import('@lib/storage/storage');
await storage.initStorage();
const stores = await import('@store');
const crypto = await import('@lib/crypto/vaultStorage');
const persistence = await import('@lib/storage/vaultPersistence');
const { flushEncryptedPersistence } = await import('@lib/crypto/encryptedStorage');
const selected = [stores.useCredentialStore, stores.useNoteStore, stores.useWalletStore, stores.useSavingsStore, stores.useTaskStore];
const snapshot = () => JSON.parse(JSON.stringify(selected.map(s => s.getState())));
const mode = process.argv[2];
assert.equal(stores.useCredentialStore.getState().credentials.length, 0, 'fresh process must start with empty memory');
const salt = await crypto.getOrCreateVaultSalt();
const { key } = await crypto.deriveKey('synthetic-regression-password', salt);
crypto.setVaultKey(key);
const before = mode === 'read' ? readFileSync(process.env.PERSISTENCE_FILE, 'utf8') : null;
const results = await persistence.hydrateAllStores();
assert.ok(results.every(r => r.status !== 'failed'), 'hydration must succeed');
if (mode === 'seed') {
  stores.useCredentialStore.getState().addCredential({ name: 'test-credential', username: 'synthetic', password: 'synthetic', tags: [], favorite: true });
  stores.useNoteStore.getState().addNote({ title: 'test-note', content: 'synthetic body', favorite: true });
  stores.useWalletStore.getState().setStartingBalance(1234);
  stores.useSavingsStore.getState().addGoal({ id: 'test-goal', name: 'test-savings', target: 5000, current: 100, createdAt: new Date().toISOString() });
  stores.useTaskStore.getState().addTask({ title: 'test-task', priority: 'high', status: 'todo', dueDate: '2026-09-17' });
  const live = snapshot();
  assert.equal(live[0].credentials.length, 1);
  assert.equal(live[1].notes.length, 1);
  assert.equal(live[2].startingBalance, 1234);
  assert.equal(live[3].goals.length, 1);
  assert.equal(live[4].tasks.length, 1);
  await flushEncryptedPersistence();
  await storage.flushStorage();
  writeFileSync(process.env.EXPECTED_FILE, JSON.stringify(live));
  const disk = JSON.parse(readFileSync(process.env.PERSISTENCE_FILE, 'utf8'));
  for (const name of ['credential', 'note', 'wallet', 'savings', 'task']) {
    const blob = JSON.parse(disk['cova-' + name + '-store']);
    assert.ok(blob.iv && blob.data, 'saved blob must be encrypted');
  }
  console.log('PASS: all five stores saved encrypted data');
} else {
  assert.deepEqual(snapshot(), JSON.parse(readFileSync(process.env.EXPECTED_FILE, 'utf8')), 'exact records must survive a fresh process');
  await flushEncryptedPersistence();
  await storage.flushStorage();
  assert.equal(readFileSync(process.env.PERSISTENCE_FILE, 'utf8'), before, 'hydration must not rewrite saved blobs');
  console.log('PASS: all five stores restored exactly without rewriting blobs');
}
`;
try {
  const entry = join(temp, 'entry.mjs');
  writeFileSync(entry, worker);
  const hooks = join(temp, 'hooks.mjs');
  const bridgeFile = join(temp, 'bridge.mjs');
  writeFileSync(bridgeFile, bridge);
  writeFileSync(hooks, `
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = ${JSON.stringify(root)};
const bridge = ${JSON.stringify(bridgeFile)};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (['@capacitor/core', '@capacitor/preferences'].includes(specifier)) {
      return { url: pathToFileURL(bridge).href, shortCircuit: true };
    }
    let path;
    if (specifier === '@store') path = join(root, 'src/lib/store/index.ts');
    else if (specifier.startsWith('@lib/')) path = join(root, 'src/lib', specifier.slice(5));
    else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      path = fileURLToPath(new URL(specifier, context.parentURL));
    }
    if (path) {
      for (const candidate of [path, path + '.ts', join(path, 'index.ts')]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      return { format: 'module', source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8')), shortCircuit: true };
    }
    return nextLoad(url, context);
  }
});
`);
  for (const phase of ['seed', 'read']) {
    const result = spawnSync(process.execPath, ['--import', pathToFileURL(hooks).href, entry, phase], {
      cwd: root, encoding: 'utf8', env: { ...process.env, PERSISTENCE_FILE: join(temp, 'storage.json'), EXPECTED_FILE: join(temp, 'expected.json') }
    });
    if (result.status !== 0) throw Error(result.stderr || result.error?.message || result.stdout);
    console.log(result.stdout.split('\n').filter(line => line.startsWith('PASS:')).join('\n'));
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
