import { useState, useCallback, useEffect } from 'react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import { executionApi } from '../../api/executions.api.js';
import { jobApi } from '../../api/jobs.api.js';
import type { JobCreateInput, JobUpdateInput, RunMode } from '../../types/jobs.js';
import { CronInput } from '../Common/CronInput.js';
import { Slider } from '../Common/Slider.js';
import { ReposTable } from './ReposTable.js';
import { JobsTable } from './JobsTable.js';
import { QueueTable } from './QueueTable.js';
import { CliSettings } from './CliSettings.js';
import type { Execution } from '../../types/executions.js';
import styles from './Cockpit.module.css';

interface CockpitProps {
  onShowOutput: (exec: Execution) => void;
}

export function Cockpit({ onShowOutput }: CockpitProps) {
  const {
    jobs,
    executions,
    poolStats,
    settings,
    repos,
    cliConfigs,
    refreshAll,
  } = useAppState();

  const [savingSchedule, setSavingSchedule] = useState(false);

  const cronOn = settings?.cron_enabled === true;
  const [cronExpr, setCronExpr] = useState('*/5 * * * *');
  const [workers, setWorkers] = useState(2);

  useEffect(() => {
    if (settings) {
      setCronExpr(settings.cron_expression ?? '*/5 * * * *');
      setWorkers(settings.max_parallel_workers ?? 2);
    }
  }, [settings]);

  const handleCronToggle = useCallback(async () => {
    if (cronOn) {
      await settingsApi.cronStop();
    } else {
      await settingsApi.cronStart();
    }
    await refreshAll();
  }, [cronOn, refreshAll]);

  const handleScheduleSave = useCallback(async () => {
    setSavingSchedule(true);
    try {
      await settingsApi.update({
        cron_expression: cronExpr,
        max_parallel_workers: workers,
      });
      await refreshAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  }, [cronExpr, workers, refreshAll]);

  const handleRun = useCallback(async (jobId: number) => {
    try {
      await executionApi.trigger(jobId);
      await refreshAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to trigger job');
    }
  }, [refreshAll]);

  const handleToggle = useCallback(async (jobId: number) => {
    try {
      await jobApi.toggle(jobId);
      await refreshAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle job');
    }
  }, [refreshAll]);

  const handleDelete = useCallback(async (jobId: number) => {
    if (!confirm('Delete this job?')) return;
    try {
      await jobApi.remove(jobId);
      await refreshAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete job');
    }
  }, [refreshAll]);

  const handleJobSave = useCallback(async (data: {
    name: string;
    repo_id: number;
    prompt: string;
    timeout_seconds: number;
    run_mode: RunMode;
  }, jobId?: number) => {
    if (jobId) {
      await jobApi.update(jobId, data as JobUpdateInput);
    } else {
      await jobApi.create(data as JobCreateInput);
    }
    await refreshAll();
  }, [refreshAll]);

  return (
    <div className={styles.page}>
      {/* Schedule Settings */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Schedule Settings</h2>
        <div className={styles.scheduleGrid}>
          <div className={styles.scheduleField}>
            <label className={styles.fieldLabel}>Cron Expression</label>
            <CronInput value={cronExpr} onChange={setCronExpr} />
          </div>
          <div className={styles.scheduleField}>
            <label className={styles.fieldLabel}>Workers: {workers}</label>
            <Slider
              label=""
              value={workers}
              min={1}
              max={10}
              onChange={setWorkers}
            />
          </div>
          <div className={styles.scheduleActions}>
            <button
              className={`${styles.toggleBtn} ${cronOn ? styles.toggleOn : styles.toggleOff}`}
              onClick={handleCronToggle}
            >
              {cronOn ? 'Stop' : 'Start'}
            </button>
            <button className={styles.primaryBtn} onClick={handleScheduleSave} disabled={savingSchedule}>
              {savingSchedule ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        {poolStats && (
          <p className={styles.poolInfo}>
            {poolStats.active} active · {poolStats.pending} queued · max {poolStats.maxParallel}
          </p>
        )}
      </section>

      {/* Repos */}
      <section className={styles.section}>
        <ReposTable repos={repos} cliConfigs={cliConfigs} onReposChanged={refreshAll} />
      </section>

      {/* Jobs */}
      <section className={styles.section}>
        <JobsTable
          jobs={jobs}
          repos={repos}
          cliConfigs={cliConfigs}
          onRun={handleRun}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onSave={handleJobSave}
          onJobsChanged={refreshAll}
        />
      </section>

      {/* Queue */}
      <section className={styles.section}>
        <QueueTable executions={executions} onShowOutput={onShowOutput} />
      </section>

      {/* CLI Settings */}
      <section className={styles.section}>
        <CliSettings cliConfigs={cliConfigs} onChanged={refreshAll} />
      </section>
    </div>
  );
}
