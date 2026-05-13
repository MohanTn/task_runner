import { useState, useCallback, useEffect } from 'react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import { executionApi } from '../../api/executions.api.js';
import { jobApi } from '../../api/jobs.api.js';
import { CronInput } from '../Common/CronInput.js';
import { ReposTable } from './ReposTable.js';
import { JobsTable } from './JobsTable.js';
import { CliSettings } from './CliSettings.js';
import { JobPromptEditor } from './JobPromptEditor.js';
import type { JobCreateInput, JobUpdateInput, Job } from '../../types/index.js';
import styles from './MissionControl.module.css';

export function MissionControl() {
  const {
    jobs, settings, repos, cliConfigs, refreshAll,
  } = useAppState();

  const [cronExpr, setCronExpr] = useState('*/5 * * * *');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [editingJob, setEditingJob] = useState<{ job?: Job } | null>(null);

  const cronOn = settings?.cron_enabled === true;

  useEffect(() => {
    if (settings) {
      setCronExpr(settings.cron_expression ?? '*/5 * * * *');
    }
  }, [settings]);

  const handleCronToggle = useCallback(async () => {
    if (cronOn) { await settingsApi.cronStop(); }
    else { await settingsApi.cronStart(); }
    await refreshAll();
  }, [cronOn, refreshAll]);

  const handleScheduleSave = useCallback(async () => {
    setSavingSchedule(true);
    try {
      await settingsApi.update({ cron_expression: cronExpr });
      await refreshAll();
    } catch { /* ignore */ } finally { setSavingSchedule(false); }
  }, [cronExpr, refreshAll]);

  const handleRun = useCallback(async (jobId: number) => {
    try { await executionApi.trigger(jobId); await refreshAll(); } catch { /* ignore */ }
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
      </div>

      {/* Controls bar */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <button className={cronOn ? styles.btnOn : styles.btnOff} onClick={handleCronToggle}>
            {cronOn ? 'cron on' : 'cron off'}
          </button>
          <CronInput value={cronExpr} onChange={setCronExpr} />
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
          <button className={styles.linkBtn} onClick={() => setEditingJob({})}>+ Add</button>
        </div>
        <JobsTable
          jobs={jobs} repos={repos} cliConfigs={cliConfigs}
          onRun={handleRun} onToggle={handleToggle} onDelete={handleDelete}
          onSave={handleJobSave} onJobsChanged={refreshAll} onEdit={(job) => setEditingJob({ job })}
        />
      </section>

      {editingJob && (
        <JobPromptEditor
          job={editingJob.job} repos={repos} cliConfigs={cliConfigs}
          onSave={async (data) => { await handleJobSave(data, editingJob.job?.id); }}
          onCancel={() => setEditingJob(null)}
        />
      )}

      {/* CLI Settings */}
      <section className={styles.section}>
        <CliSettings cliConfigs={cliConfigs} onChanged={refreshAll} />
      </section>
    </div>
  );
}
