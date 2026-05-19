import { useState } from 'react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import { executionApi } from '../../api/executions.api.js';
import { jobApi } from '../../api/jobs.api.js';
import { ReposTable } from './ReposTable.js';
import { JobsTable } from './JobsTable.js';
import { JobPromptEditor } from './JobPromptEditor.js';
import { CronsManager } from './CronsManager.js';
import { useCronRunner } from '../../hooks/useCronRunner.js';
import type { JobCreateInput, JobUpdateInput, Job } from '../../types/index.js';
import type { FilterSchedule } from './JobsTable.js';
import type { AppTab } from '../../App.js';
import styles from './MissionControl.module.css';

interface EditingJob { job?: Job; }

interface Props {
  activeTab: Extract<AppTab, 'jobs' | 'repos' | 'schedules'>;
}

export function MissionControl({ activeTab }: Props) {
  const { jobs, settings, repos, cliConfigs, crons, refreshAll, refreshCrons } = useAppState();
  const [editingJob, setEditingJob] = useState<EditingJob | null>(null);
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
    data: { name: string; repo_id: number; prompt: string; pre_cmd: string; post_cmd: string; timeout_seconds: number; cron_id: number | null },
    jobId?: number,
  ) {
    if (jobId) await jobApi.update(jobId, data as JobUpdateInput);
    else await jobApi.create(data as JobCreateInput);
    setEditingJob(null);
    await refreshAll();
  }

  function handleFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === 'all' || val === 'none') setFilterScheduleId(val);
    else setFilterScheduleId(Number(val));
  }

  return (
    <div className={styles.page}>
      {activeTab === 'schedules' && (
        <section className="section">
          <CronsManager
            crons={crons}
            jobs={jobs}
            cronEnabled={cronOn}
            onCronToggle={handleCronToggle}
            onChanged={refreshAll}
          />
        </section>
      )}

      {activeTab === 'repos' && (
        <section className="section">
          <ReposTable repos={repos} cliConfigs={cliConfigs} onReposChanged={refreshAll} />
        </section>
      )}

      {activeTab === 'jobs' && (
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
            <button className="btn btn-sm btn-ghost" onClick={() => setEditingJob({})}>+ Add</button>
          </div>
          <div className="section-body">
            <JobsTable
              jobs={jobs}
              crons={crons}
              runningMap={runningMap}
              filterScheduleId={filterScheduleId}
              onRun={handleRun}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={(job) => setEditingJob({ job })}
              onChanged={refreshAll}
            />
          </div>
        </section>
      )}

      {editingJob && (
        <JobPromptEditor
          job={editingJob.job}
          repos={repos}
          cliConfigs={cliConfigs}
          crons={crons}
          onSave={(data) => handleJobSave(data, editingJob.job?.id)}
          onCancel={() => setEditingJob(null)}
        />
      )}
    </div>
  );
}
