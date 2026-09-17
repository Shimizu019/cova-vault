/**
 * Per-module persistence diagnostics UI.
 *
 * Drives the three-phase, per-module probe defined in
 * `@lib/diagnostics/modulePersistenceReport` and renders the
 * Write / Read / Decrypt / Rehydrate / Display matrix for each module:
 *
 *   Auth, Credentials, Notes, Tasks, PeraLog, Savings, Folders, Favorites,
 *   Calendar/Schedule
 *
 * Every stage is reported as pass / fail / skip, and each module gets a verdict
 * that distinguishes the three failure classes the user asked for:
 *   - "data was never saved"           → never-saved / lost-at-rest
 *   - "saved but not rehydrated"       → not-rehydrated / decrypt-failed
 *   - "rehydrated but UI shows nothing"→ not-displayed
 *
 * No secrets are ever rendered: only counts, key names, byte sizes and hashes.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, CircleSlash, Download, Lock, XCircle } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useUIStore } from '@store';
import { getBuildInfo } from '@lib/buildInfo';
import { isVaultUnlocked } from '@lib/crypto/vaultStorage';
import { getHydrationDiagnostics, type HydrationDiagnostic } from '@lib/crypto/encryptedStorage';
import { getDerivedCounts } from '@lib/storage/vaultPersistence';
import {
  MODULE_LABELS,
  MODULE_ORDER,
  MODULE_STORE_KEYS,
  runPhaseA,
  runPhaseB,
  runPhaseC,
  readModuleSnapshot,
  summarizeReports,
  type ModuleReport,
  type ModuleSnapshot,
  type ModuleStage,
  type ModuleVerdict,
  type PhaseAResult,
  type PhaseBResult,
  type StageStatus,
} from '@lib/diagnostics/modulePersistenceReport';

/** Copy shown next to each verdict so the failure class is unambiguous. */
const VERDICT_TEXT: Record<ModuleVerdict, string> = {
  ok: 'Saved, survived restart, decrypted, rehydrated, displayed.',
  'never-saved': 'DATA WAS NEVER SAVED — the store never wrote to native storage.',
  'lost-at-rest': 'DATA LOST AT REST — it was on disk after saving but is gone after the restart.',
  'decrypt-failed': 'DECRYPTION FAILED — bytes are on disk but the unlock key cannot read them.',
  'not-rehydrated': 'SAVED BUT NOT REHYDRATED — data exists in native storage yet never reached the live store.',
  'not-displayed': 'REHYDRATED BUT NOT DISPLAYED — the store holds the data but the UI count is zero.',
  locked: 'Vault is locked — unlock and re-run Phase C.',
};

const VERDICT_TONE: Record<ModuleVerdict, string> = {
  ok: 'text-emerald-400',
  'never-saved': 'text-red-400',
  'lost-at-rest': 'text-red-400',
  'decrypt-failed': 'text-red-400',
  'not-rehydrated': 'text-amber-400',
  'not-displayed': 'text-amber-400',
  locked: 'text-cova-textMuted',
};

function StageMark({ status }: { status: StageStatus }) {
  if (status === 'pass') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-label="pass" />;
  if (status === 'fail') return <XCircle className="w-3.5 h-3.5 text-red-400" aria-label="fail" />;
  return <CircleSlash className="w-3.5 h-3.5 text-cova-textMuted/60" aria-label="skipped" />;
}

function StageCell({ stage }: { stage: ModuleStage }) {
  return (
    <td className="py-2 px-1 text-center align-middle" title={`${stage.name}: ${stage.detail}`}>
      <div className="flex flex-col items-center gap-0.5">
        <StageMark status={stage.status} />
        <span className="text-[9px] cova-mono uppercase text-cova-textMuted">{stage.name}</span>
      </div>
    </td>
  );
}

