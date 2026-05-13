import { useState, type FormEvent } from 'react';
import type { Job, JobCreateInput, JobUpdateInput, RunMode } from '../../types/jobs.js';
import styles from './JobEditor.module.css';

interface JobEditorProps {
  job?: Job;
  onSave: (data: JobCreateInput | JobUpdateInput) => Promise<void>;
  onClose: () => void;
}

export function JobEditor({ job, onSave, onClose }: JobEditorProps) {
  const [name, setName] = useState(job?.name ?? '');
  const [repoPath, setRepoPath] = useState(job?.repo_path ?? '');
  const [command, setCommand] = useState(job?.command ?? '');
  const [timeoutSeconds, setTimeoutSeconds] = useState(job?.timeout_seconds ?? 1800);
  const [runMode, setRunMode] = useState<RunMode>(job?.run_mode ?? 'multiple');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('Name is required'); return; }
    if (!repoPath.trim()) { setError('Repo path is required'); return; }
    if (!command.trim()) { setError('Command is required'); return; }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        repo_path: repoPath.trim(),
        command: command.trim(),
        timeout_seconds: timeoutSeconds,
        run_mode: runMode,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{job ? 'Edit Job' : 'Add Job'}</h2>

        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="review-mr-1122"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Repo Path</label>
          <input
            className={styles.input}
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder="/home/user/project"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Command</label>
          <textarea
            className={styles.textarea}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder='claude --dangerously-skip-permissions --model haiku4.5 -p "/review-mr 1122"'
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Timeout (seconds)</label>
          <input
            className={styles.input}
            type="number"
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
            min={10}
            max={86400}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Run Mode</label>
          <div className={styles.scheduleToggle}>
            <button
              type="button"
              className={`${styles.scheduleOption} ${runMode === 'multiple' ? styles.scheduleActive : ''}`}
              onClick={() => setRunMode('multiple')}
            >
              <span className={styles.scheduleIcon}>∞</span>
              <span className={styles.scheduleLabel}>Multiple</span>
              <span className={styles.scheduleDesc}>Runs every trigger</span>
            </button>
            <button
              type="button"
              className={`${styles.scheduleOption} ${runMode === 'single' ? styles.scheduleActive : ''}`}
              onClick={() => setRunMode('single')}
            >
              <span className={styles.scheduleIcon}>1</span>
              <span className={styles.scheduleLabel}>Single</span>
              <span className={styles.scheduleDesc}>Auto-disables after first run</span>
            </button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : job ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
