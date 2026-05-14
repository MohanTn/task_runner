import { useCallback } from 'react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import { executionApi } from '../../api/executions.api.js';
import { jobApi } from '../../api/jobs.api.js';
import type { JobCreateInput, JobUpdateInput, RunMode } from '../../types/jobs.js';
import { ReposTable } from './ReposTable.js';
import { JobsTable } from './JobsTable.js';
import { CliSettings } from './CliSettings.js';
import styles from './Cockpit.module.css';

export function Cockpit() {
  const {
    jobs,
    settings,
    repos,
    cliConfigs,
    refreshAll,
  } = useAppState();

  const cronOn = settings?.cron_enabled === true;

  const handleCronToggle = useCallback(async () => {
    if (cronOn) {
      await settingsApi.cronStop();
    } else {
      await settingsApi.cronStart();
    }
    await refreshAll();
  }, [cronOn, refreshAll]);

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
        <div className={styles.scheduleActions}>
          <button
            className={`${styles.toggleBtn} ${cronOn ? styles.toggleOn : styles.toggleOff}`}
            onClick={handleCronToggle}
          >
            {cronOn ? 'Stop Scheduler' : 'Start Scheduler'}
          </button>
        </div>
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

      {/* CLI Settings */}
      <section className={styles.section}>
        <CliSettings cliConfigs={cliConfigs} onChanged={refreshAll} />
      </section>
    </div>
  );
}
