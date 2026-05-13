import { useState } from 'react';
import type { Job } from '../../types/jobs.js';
import { jobApi } from '../../api/jobs.api.js';
import { executionApi } from '../../api/executions.api.js';
import { ConfirmDialog } from '../Common/ConfirmDialog.js';
import { StatusBadge } from '../Common/StatusBadge.js';
import styles from './JobCard.module.css';

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onToggled: () => Promise<void>;
}

export function JobCard({ job, onEdit, onToggled }: JobCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleToggle = async () => {
    await jobApi.toggle(job.id);
    await onToggled();
  };

  const handleDelete = async () => {
    await jobApi.remove(job.id);
    setShowDelete(false);
    await onToggled();
  };

  const handleTrigger = async () => {
    await executionApi.trigger(job.id);
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <h3 className={styles.cardTitle}>{job.name}</h3>
            <span
              className={`${styles.indicator} ${job.enabled ? styles.active : styles.inactive}`}
              title={job.enabled ? 'Enabled' : 'Disabled'}
            />
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Repo</span>
            <span className={styles.detailValue} title={job.repo_path}>
              {job.repo_path.length > 40
                ? '...' + job.repo_path.slice(-37)
                : job.repo_path}
            </span>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Command</span>
            <span className={styles.detailValue} title={job.command}>
              {job.command.length > 60
                ? job.command.slice(0, 57) + '...'
                : job.command}
            </span>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Timeout</span>
            <span className={styles.detailValue}>{job.timeout_seconds}s</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.runBtn} onClick={handleTrigger} title="Run now">
            ▶ Run
          </button>
          <button className={styles.toggleBtn} onClick={handleToggle}>
            {job.enabled ? 'Disable' : 'Enable'}
          </button>
          <button className={styles.editBtn} onClick={() => onEdit(job)}>
            Edit
          </button>
          <button className={styles.deleteBtn} onClick={() => setShowDelete(true)}>
            Delete
          </button>
        </div>
      </div>

      {showDelete && (
        <ConfirmDialog
          title="Delete Job"
          message={`Are you sure you want to delete "${job.name}"? All execution history will also be removed.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  );
}
