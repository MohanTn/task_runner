import { useState, useCallback, useEffect } from 'react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import { executionApi } from '../../api/executions.api.js';
import { jobApi } from '../../api/jobs.api.js';
import { CronInput } from '../Common/CronInput.js';
import { Slider } from '../Common/Slider.js';
import { StatusBadge } from '../Common/StatusBadge.js';
import { ConfirmDialog } from '../Common/ConfirmDialog.js';
import { ReposTable } from './ReposTable.js';
import { JobsTable } from './JobsTable.js';
import { CliSettings } from './CliSettings.js';
import { JobPromptEditor } from './JobPromptEditor.js';
import type { Execution, JobCreateInput, JobUpdateInput, Job } from '../../types/index.js';
import styles from './MissionControl.module.css';

interface MissionControlProps {
  onShowOutput: (exec: Execution) => void;
  liveOutputs: Record<number, { out: string; err: string }>;
}

export function MissionControl({ onShowOutput, liveOutputs }: MissionControlProps) {
  const {
    jobs, executions, executionStats, poolStats, settings, repos, cliConfigs, refreshAll,
  } = useAppState();

  /* ── Schedule controls ── */
  const [cronExpr, setCronExpr] = useState('*/5 * * * *');
  const [workers, setWorkers] = useState(2);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [editingJob, setEditingJob] = useState<{ job?: Job } | null>(null);
  const [showPrune, setShowPrune] = useState(false);
  const [filterJobId, setFilterJobId] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState('');

  const cronOn = settings?.cron_enabled === true;

  useEffect(() => {
    if (settings) {
      setCronExpr(settings.cron_expression ?? '*/5 * * * *');
      setWorkers(settings.max_parallel_workers ?? 2);
    }
  }, [settings]);

  /* handlers */
  const handleCronToggle = useCallback(async () => {
    if (cronOn) { await settingsApi.cronStop(); }
    else { await settingsApi.cronStart(); }
    await refreshAll();
  }, [cronOn, refreshAll]);

  const handleScheduleSave = useCallback(async () => {
    setSavingSchedule(true);
    try {
      await settingsApi.update({ cron_expression: cronExpr, max_parallel_workers: workers });
      await refreshAll();
    } catch { /* ignore */ } finally { setSavingSchedule(false); }
  }, [cronExpr, workers, refreshAll]);

  const handleRun = useCallback(async (jobId: number) => {
    try { await executionApi.trigger(jobId); await refreshAll(); } catch { /* ignore */ }
  }, [refreshAll]);

  const handleCancel = useCallback(async (execId: number) => {
    try { await executionApi.cancel(execId); await refreshAll(); } catch { /* ignore */ }
  }, [refreshAll]);

  const handleToggle = useCallback(async (jobId: number) => {
    try { await jobApi.toggle(jobId); await refreshAll(); } catch { /* ignore */ }
  }, [refreshAll]);

  const handleDelete = useCallback(async (jobId: number) => {
    if (!confirm('Delete this job?')) return;
    try { await jobApi.remove(jobId); await refreshAll(); } catch { /* ignore */ }
  }, [refreshAll]);

  const handleJobSave = useCallback(async (data: { name: string; repo_id: number; prompt: string; timeout_seconds: number }, jobId?: number) => {
    if (jobId) { await jobApi.update(jobId, data as JobUpdateInput); }
    else { await jobApi.create(data as JobCreateInput); }
    setEditingJob(null);
    await refreshAll();
  }, [refreshAll]);

  const handlePrune = useCallback(async () => {
    await executionApi.prune(30);
    setShowPrune(false);
    await refreshAll();
  }, [refreshAll]);

  const openEditor = useCallback(() => setEditingJob({}), []);
  const openEditJob = useCallback((job: Job) => setEditingJob({ job }), []);
  const closeEditor = useCallback(() => setEditingJob(null), []);
  const openPrune = useCallback(() => setShowPrune(true), []);
  const closePrune = useCallback(() => setShowPrune(false), []);

  const handleFilterJobChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterJobId(e.target.value ? Number(e.target.value) : '');
  }, []);

  const handleFilterStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
  }, []);

  /* ── Filtered executions ── */
  const filteredExecs = executions.filter((e) => {
    if (filterJobId && e.job_id !== filterJobId) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    return true;
  }).slice(0, 25);

  const runningCount = executions.filter((e) => e.status === 'running').length;
  const pendingCount = executions.filter((e) => e.status === 'pending').length;
  const activeJobs = jobs.filter((j) => j.enabled).length;

  return (
    <div className={styles.page}>
      {/* Stats bar */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statVal}>{jobs.length}</span>
          <span className={styles.statLbl}>jobs</span>
          <span className={styles.statSub}>{activeJobs} enabled</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statVal}>{runningCount}</span>
          <span className={styles.statLbl}>running</span>
          <span className={styles.statSub}>{pendingCount} pending</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statVal}>{executionStats?.completed ?? '-'}</span>
          <span className={styles.statLbl}>completed</span>
          <span className={styles.statSub}>all time</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statVal}>{executionStats?.failed ?? '-'}</span>
          <span className={styles.statLbl}>failed</span>
          <span className={styles.statSub}>all time</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statVal}>{poolStats?.active ?? 0}</span>
          <span className={styles.statLbl}>workers</span>
          <span className={styles.statSub}>{poolStats?.pending ?? 0} queued</span>
        </div>
      </div>

      {/* Controls bar */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <button className={cronOn ? styles.btnOn : styles.btnOff} onClick={handleCronToggle}>
            {cronOn ? 'cron on' : 'cron off'}
          </button>
          <CronInput value={cronExpr} onChange={setCronExpr} />
          <span className={styles.controlLabel}>workers:</span>
          <Slider label="" value={workers} min={1} max={10} onChange={setWorkers} />
        </div>
        <div className={styles.spacer} />
        <button className={styles.btnPrimary} onClick={handleScheduleSave} disabled={savingSchedule}>
          {savingSchedule ? 'saving…' : 'apply'}
        </button>
      </div>

      {/* Repos */}
      <section className={styles.section}>
        <ReposTable repos={repos} cliConfigs={cliConfigs} onReposChanged={refreshAll} />
      </section>

      {/* Jobs */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Jobs</span>
          <button className={styles.linkBtn} onClick={openEditor}>+ Add</button>
        </div>
        <JobsTable
          jobs={jobs} repos={repos} cliConfigs={cliConfigs}
          onRun={handleRun} onToggle={handleToggle} onDelete={handleDelete}
          onSave={handleJobSave} onJobsChanged={refreshAll} onEdit={openEditJob}
        />
      </section>

      {editingJob && (
        <JobPromptEditor
          job={editingJob.job} repos={repos} cliConfigs={cliConfigs}
          onSave={async (data) => { await handleJobSave(data, editingJob.job?.id); }}
          onCancel={closeEditor}
        />
      )}

      {/* Executions */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Executions</span>
          <span className={styles.spacer} />
          <select className={styles.filterSelect} value={filterJobId} onChange={handleFilterJobChange}>
            <option value="">all jobs</option>
            {jobs.map((j) => (<option key={j.id} value={j.id}>{j.name}</option>))}
          </select>
          <select className={styles.filterSelect} value={filterStatus} onChange={handleFilterStatusChange}>
            <option value="">all status</option>
            <option value="pending">pending</option>
            <option value="running">running</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button className={styles.linkBtnDanger} onClick={openPrune}>prune</button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>time</th>
              <th>job</th>
              <th>status</th>
              <th>exit</th>
              <th>trigger</th>
              <th>output</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredExecs.map((exec) => (
              <tr key={exec.id}>
                <td className={styles.cellMono}>{exec.created_at ? new Date(exec.created_at).toLocaleTimeString() : '-'}</td>
                <td className={styles.cellName}>Job #{exec.job_id}</td>
                <td><StatusBadge status={exec.status} /></td>
                <td className={styles.cellMono}>{exec.exit_code ?? '-'}</td>
                <td className={styles.cellMuted}>{exec.triggered_by}</td>
                <td>
                  <button className={styles.linkBtn} onClick={() => onShowOutput(exec)}>view</button>
                </td>
                <td>
                  {(exec.status === 'pending' || exec.status === 'running') && (
                    <button className={styles.linkBtnDanger} onClick={() => handleCancel(exec.id)}>terminate</button>
                  )}
                </td>
              </tr>
            ))}
            {filteredExecs.length === 0 && (
              <tr><td className={styles.emptyCell} colSpan={7}>no executions</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* CLI Settings */}
      <section className={styles.section}>
        <CliSettings cliConfigs={cliConfigs} onChanged={refreshAll} />
      </section>

      {showPrune && (
        <ConfirmDialog
          title="Prune Old Executions"
          message="Delete execution records older than 30 days?"
          confirmLabel="Prune" danger
          onConfirm={handlePrune} onCancel={closePrune}
        />
      )}
    </div>
  );
}
