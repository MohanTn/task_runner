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
import { useCronRunner } from '../../hooks/useCronRunner.js';
import type { JobCreateInput, JobUpdateInput, Job } from '../../types/index.js';
import type { FilterSchedule } from './JobsTable.js';
import styles from './MissionControl.module.css';

interface EditingJob { job?: Job; }
interface MissionControlState { editingJob: EditingJob | null; }

export function MissionControl() {
  const { jobs, settings, repos, cliConfigs, crons, refreshAll, refreshCrons } = useAppState();
  const [state, setState] = useState<MissionControlState>({ editingJob: null });
  const [filterScheduleId, setFilterScheduleId] = useState<FilterSchedule>('all');

  const cronOn = settings?.cron_enabled === true;
  const runningMap = useCronRunner({ crons, jobs, enabled: cronOn });

  async function handleCronToggle() {
    if (cronOn) await settingsApi.cronStop();
    else await settingsApi.cronStart();
    await refreshAll();
  }

  async function handleRun(jobId: number) {
    try { await executionApi.trigger(jobId); await refreshAll(); }
    catch (err) { console.error('[MissionControl] run failed:', err); }
  }

  async function handleToggle(jobId: number) {
    try { await jobApi.toggle(jobId); await refreshAll(); }
    catch (err) { console.error('[MissionControl] toggle failed:', err); }
  }

  async function handleDelete(jobId: number) {
    if (!confirm('Delete this job?')) return;
    try { await jobApi.remove(jobId); await refreshAll(); }
    catch (err) { console.error('[MissionControl] delete failed:', err); }
  }

  async function handleJobSave(
    data: { name: string; repo_id: number; prompt: string; timeout_seconds: number; cron_id: number | null },
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

  function handleFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === 'all' || val === 'none') setFilterScheduleId(val);
    else setFilterScheduleId(Number(val));
  }

  return (
    <div className={styles.page}>

      <section className="section">
        <CronsManager
          crons={crons}
          jobs={jobs}
          cronEnabled={cronOn}
          onCronToggle={handleCronToggle}
          onChanged={refreshAll}
        />
      </section>

      <section className="section">
        <ReposTable repos={repos} cliConfigs={cliConfigs} onReposChanged={refreshAll} />
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-title">Jobs</span>
          <select
            className={styles.filterSelect}
            value={String(filterScheduleId)}
            onChange={handleFilterChange}
            aria-label="Filter by schedule"
          >
            <option value="all">All Jobs</option>
            <option value="none">Unscheduled</option>
            {crons.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <button className="btn btn-sm btn-ghost" onClick={openAddJob}>+ Add</button>
        </div>
        <JobsTable
          jobs={jobs}
          crons={crons}
          runningMap={runningMap}
          filterScheduleId={filterScheduleId}
          onRun={handleRun}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onEdit={openEditJob}
          onChanged={refreshAll}
        />
      </section>

      {state.editingJob && (
        <JobPromptEditor
          job={state.editingJob.job}
          repos={repos}
          cliConfigs={cliConfigs}
          crons={crons}
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
