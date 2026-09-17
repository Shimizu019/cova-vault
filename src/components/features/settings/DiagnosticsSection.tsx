/**
 * Settings → Diagnostics: persistence probe UI.
 *
 * Also exported as `DiagnosticsPage` — a standalone page reachable from the
 * Lock screen (route /diagnostics) so Phase 2 can be run AFTER a force-close
 * but BEFORE unlocking, exactly as the lifecycle test requires.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Copy,
  Lock,
  RefreshCw,
  Stethoscope,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useUIStore } from '@store';
import { getBuildInfo } from '@lib/buildInfo';
import { isNative } from '@lib/storage/storage';
import { isVaultUnlocked } from '@lib/crypto/vaultStorage';
import {
  clearDiagData,
  collectStorageReport,
  FEATURE_KEYS,
  getVerdict,
  getServiceWorkerSummary,
  PERSISTENCE_TEST,
  readDiagLog,
  runPhase1SaveAndLogout,
  runPhase2VerifyAfterRestart,
  runPhase3VerifyAfterUnlock,
  type FeatureKey,
  type ProbePhaseResult,
  type ProbeStage,
  type StorageRow,
} from '@lib/diagnostics/persistenceProbe';

function StatusIcon({ status }: { status: ProbeStage['status'] }) {
  if (status === 'pass') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
  if (status === 'fail') return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
  return <CircleSlash className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
}

function StageRow({ stage }: { stage: ProbeStage }) {
  return (
    <li className="flex items-start gap-2 py-2 border-t border-cova-border/50 first:border-t-0">
      <StatusIcon status={stage.status} />
      <div className="min-w-0">
        <p className="text-xs font-medium text-cova-text">
          <span className="cova-mono text-cova-textMuted mr-1.5">{stage.id}</span>
          {stage.label}
        </p>
        <p className="text-[11px] text-cova-textMuted break-words mt-0.5 leading-relaxed">{stage.detail}</p>
      </div>
    </li>
  );
}

function PhaseResultList({ result }: { result: ProbePhaseResult }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold mb-1 flex items-center gap-2">
        {result.passed ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        )}
        <span className={result.passed ? 'text-emerald-400' : 'text-red-400'}>
          {result.phase} — {result.passed ? 'ALL STAGES PASSED' : 'FAILURE ISOLATED'}
        </span>
        {result.hasSkips && <span className="text-amber-400">(some stages skipped)</span>}
      </p>
      <ul className="mt-1">
        {result.stages.map((s, i) => (
          <StageRow key={`${s.id}-${i}`} stage={s} />
        ))}
      </ul>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-t border-cova-border/40 first:border-t-0">
      <span className="text-xs text-cova-textMuted shrink-0">{label}</span>
      <span className="text-xs cova-mono text-cova-text text-right break-all">{value}</span>
    </div>
  );
}

export function DiagnosticsSection() {
  const { addToast } = useUIStore();
  const build = getBuildInfo();
  const unlocked = isVaultUnlocked();

  const [swSummary, setSwSummary] = useState('checking…');
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>({
    credentials: true,
    notes: true,
    tasks: true,
    wallet: true,
    savings: true,
  });
  const [running, setRunning] = useState<1 | 2 | 3 | null>(null);
  const [results, setResults] = useState<Record<number, ProbePhaseResult | undefined>>({});
  const [log, setLog] = useState<ProbeStage[]>([]);
  const [verdict, setVerdict] = useState('');
  const [rows, setRows] = useState<StorageRow[]>([]);

  const refresh = useCallback(async () => {
    setLog(await readDiagLog());
    setVerdict(await getVerdict());
    setRows(await collectStorageReport());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void getServiceWorkerSummary().then(setSwSummary);
  }, []);

  const runPhase = async (phase: 1 | 2 | 3) => {
    setRunning(phase);
    try {
      let result: ProbePhaseResult;
      if (phase === 1) {
        result = await runPhase1SaveAndLogout(FEATURE_KEYS.filter((f) => features[f]));
      } else if (phase === 2) {
        result = await runPhase2VerifyAfterRestart();
      } else {
        result = await runPhase3VerifyAfterUnlock();
      }
      setResults((prev) => ({ ...prev, [phase]: result }));
      addToast(
        result.passed ? `${result.phase}: all stages passed` : `${result.phase}: FAILURE — see stage details`,
        result.passed ? 'success' : 'error',
      );
    } catch (err) {
      addToast(`Probe error: ${String(err)}`, 'error');
    } finally {
      setRunning(null);
      await refresh();
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all diagnostic probe data? Your vault data is NOT touched.')) return;
    await clearDiagData();
    setResults({});
    await refresh();
    addToast('Diagnostics data cleared (vault data untouched)', 'info');
  };

  const handleCopyLog = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      addToast('Diagnostics log copied to clipboard', 'success');
    } catch {
      addToast('Could not copy log', 'error');
    }
  };

  const staleSw = /STALE-CODE RISK/.test(swSummary);
  const verdictTone = verdict.startsWith('FAILURE ISOLATED')
    ? 'border-red-500/60'
    : verdict.startsWith('ALL STAGES PASSED')
      ? 'border-emerald-500/60'
      : '';

  return (
    <>
      {/* Build identity — proves which source the installed APK was built from */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-cova-textMuted" />
          <h2 className="text-sm font-semibold text-cova-text">Build Identity — verify the installed APK</h2>
        </div>
        <div className="p-5">
          <InfoRow label="App Version" value={build.version} />
          <InfoRow label="Release Tag" value={build.tag} />
          <InfoRow label="Build Number" value={build.buildNumber} />
          <InfoRow
            label="Git Commit"
            value={build.commitShort === 'unknown' ? build.commitSha : `${build.commitShort} (${build.commitSha})`}
          />
          <InfoRow label="Build Timestamp" value={build.buildTime} />
          <InfoRow label="Platform" value={isNative ? 'Android (native Capacitor)' : 'Web (localStorage)'} />
          <InfoRow label="Service Worker" value={swSummary} />
          {staleSw && (
            <p className="mt-3 text-xs text-amber-400 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              A service worker is active inside the app WebView and can serve CACHED OLD CODE after an APK update. If
              the identity above does not match the release you installed, clear the app&rsquo;s storage / reinstall
              before drawing any conclusion from a test.
            </p>
          )}
        </div>
      </div>

      {/* Verdict — exact failure point */}
      <div className={`card mb-4 overflow-hidden ${verdictTone}`}>
        <div className="px-5 py-4 border-b border-cova-border/50 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-cova-text">Verdict — exact failure point</h2>
        </div>
        <div className="p-5">
          <p className="text-xs cova-mono text-cova-text leading-relaxed break-words">
            {verdict || 'Loading…'}
          </p>
        </div>
      </div>

      {/* Phase 1 — Save + Logout (vault unlocked) */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-cova-textMuted" />
          <h2 className="text-sm font-semibold text-cova-text">Phase 1 — Save + Logout</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-cova-textMuted leading-relaxed">
            Writes the test value <span className="cova-mono text-cova-text">&quot;{PERSISTENCE_TEST}&quot;</span>{' '}
            through all three layers (direct Preferences → storage adapter → encrypted vaultStorage), seeds one real
            probe item per selected feature through the actual store actions, then performs the exact logout sequence
            (flush writes → flush native queue → clear vault key — no purge) and proves everything is still on disk.
          </p>
          <div className="flex flex-wrap gap-3">
            {FEATURE_KEYS.map((f) => (
              <label key={f} className="flex items-center gap-1.5 text-xs text-cova-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={features[f]}
                  onChange={(e) => setFeatures((prev) => ({ ...prev, [f]: e.target.checked }))}
                  className="accent-[var(--cova-accent)]"
                />
                {f}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => void runPhase(1)} disabled={running !== null || !unlocked}>
              {running === 1 ? 'Running…' : 'Run Phase 1 — Save + Logout'}
            </Button>
            {!unlocked && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Vault is locked — unlock first.
              </span>
            )}
          </div>
          {unlocked && (
            <p className="text-[11px] text-cova-textMuted">
              Note: Phase 1 ends logged-out (like the real logout). The app returns to the Lock screen — that is
              expected.
            </p>
          )}
          {results[1] && <PhaseResultList result={results[1]} />}
        </div>
      </div>

      {/* Phase 2 — after restart, BEFORE unlock */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-cova-textMuted" />
          <h2 className="text-sm font-semibold text-cova-text">Phase 2 — Verify after restart</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-cova-textMuted leading-relaxed">
            Run this AFTER completely closing the app (swipe away from Recents) and reopening it — ideally{' '}
            <span className="text-cova-text">before unlocking</span>. It reads native Android storage directly and
            verifies: raw test value, adapter value, encrypted blob, vault salt, master-password hash, all store blobs,
            and the startup cache hydration. Tip: use the &quot;Diagnostics&quot; link on the Lock screen.
          </p>
          <Button onClick={() => void runPhase(2)} disabled={running !== null}>
            {running === 2 ? 'Running…' : 'Run Phase 2 — Verify after restart'}
          </Button>
          {results[2] && <PhaseResultList result={results[2]} />}
        </div>
      </div>

      {/* Phase 3 — after unlock */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-cova-textMuted" />
          <h2 className="text-sm font-semibold text-cova-text">Phase 3 — Verify after unlock</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-cova-textMuted leading-relaxed">
            Run this AFTER unlocking the vault with your master password. It verifies decryption with the freshly
            derived key, that the seeded probe items reached the live Zustand stores (rehydration), that unlock did not
            overwrite any native data, and reports live store counts.
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={() => void runPhase(3)} disabled={running !== null || !unlocked}>
              {running === 3 ? 'Running…' : 'Run Phase 3 — Verify after unlock'}
            </Button>
            {!unlocked && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Vault is locked — unlock first.
              </span>
            )}
          </div>
          {results[3] && <PhaseResultList result={results[3]} />}
        </div>
      </div>

      {/* Native storage inspection */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-cova-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-cova-textMuted" />
            <h2 className="text-sm font-semibold text-cova-text">Native Storage Inspection</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={running !== null}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-cova-textMuted border-b border-cova-border">
                <th className="py-2 pr-3 font-semibold">Key</th>
                <th className="py-2 pr-3 font-semibold">On Disk</th>
                <th className="py-2 pr-3 font-semibold">Size</th>
                <th className="py-2 pr-3 font-semibold">Hash</th>
                <th className="py-2 font-semibold">Contents</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-cova-border/40 text-[11px] cova-mono">
                  <td className="py-2 pr-3 text-cova-text break-all">{row.key}</td>
                  <td className="py-2 pr-3">
                    {row.present ? (
                      <span className="text-emerald-400">present</span>
                    ) : (
                      <span className="text-red-400">missing</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-cova-textMuted">{row.present ? `${row.length} ch` : '—'}</td>
                  <td className="py-2 pr-3 text-cova-textMuted">{row.hashPrefix || '—'}</td>
                  <td className="py-2 text-cova-textMuted">
                    {row.decryptable === true && (
                      <span className="text-emerald-400">decrypted ✓ {row.items}</span>
                    )}
                    {row.decryptable === false && <span className="text-red-400">DECRYPT FAILED</span>}
                    {row.decryptable === null && (row.items || '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!unlocked && (
            <p className="mt-3 text-[11px] text-cova-textMuted">
              Unlock the vault to also decrypt store blobs and show item counts.
            </p>
          )}
        </div>
      </div>

      {/* Full probe log */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-cova-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cova-textMuted" />
            <h2 className="text-sm font-semibold text-cova-text">Probe Log ({log.length} stages, persisted)</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => void handleCopyLog()} disabled={log.length === 0}>
              <Copy className="w-3.5 h-3.5" /> Copy
            </Button>
            <Button variant="danger" size="sm" onClick={() => void handleClear()}>
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
          </div>
        </div>
        <div className="p-5">
          {log.length === 0 ? (
            <p className="text-xs text-cova-textMuted">No probe stages recorded yet.</p>
          ) : (
            <ul>
              {log.map((s, i) => (
                <StageRow key={`${s.id}-${s.ts}-${i}`} stage={s} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Standalone diagnostics page (route /diagnostics), reachable from the Lock
 * screen so Phase 2 can be run after a force-close but BEFORE unlocking.
 */
export function DiagnosticsPage() {
  return (
    <div className="min-h-screen flex flex-col cova-vault-bg text-cova-text">
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-cova-text">Persistence Diagnostics</h1>
            <p className="text-sm text-cova-textMuted mt-1">
              Isolate the exact failure point of the save → logout → restart → unlock lifecycle.
            </p>
          </div>
          <Link to="/lock" className="btn-secondary px-3 py-1.5 text-xs shrink-0">
            Back to Lock
          </Link>
        </div>
        <DiagnosticsSection />
      </main>
    </div>
  );
}
