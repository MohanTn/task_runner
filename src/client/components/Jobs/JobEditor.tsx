import { useState, useCallback, type FormEvent } from 'react';
import type { Job, JobCreateInput, JobUpdateInput, RunMode } from '../../types/jobs.js';
import styles from './JobEditor.module.css';

interface JobEditorProps {
  job?: Job;
  onSave: (data: JobCreateInput | JobUpdateInput) => Promise<void>;
  onClose: () => void;
}

interface FormState {
  name: string;
  repoPath: string;
  command: string;
  preCmd: string;
  timeoutSeconds: number;
  runMode: RunMode;
  saving: boolean;
  error: string | null;
}

export function JobEditor({ job, onSave, onClose }: JobEditorProps) {
  const [form, setForm] = useState<FormState>({
    name: job?.name ?? '',
    repoPath: job?.repo_path ?? '',
    command: job?.command ?? '',
    preCmd: job?.pre_cmd ?? '',
    timeoutSeconds: job?.timeout_seconds ?? 1800,
    runMode: job?.run_mode ?? 'multiple',
    saving: false,
    error: null,
  });

  const set = useCallback(
    (patch: Partial<FormState>) => setForm(s => ({ ...s, ...patch })),
    [],
  );

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    set({ error: null });

    if (!form.name.trim()) { set({ error: 'Name is required' }); return; }
    if (!form.repoPath.trim()) { set({ error: 'Repo path is required' }); return; }
    if (!form.command.trim()) { set({ error: 'Command is required' }); return; }

    set({ saving: true });
    try {
      await onSave({
        name: form.name.trim(),
        repo_path: form.repoPath.trim(),
        command: form.command.trim(),
        pre_cmd: form.preCmd.trim(),
        timeout_seconds: form.timeoutSeconds,
        run_mode: form.runMode,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save job' });
    } finally {
      set({ saving: false });
    }
  }, [form, onSave, set]);

  const stopProp = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onSubmit={handleSubmit} onClick={stopProp}>
        <h2 className={styles.title}>{job ? 'Edit Job' : 'Add Job'}</h2>

        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="review-mr-1122"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Repo Path</label>
          <input
            className={styles.input}
            value={form.repoPath}
            onChange={(e) => set({ repoPath: e.target.value })}
            placeholder="/home/user/project"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Command</label>
          <textarea
            className={styles.textarea}
            value={form.command}
            onChange={(e) => set({ command: e.target.value })}
            placeholder='claude --dangerously-skip-permissions --model haiku4.5 -p "/review-mr 1122"'
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Pre-Command <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            className={styles.textarea}
            value={form.preCmd}
            onChange={(e) => set({ preCmd: e.target.value })}
            placeholder="git fetch origin && git reset --hard origin/main"
            rows={2}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Timeout (seconds)</label>
          <input
            className={styles.input}
            type="number"
            value={form.timeoutSeconds}
            onChange={(e) => set({ timeoutSeconds: Number(e.target.value) })}
            min={10}
            max={86400}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Run Mode</label>
          <div className={styles.scheduleToggle}>
            <button
              type="button"
              className={`${styles.scheduleOption} ${form.runMode === 'multiple' ? styles.scheduleActive : ''}`}
              onClick={() => set({ runMode: 'multiple' })}
            >
              <span className={styles.scheduleIcon}>∞</span>
              <span className={styles.scheduleLabel}>Multiple</span>
              <span className={styles.scheduleDesc}>Runs every trigger</span>
            </button>
            <button
              type="button"
              className={`${styles.scheduleOption} ${form.runMode === 'single' ? styles.scheduleActive : ''}`}
              onClick={() => set({ runMode: 'single' })}
            >
              <span className={styles.scheduleIcon}>1</span>
              <span className={styles.scheduleLabel}>Single</span>
              <span className={styles.scheduleDesc}>Auto-disables after first run</span>
            </button>
          </div>
        </div>

        {form.error && <p className={styles.error}>{form.error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={form.saving}>
            {form.saving ? 'Saving...' : job ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
