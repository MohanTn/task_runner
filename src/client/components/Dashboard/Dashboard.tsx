import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import { executionApi } from '../../api/executions.api.js';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { jobs, settings, refreshAll } = useAppState();

  const activeJobs = jobs.filter((j) => j.enabled).length;
  const singleRunJobs = jobs.filter((j) => j.run_mode === 'single').length;

  const handleCronToggle = async () => {
    if (settings?.cron_enabled) {
      await settingsApi.cronStop();
    } else {
      await settingsApi.cronStart();
    }
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
          <span className={styles.statSub}>{activeJobs} active · {singleRunJobs} single-run</span>
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
        </div>
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
                <span className={`${styles.quickBadge} ${job.run_mode === 'single' ? styles.quickBadgeCron : styles.quickBadgeManual}`}>
                  {job.run_mode === 'single' ? '1 Single' : '∞ Multiple'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
