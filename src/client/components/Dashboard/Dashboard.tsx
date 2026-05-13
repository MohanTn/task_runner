import { useAppState } from '../../state/AppState.js';
import { Slider } from '../Common/Slider.js';
import { StatusBadge } from '../Common/StatusBadge.js';
import { settingsApi } from '../../api/settings.api.js';
import { executionApi } from '../../api/executions.api.js';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { jobs, executions, executionStats, poolStats, settings, refreshAll } = useAppState();

  const runningExecs = executions.filter((e) => e.status === 'running');
  const pendingExecs = executions.filter((e) => e.status === 'pending');

  const activeJobs = jobs.filter((j) => j.enabled).length;
  const failedToday = executionStats?.failed ?? 0;
  const completedToday = executionStats?.completed ?? 0;

  const handleCronToggle = async () => {
    if (settings?.cron_enabled) {
      await settingsApi.cronStop();
    } else {
      await settingsApi.cronStart();
    }
    await refreshAll();
  };

  const handleParallelChange = async (value: number) => {
    await settingsApi.update({ max_parallel_workers: value });
    await refreshAll();
  };

  const handleManualTrigger = async (jobId: number) => {
    await executionApi.trigger(jobId);
    await refreshAll();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <button className={styles.refreshBtn} onClick={refreshAll}>
          Refresh
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{jobs.length}</span>
          <span className={styles.statLabel}>Total Jobs</span>
          <span className={styles.statSub}>{activeJobs} active</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{runningExecs.length}</span>
          <span className={styles.statLabel}>Running</span>
          <span className={styles.statSub}>{pendingExecs.length} pending</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{completedToday}</span>
          <span className={styles.statLabel}>Completed</span>
          <span className={styles.statSub}>all time</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{failedToday}</span>
          <span className={styles.statLabel}>Failed</span>
          <span className={styles.statSub}>all time</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlCard}>
          <div className={styles.controlHeader}>
            <h3>Cron Scheduler</h3>
            <button
              className={`${styles.toggleBtn} ${settings?.cron_enabled ? styles.on : styles.off}`}
              onClick={handleCronToggle}
            >
              {settings?.cron_enabled ? 'Running' : 'Stopped'}
            </button>
          </div>
          <p className={styles.controlDesc}>
            {poolStats?.active ?? 0} active workers · {poolStats?.pending ?? 0} queued
          </p>
        </div>

        <div className={styles.controlCard}>
          <Slider
            label="Parallel Workers"
            value={settings?.max_parallel_workers ?? 2}
            min={1}
            max={10}
            onChange={handleParallelChange}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Running Jobs</h2>
        {runningExecs.length === 0 ? (
          <p className={styles.empty}>No jobs currently running</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Job</span>
              <span>Status</span>
              <span>Started</span>
              <span>Trigger</span>
              <span>Actions</span>
            </div>
            {runningExecs.map((exec) => {
              const job = jobs.find((j) => j.id === exec.job_id);
              return (
                <div key={exec.id} className={styles.tableRow}>
                  <span className={styles.jobName}>{job?.name ?? `Job #${exec.job_id}`}</span>
                  <span><StatusBadge status={exec.status} /></span>
                  <span className={styles.muted}>{exec.started_at ? new Date(exec.started_at).toLocaleTimeString() : '-'}</span>
                  <span className={styles.muted}>{exec.triggered_by}</span>
                  <span>
                    <button
                      className={styles.actionBtn}
                      onClick={() => executionApi.cancel(exec.id)}
                    >
                      Cancel
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Trigger</h2>
        {jobs.length === 0 ? (
          <p className={styles.empty}>No jobs configured. Add one in the Jobs tab.</p>
        ) : (
          <div className={styles.quickGrid}>
            {jobs.map((job) => (
              <button
                key={job.id}
                className={styles.quickBtn}
                onClick={() => handleManualTrigger(job.id)}
              >
                <strong>{job.name}</strong>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