function ModuleReportTable({ reports }: { reports: ModuleReport[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-cova-textMuted text-left">
            <th className="py-2 pr-3 font-medium">Module</th>
            <th className="py-2 px-1 font-medium text-center">Write</th>
            <th className="py-2 px-1 font-medium text-center">Read</th>
            <th className="py-2 px-1 font-medium text-center">Decrypt</th>
            <th className="py-2 px-1 font-medium text-center">Rehydrate</th>
            <th className="py-2 px-1 font-medium text-center">Display</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.key} className="border-t border-cova-border/50">
              <td className="py-2 pr-3 align-top">
                <p className="font-medium text-cova-text">{report.label}</p>
                <p className="cova-mono text-[10px] text-cova-textMuted break-all mt-0.5">
                  {report.storeKeys.join(', ')}
                </p>
                <p className={`text-[10px] mt-1 leading-relaxed ${VERDICT_TONE[report.verdict]}`}>
                  {VERDICT_TEXT[report.verdict]}
                </p>
                <p className="text-[10px] text-cova-textMuted mt-0.5 break-words">{report.verdictDetail}</p>
              </td>
              {report.stages.map((stage) => (
                <StageCell key={stage.name} stage={stage} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ModulePersistenceSection() {
  const { addToast } = useUIStore();
  const build = getBuildInfo();
  const unlocked = isVaultUnlocked();

  const [running, setRunning] = useState<'A' | 'B' | 'C' | null>(null);
  const [phaseA, setPhaseA] = useState<PhaseAResult | null>(null);
  const [phaseB, setPhaseB] = useState<PhaseBResult | null>(null);
  const [reports, setReports] = useState<ModuleReport[]>([]);
  const [summary, setSummary] = useState('');
  const [snapshot, setSnapshot] = useState<ModuleSnapshot | null>(null);
  const [hydration, setHydration] = useState<HydrationDiagnostic[]>([]);
  const [derived, setDerived] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    setSnapshot(await readModuleSnapshot());
    setHydration(getHydrationDiagnostics());
    setDerived(getDerivedCounts());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runA = async () => {
    setRunning('A');
    try {
      const result = await runPhaseA();
      setPhaseA(result);
      setReports([]);
      setSummary('');
      addToast(
        result.errors.length === 0
          ? `Phase A: seeded ${result.created.length} test items and logged out`
          : `Phase A: ${result.errors.length} module(s) failed to seed — see details`,
        result.errors.length === 0 ? 'success' : 'error',
      );
    } catch (err) {
      addToast(`Phase A error: ${String(err)}`, 'error');
    } finally {
      setRunning(null);
      await refresh();
    }
  };

  const runB = async () => {
    setRunning('B');
    try {
      const result = await runPhaseB();
      setPhaseB(result);
      addToast(
        result.allIntact
          ? 'Phase B: every store blob survived the restart intact'
          : 'Phase B: native storage CHANGED after the restart — see rows',
        result.allIntact ? 'success' : 'error',
      );
    } catch (err) {
      addToast(`Phase B error: ${String(err)}`, 'error');
    } finally {
      setRunning(null);
      await refresh();
    }
  };

  const runC = async () => {
    setRunning('C');
    try {
      const result = await runPhaseC();
      setReports(result);
      setSummary(summarizeReports(result));
      const failed = result.filter((r) => r.verdict !== 'ok');
      addToast(
        failed.length === 0
          ? 'Phase C: all modules passed Write → Read → Decrypt → Rehydrate → Display'
          : `Phase C: ${failed.length} module(s) failed — see verdicts`,
        failed.length === 0 ? 'success' : 'error',
      );
    } catch (err) {
      addToast(`Phase C error: ${String(err)}`, 'error');
    } finally {
      setRunning(null);
      await refresh();
    }
  };

  const handleCopySummary = async () => {
    const payload = {
      build: `${build.tag} #${build.commitShort}`,
      summary,
      phaseA,
      phaseB,
      reports,
      hydration,
      derived,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      addToast('Module report copied to clipboard (no secrets included)', 'success');
    } catch {
      addToast('Could not copy module report', 'error');
    }
  };

  const zeroModules = reports.filter((r) => r.verdict !== 'ok');

  return (
    <>
      {/* Phase A — seed one item per module, then logout */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-cova-textMuted" />
          <h2 className="text-sm font-semibold text-cova-text">
            Phase A — Create 1 test item per module + Logout
          </h2>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-cova-textMuted leading-relaxed">
            Creates exactly one tagged test item in every module through the real store actions —
            Credentials, Notes, Tasks (+scheduled task for Calendar), PeraLog starting balance +
            record, Savings goal, Folders, Favorites — then flushes every write to native storage,
            records present/size/hash for each store key, and performs the real logout (flush →
            clear in-memory key → re-arm persistence gates). Nothing is purged.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void runA()} disabled={running !== null || !unlocked}>
              {running === 'A' ? 'Running…' : 'Run Phase A — Seed + Logout'}
            </Button>
            {!unlocked && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Vault is locked — unlock first.
              </span>
            )}
          </div>

          {phaseA && (
            <div className="mt-2 space-y-2">
              <p className="text-xs cova-mono text-cova-text">
                marker token: {phaseA.token} · items created: {phaseA.created.length}
              </p>
              {phaseA.errors.length > 0 && (
                <ul className="text-[11px] text-red-400 space-y-0.5">
                  {phaseA.errors.map((e, i) => (
                    <li key={i}> {e}</li>
                  ))}
                </ul>
              )}
              {phaseA.missingKeys.length > 0 ? (
                <p className="text-[11px] text-red-400">
                   store keys NOT written to native storage: {phaseA.missingKeys.join(', ')}
                </p>
              ) : (
                <p className="text-[11px] text-emerald-400">✓ all five main store keys present in native storage</p>
              )}
              {phaseA.zeroCountModules.length > 0 && (
                <p className="text-[11px] text-amber-400">
                  ⚠ modules with zero live items after seeding: {phaseA.zeroCountModules.join(', ')}
                </p>
              )}
              <div className="text-[11px] text-cova-textMuted space-y-0.5">
                {MODULE_ORDER.map((m) => (
                  <p key={m} className="cova-mono">
                    {MODULE_LABELS[m]}: live {phaseA.liveCounts[m] ?? 0} · tagged{' '}
                    {phaseA.tokenHits[m] ?? 0}
                  </p>
                ))}
              </div>
            </div>
          )}

          {unlocked && phaseA && (
            <p className="text-[11px] text-amber-400">
              Phase A ends logged-out (this mirrors the real logout). Now COMPLETELY close the app
              (swipe it away from Recents), reopen it, and run Phase B BEFORE unlocking.
            </p>
          )}
        </div>
      </div>

      {/* Phase B — after restart, raw native metadata only, still locked */}
      <div className="card mb-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-cova-border flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-cova-textMuted" />
          <h2 className="text-sm font-semibold text-cova-text">
            Phase B — After restart, BEFORE unlock (raw native metadata only)
          </h2>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-cova-textMuted leading-relaxed">
            Reads <span className="cova-mono text-cova-text">Capacitor Preferences</span> only — no
            decryption and no store access — so a locked-vault rehydration problem cannot hide
            whether the bytes survived. Compares present / size / hash against the Phase A snapshot.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void runB()} disabled={running !== null}>
              {running === 'B' ? 'Running…' : 'Run Phase B — Verify at rest'}
            </Button>
            {!snapshot && (
              <span className="text-xs text-amber-400">
                No Phase A snapshot found — run Phase A first.
              </span>
            )}
            {unlocked && snapshot && (
              <span className="text-xs text-cova-textMuted">
                (Vault is unlocked — for a true at-rest check, run this right after reopening.)
              </span>
            )}
          </div>

          {snapshot && !phaseB && (
            <p className="text-[11px] cova-textMuted text-cova-textMuted cova-mono">
              snapshot from {snapshot.ts} · build {snapshot.build} · platform{' '}
              {snapshot.native ? 'native' : 'web'} · token {snapshot.token}
            </p>
          )}

          {phaseB && (
            <div className="space-y-2">
              <p className={`text-xs font-semibold ${phaseB.allIntact ? 'text-emerald-400' : 'text-red-400'}`}>
                {phaseB.allIntact
                  ? 'ALL STORE BLOBS INTACT — every byte that Phase A wrote is still on disk.'
                  : `${phaseB.missing.length} missing · ${phaseB.changed.length} changed after restart`}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-cova-textMuted text-left">
                      <th className="py-1.5 pr-3 font-medium">Key</th>
                      <th className="py-1.5 pr-3 font-medium">Change</th>
                      <th className="py-1.5 pr-3 font-medium">Size</th>
                      <th className="py-1.5 font-medium">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phaseB.rows.map((row) => (
                      <tr key={row.key} className="border-t border-cova-border/50">
                        <td className="py-1.5 pr-3 cova-mono text-cova-text break-all">{row.key}</td>
                        <td
                          className={`py-1.5 pr-3 ${
                            row.change === 'intact' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {row.change}
                        </td>
                        <td className="py-1.5 pr-3 cova-textMuted text-cova-textMuted">
                          {row.sizeBefore} → {row.sizeAfter}
                        </td>
                        <td className="py-1.5 cova-mono text-[10px] text-cova-textMuted">
                          {row.hashBefore || '—'} → {row.hashAfter || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={`text-[11px] ${phaseB.authIntact ? 'text-emerald-400' : 'text-red-400'}`}>
                auth hash present while locked: {phaseB.authIntact ? 'yes ✓' : 'no ✗'}
              </p>
              <p className="text-[11px] text-amber-400">
                Now unlock the vault and run Phase C.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}