import { useState, useCallback, useRef, useEffect } from 'react';
import { AppStateProvider, useAppState } from './state/AppState.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { executionApi } from './api/executions.api.js';
import type { Execution } from './types/executions.js';
import { Navigation, type Tab } from './components/Common/Navigation.js';
import { Cockpit } from './components/Cockpit/Cockpit.js';
import { JobList } from './components/Jobs/JobList.js';
import { ExecutionHistory } from './components/ExecutionHistory/ExecutionHistory.js';
import { SettingsPanel } from './components/Settings/SettingsPanel.js';
import styles from './App.module.css';

/* ─── Status Dot ─── */
function Dot({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: 'var(--accent)',
    completed: 'var(--success)',
    failed: 'var(--danger)',
    pending: 'var(--warning)',
    cancelled: 'var(--text-2)',
    enabled: 'var(--success)',
    disabled: 'var(--text-2)',
  };
  return <span className={styles.dot} style={{ background: map[status] || 'var(--text-2)' }} />;
}

/* ─── Execution Output Modal (live streaming + stdin) ─── */
function OutputModal({
  execution: initial,
  liveOutput,
  onClose,
  onStdin,
}: {
  execution: Execution;
  liveOutput?: { out: string; err: string };
  onClose: () => void;
  onStdin: (id: number, input: string) => void;
}) {
  const [fetchOut, setFetchOut] = useState('');
  const [fetchErr, setFetchErr] = useState('');
  const [loading, setLoading] = useState(!initial.output && !initial.error_output && !liveOutput);
  const [stdinText, setStdinText] = useState('');
  const [sentLines, setSentLines] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isRunning = initial.status === 'running';

  useEffect(() => {
    if (loading && !liveOutput) {
      executionApi.getOutput(initial.id)
        .then((d) => { setFetchOut(d.output); setFetchErr(d.error_output); })
        .catch(() => setFetchOut('(failed to load)'))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [liveOutput, fetchOut, sentLines]);

  const displayedOut = liveOutput?.out ?? fetchOut ?? initial.output ?? '';
  const displayedErr = liveOutput?.err ?? fetchErr ?? initial.error_output ?? '';

  const send = () => {
    const text = stdinText.trim();
    if (!text) return;
    onStdin(initial.id, text);
    setSentLines((p) => [...p, text]);
    setStdinText('');
  };

  const handleStdinKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const started = initial.started_at ? new Date(initial.started_at).toLocaleString() : '-';
  const took = initial.started_at && initial.completed_at
    ? `${Math.round((new Date(initial.completed_at).getTime() - new Date(initial.started_at).getTime()) / 1000)}s` : (isRunning ? 'running…' : '-');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.outputModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.outputHead}>
          <span>Execution #{initial.id} <Dot status={initial.status} />{initial.status}</span>
          <span className={styles.muted}>exit={initial.exit_code ?? '-'} pid={initial.worker_pid ?? '-'} {took} {started}</span>
          <button className={styles.btnGhost} onClick={onClose}>✕</button>
        </div>
        <div className={styles.outputBody}>
          {loading ? <p className={styles.muted}>loading…</p> : <>
            {displayedOut && <pre className={styles.stdout}>{displayedOut}</pre>}
            {displayedErr && <pre className={styles.stderr}>{displayedErr}</pre>}
            {!displayedOut && !displayedErr && !isRunning && <p className={styles.muted}>(no output)</p>}
            {sentLines.map((l, i) => (
              <pre key={i} className={styles.stdinLine}>&gt; {l}</pre>
            ))}
          </>}
          <div ref={bottomRef} />
        </div>
        {isRunning && (
          <div className={styles.stdinBar}>
            <input
              className={styles.stdinInput}
              value={stdinText}
              onChange={(e) => setStdinText(e.target.value)}
              onKeyDown={handleStdinKey}
              placeholder="type input for the running process…"
              autoFocus
            />
            <button className={styles.btnPrimary} onClick={send} disabled={!stdinText.trim()}>send</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main App Content ─── */
function AppContent() {
  const { settings, refreshAll, applyExecutionUpdate, applyPoolStats } = useAppState();
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('cockpit');

  /* live output streaming state */
  const [liveOutputs, setLiveOutputs] = useState<Record<number, { out: string; err: string }>>({});
  const [outputExec, setOutputExec] = useState<Execution | null>(null);

  const cronOn = settings?.cron_enabled === true;

  /* WS message handler for live streaming + state sync */
  const onWsMessage = useCallback((data: Record<string, unknown>) => {
    switch (data.type) {
      case 'execution-output': {
        const id = data.executionId as number;
        const stream = data.stream as string;
        const chunk = data.chunk as string;
        setLiveOutputs((prev) => {
          const cur = prev[id] || { out: '', err: '' };
          return { ...prev, [id]: { ...cur, [stream === 'stdout' ? 'out' : 'err']: cur[stream === 'stdout' ? 'out' : 'err'] + chunk } };
        });
        break;
      }
      case 'execution-completed':
      case 'execution-failed':
      case 'execution-cancelled': {
        const exec = data.execution as Execution | undefined;
        if (exec) applyExecutionUpdate(exec);
        break;
      }
      case 'execution-started': {
        break;
      }
      case 'worker-pool-stats': {
        const { active, pending, maxParallel } = data as any;
        applyPoolStats({ active, pending, maxParallel });
        break;
      }
    }
  }, [applyExecutionUpdate, applyPoolStats]);

  useWebSocket({
    onMessage: onWsMessage,
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false),
  });

  const handleStdin = async (execId: number, input: string) => {
    try { await executionApi.sendStdin(execId, input); } catch { /* ignore */ }
  };

  return (
    <div className={styles.app}>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} connected={wsConnected} />

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'cockpit' && <Cockpit onShowOutput={setOutputExec} />}
        {activeTab === 'jobs' && <JobList />}
        {activeTab === 'history' && <ExecutionHistory />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>

      {/* ─── OUTPUT MODAL ─── */}
      {outputExec && (
        <OutputModal
          execution={outputExec}
          liveOutput={liveOutputs[outputExec.id]}
          onClose={() => setOutputExec(null)}
          onStdin={handleStdin}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
