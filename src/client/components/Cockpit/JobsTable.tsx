import type { Job, RunMode } from '../../types/jobs.js';
import type { Repo } from '../../types/repos.js';
import type { CliConfig } from '../../types/cli-configs.js';
import type { Cron } from '../../types/crons.js';
import styles from './JobsTable.module.css';

interface JobsTableProps {
  jobs: Job[];
  repos: Repo[];
  cliConfigs: CliConfig[];
  crons?: Cron[];
  onRun: (jobId: number) => void;
  onToggle: (jobId: number) => void;
  onDelete: (jobId: number) => void;
  onEdit?: (job: Job) => void;
  onSave: (data: {
    name: string;
    repo_id: number;
    prompt: string;
    timeout_seconds: number;
    run_mode: RunMode;
  }, jobId?: number) => Promise<void>;
  onJobsChanged: () => void;
}

export function JobsTable({ jobs, crons = [], onRun, onToggle, onDelete, onEdit = () => {} }: JobsTableProps) {
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
          <th>Cron</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => {
          const linkedCrons = crons.filter((c) => c.job_ids.includes(job.id));
          return (
            <tr key={job.id}>
              <td className={styles.nameCell}>{job.name}</td>
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
              <td className={styles.cronCell}>
                {linkedCrons.length === 0
                  ? <span className={styles.cronNone}>—</span>
                  : linkedCrons.map((c) => (
                    <span key={c.id} className={`${styles.cronBadge} ${c.enabled ? styles.cronBadgeOn : styles.cronBadgeOff}`} title={c.expression}>
                      {c.name}
                    </span>
                  ))
                }
              </td>
              <td className={styles.actions}>
                <button className="btn btn-sm btn-link" onClick={() => onRun(job.id)}>Run</button>
                <button className="btn btn-sm btn-link" onClick={() => onToggle(job.id)}>
                  {job.enabled ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-sm btn-link" onClick={() => onEdit(job)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(job.id)}>Delete</button>
              </td>
            </tr>
          );
        })}
        {jobs.length === 0 && (
          <tr>
            <td className={styles.emptyCell} colSpan={8}>
              No jobs yet — click &quot;+ Add&quot; to create one.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
