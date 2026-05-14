import { useState } from 'react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import { executionApi } from '../../api/executions.api.js';
import { jobApi } from '../../api/jobs.api.js';
import { ReposTable } from './ReposTable.js';
import { JobsTable } from './JobsTable.js';
import { CliSettings } from './CliSettings.js';
import { JobPromptEditor } from './JobPromptEditor.js';
import { CronsManager } from './CronsManager.js';
import type { JobCreateInput, JobUpdateInput, Job } from '../../types/index.js';
import styles from './MissionControl.module.css';

interface EditingJob { job?: Job; }
interface MissionControlState { editingJob: EditingJob | null; }

export function MissionControl() {
  const { jobs, settings, repos, cliConfigs, crons, refreshAll, refreshCrons } = useAppState();
  const [state, setState] = useState<MissionControlState>({ editingJob: null });

  const cronOn = settings?.cron_enabled === true;

  async function handleCronToggle() {
    if (cronOn) await settingsApi.cronStop();
    else await settingsApi.cronStart();
    await refreshAll();
  }
  async function handleRun(jobId: number) {
    try { await executionApi.trigger(jobId); await refreshAll(); } catch { /* ignore */ }
  }
  async function handleToggle(jobId: number) {
    try { await jobApi.toggle(jobId); await refreshAll(); } catch { /* ignore */ }
  }
  async function handleDelete(jobId: number) {
    if (!confirm('Delete this job?')) return;
    try { await jobApi.remove(jobId); await refreshAll(); } catch { /* ignore */ }
  }
  async function handleJobSave(
    data: { name: string; repo_id: number; prompt: string; timeout_seconds: number },
    jobId?: number,
  ) {
    if (jobId) await jobApi.update(jobId, data as JobUpdateInput);
    else await jobApi.create(data as JobCreateInput);
    setState((s) => ({ ...s, editingJob: null }));
    await refreshAll();
  }

  function openAddJob() { setState((s) => ({ ...s, editingJob: {} })); }
  function closeJobEditor() { setState((s) => ({ ...s, editingJob: null })); }
  function openEditJob(job: Job) { setState((s) => ({ ...s, editingJob: { job } })); }
  async function handleEditorSave(data: Parameters<typeof handleJobSave>[0]) {
    await handleJobSave(data, state.editingJob?.job?.id);
  }

  return (
    <div className={styles.page}>

      <section className="section">
        <CronsManager
          crons={crons}
          jobs={jobs}
          cronEnabled={cronOn}
          onCronToggle={handleCronToggle}
          onChanged={refreshCrons}
        />
      </section>

      <section className="section">
        <ReposTable repos={repos} cliConfigs={cliConfigs} onReposChanged={refreshAll} />
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-title">Jobs</span>
          <button className="btn btn-sm btn-ghost" onClick={openAddJob}>+ Add</button>
        </div>
        <JobsTable
          jobs={jobs}
          repos={repos}
          cliConfigs={cliConfigs}
          crons={crons}
          onRun={handleRun}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onSave={handleJobSave}
          onJobsChanged={refreshAll}
          onEdit={openEditJob}
        />
      </section>

      {state.editingJob && (
        <JobPromptEditor
          job={state.editingJob.job}
          repos={repos}
          cliConfigs={cliConfigs}
          onSave={handleEditorSave}
          onCancel={closeJobEditor}
        />
      )}

      <section className="section">
        <CliSettings cliConfigs={cliConfigs} onChanged={refreshAll} />
      </section>

    </div>
  );
}
