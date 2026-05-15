import type { Job } from '../../types/jobs.js';
import type { Cron } from '../../types/crons.js';
import type { RunningMap } from '../../hooks/useCronRunner.js';
import { JobScheduleDropdown } from './JobScheduleDropdown.js';
import styles from './JobsTable.module.css';

export type FilterSchedule = 'all' | 'none' | number;

interface JobsTableProps {
  jobs: Job[];
  crons: Cron[];
  runningMap: RunningMap;
  filterScheduleId: FilterSchedule;
  onRun: (jobId: number) => void;
  onToggle: (jobId: number) => void;
  onDelete: (jobId: number) => void;
  onEdit: (job: Job) => void;
  onChanged: () => Promise<void>;
}

function filterJobs(jobs: Job[], crons: Cron[], filter: FilterSchedule): Job[] {
  if (filter === 'all') return jobs;
  if (filter === 'none') return jobs.filter((j) => !crons.some((c) => c.job_ids.includes(j.id)));
  const cron = crons.find((c) => c.id === filter);
  return cron ? jobs.filter((j) => cron.job_ids.includes(j.id)) : jobs;
}

interface JobRowProps {
  job: Job;
  crons: Cron[];
  runState: RunningMap[number] | undefined;
  onRun: (id: number) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (job: Job) => void;
  onChanged: () => Promise<void>;
}

function JobRow({ job, crons, runState, onRun, onToggle, onDelete, onEdit, onChanged }: JobRowProps) {
  function handleRun() { onRun(job.id); }
  function handleToggle() { onToggle(job.id); }
  function handleDelete() { onDelete(job.id); }
  function handleEdit() { onEdit(job); }

  const isRunning = runState?.running === true;

  return (
    <tr className={isRunning ? styles.rowRunning : ''}>
      <td className={styles.nameCell}>
        {isRunning && <span className={styles.runPulse} title="Running" />}
        {job.name}
        {runState?.lastRun && !isRunning && (
          <span className={styles.lastRun} title="Last triggered by scheduler">
            {runState.lastRun.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </td>
      <td>
        <span
          className={`${styles.dot} ${job.enabled ? styles.dotOn : styles.dotOff}`}
          title={job.enabled ? 'Enabled' : 'Disabled'}
        />
      </td>
      <td>
        <span className={`badge ${job.run_mode === 'single' ? 'badge-single' : 'badge-multiple'}`}>
          {job.run_mode === 'single' ? '1× single' : '∞ repeat'}
        </span>
      </td>
      <td className={styles.repoCell}>{job.repo_name ?? '—'}</td>
      <td className={styles.cmdCell}>
        <code className={styles.cmd}>{job.command}</code>
      </td>
      <td className={styles.timeoutCell}>{job.timeout_seconds}s</td>
      <td className={styles.scheduleCell}>
        <JobScheduleDropdown jobId={job.id} crons={crons} onChanged={onChanged} />
      </td>
      <td className={styles.actions}>
        <button className="btn btn-sm btn-link" onClick={handleRun}>Run</button>
        <button className="btn btn-sm btn-link" onClick={handleToggle}>
          {job.enabled ? 'Disable' : 'Enable'}
        </button>
        <button className="btn btn-sm btn-link" onClick={handleEdit}>Edit</button>
        <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>
      </td>
    </tr>
  );
}

export function JobsTable({
  jobs, crons, runningMap, filterScheduleId,
  onRun, onToggle, onDelete, onEdit, onChanged,
}: JobsTableProps) {
  const visible = filterJobs(jobs, crons, filterScheduleId);

  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Mode</th>
          <th>Repo</th>
          <th>Command</th>
          <th>Timeout</th>
          <th>Schedule</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {visible.map((job) => (
          <JobRow
            key={job.id}
            job={job}
            crons={crons}
            runState={runningMap[job.id]}
            onRun={onRun}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onChanged={onChanged}
          />
        ))}
        {visible.length === 0 && (
          <tr>
            <td className={styles.emptyCell} colSpan={8}>
              {jobs.length === 0
                ? 'No jobs yet — click "+ Add" to create one.'
                : 'No jobs match the selected schedule filter.'}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
