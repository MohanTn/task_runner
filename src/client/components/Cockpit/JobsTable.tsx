import { useState } from 'react';
import type { Job, RunMode } from '../../types/jobs.js';
import type { Repo } from '../../types/repos.js';
import type { CliConfig } from '../../types/cli-configs.js';
import { JobPromptEditor } from './JobPromptEditor.js';
import styles from './JobsTable.module.css';

interface JobsTableProps {
  jobs: Job[];
  repos: Repo[];
  cliConfigs: CliConfig[];
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

export function JobsTable({ jobs, repos, cliConfigs, onRun, onToggle, onDelete, onEdit, onSave, onJobsChanged }: JobsTableProps) {
  const [editing, setEditing] = useState<{ job?: Job } | null>(null);

  return (
    <div>
      <div className={styles.header}>
        <h3 className={styles.title}>Jobs</h3>
        <button className={styles.addBtn} onClick={() => setEditing({})}>+ Add</button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Run Mode</th>
            <th>Repo</th>
            <th>Command</th>
            <th>Timeout</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className={styles.nameCell}>{job.name}</td>
              <td>
                <span
                  className={`${styles.dot} ${job.enabled ? styles.dotOn : styles.dotOff}`}
                  title={job.enabled ? 'Enabled' : 'Disabled'}
                />
              </td>
              <td>
                <span className={`${styles.scheduleBadge} ${job.run_mode === 'single' ? styles.scheduleCron : styles.scheduleManual}`}>
                  {job.run_mode === 'single' ? '1 Single' : '∞ Multiple'}
                </span>
              </td>
              <td className={styles.repoCell}>{job.repo_name ?? '-'}</td>
              <td className={styles.cmdCell}>
                <code className={styles.cmd}>{job.command}</code>
              </td>
              <td className={styles.timeoutCell}>{job.timeout_seconds}s</td>
              <td className={styles.actions}>
                <button className={styles.linkBtn} onClick={() => onRun(job.id)}>Run</button>
                <button className={styles.linkBtn} onClick={() => onToggle(job.id)}>
                  {job.enabled ? 'Disable' : 'Enable'}
                </button>
                <button className={styles.linkBtn} onClick={() => { if (onEdit) onEdit(job); else setEditing({ job }); }}>Edit</button>
                <button className={styles.linkBtnDanger} onClick={() => onDelete(job.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {jobs.length === 0 && (
            <tr>
              <td className={styles.emptyCell} colSpan={7}>No jobs configured. Click &quot;+ Add&quot; to create one.</td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <JobPromptEditor
          job={editing.job}
          repos={repos}
          cliConfigs={cliConfigs}
          onSave={async (data) => {
            await onSave(data, editing.job?.id);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
