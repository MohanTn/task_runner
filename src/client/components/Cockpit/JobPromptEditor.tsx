import { useState, useMemo, type FormEvent } from 'react';
import type { Job, RunMode } from '../../types/jobs.js';
import type { Repo } from '../../types/repos.js';
import type { CliConfig } from '../../types/cli-configs.js';
import type { Cron } from '../../types/crons.js';
import styles from './JobPromptEditor.module.css';

interface SaveData {
  name: string;
  repo_id: number;
  prompt: string;
  timeout_seconds: number;
  run_mode: RunMode;
  cron_id: number | null;
}

interface FormState {
  name: string;
  repoId: number | '';
  prompt: string;
  timeoutSeconds: number;
  runMode: RunMode;
  cronId: number | '';
  saving: boolean;
  error: string | null;
}

interface JobPromptEditorProps {
  job?: Job;
  repos: Repo[];
  cliConfigs: CliConfig[];
  crons: Cron[];
  onSave: (data: SaveData) => Promise<void>;
  onCancel: () => void;
}

function buildInitialForm(job: Job | undefined): FormState {
  return {
    name: job?.name ?? '',
    repoId: job?.repo_id ?? '',
    prompt: job?.prompt ?? '',
    timeoutSeconds: job?.timeout_seconds ?? 1800,
    runMode: job?.run_mode ?? 'multiple',
    cronId: job?.cron_id ?? '',
    saving: false,
    error: null,
  };
}

export function JobPromptEditor({ job, repos, cliConfigs, crons, onSave, onCancel }: JobPromptEditorProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(job));

  const { selectedRepo, commandPreview } = useMemo(() => {
    const repo = repos.find((r) => r.id === form.repoId);
    const cli = cliConfigs.find((c) => c.cli_name === repo?.ai_type);
    const preview = cli ? cli.command_template : '';
    return { selectedRepo: repo, commandPreview: preview };
  }, [repos, cliConfigs, form.repoId]);

  function handleStopProp(e: React.MouseEvent) { e.stopPropagation(); }
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) { setForm((s) => ({ ...s, name: e.target.value })); }
  function handleRepoChange(e: React.ChangeEvent<HTMLSelectElement>) { setForm((s) => ({ ...s, repoId: Number(e.target.value) || '' })); }
  function handlePromptChange(e: React.ChangeEvent<HTMLTextAreaElement>) { setForm((s) => ({ ...s, prompt: e.target.value })); }
  function handleTimeoutChange(e: React.ChangeEvent<HTMLInputElement>) { setForm((s) => ({ ...s, timeoutSeconds: Number(e.target.value) })); }
  function handleCronChange(e: React.ChangeEvent<HTMLSelectElement>) { setForm((s) => ({ ...s, cronId: Number(e.target.value) || '' })); }
  function handleRunModeMultiple() { setForm((s) => ({ ...s, runMode: 'multiple' })); }
  function handleRunModeSingle() { setForm((s) => ({ ...s, runMode: 'single' })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setForm((s) => ({ ...s, error: 'Name is required' })); return; }
    if (!form.repoId) { setForm((s) => ({ ...s, error: 'Please select a repo' })); return; }
    if (!form.prompt.trim()) { setForm((s) => ({ ...s, error: 'Prompt is required' })); return; }
    setForm((s) => ({ ...s, saving: true, error: null }));
    try {
      await onSave({
        name: form.name.trim(),
        repo_id: form.repoId as number,
        prompt: form.prompt.trim(),
        timeout_seconds: form.timeoutSeconds,
        run_mode: form.runMode,
        cron_id: form.cronId ? (form.cronId as number) : null,
      });
    } catch (err) {
      setForm((s) => ({ ...s, saving: false, error: err instanceof Error ? err.message : 'Failed to save job' }));
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <form className={styles.modal} onSubmit={handleSubmit} onClick={handleStopProp}>
        <h2 className={styles.title}>{job ? 'Edit Job' : 'New Job'}</h2>

        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input className="f-input" value={form.name} onChange={handleNameChange} placeholder="review-mr-1122" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Repo</label>
          <select className="f-select" value={form.repoId} onChange={handleRepoChange}>
            <option value="">— Select repo —</option>
            {repos.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.ai_type})</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Prompt</label>
          <textarea
            className="f-textarea"
            value={form.prompt}
            onChange={handlePromptChange}
            placeholder="review PR #123 and summarize changes"
            rows={3}
          />
          {selectedRepo && <span className={styles.cliHint}>CLI: {selectedRepo.ai_type}</span>}
        </div>

        {commandPreview && (
          <div className={styles.field}>
            <label className={styles.label}>CLI Template</label>
            <pre className={styles.preview}>{commandPreview}</pre>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Schedule</label>
          <select className="f-select" value={form.cronId} onChange={handleCronChange}>
            <option value="">None (manual run only)</option>
            {crons.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.expression}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Timeout (seconds)</label>
          <input
            className="f-input"
            type="number"
            value={form.timeoutSeconds}
            onChange={handleTimeoutChange}
            min={10}
            max={86400}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Run Mode</label>
          <div className={styles.runModeToggle}>
            <button
              type="button"
              className={`${styles.runModeOption} ${form.runMode === 'multiple' ? styles.runModeActive : ''}`}
              onClick={handleRunModeMultiple}
            >
              <span className={styles.runModeIcon}>∞</span>
              <span className={styles.runModeLabel}>Multiple</span>
              <span className={styles.runModeDesc}>Runs every trigger</span>
            </button>
            <button
              type="button"
              className={`${styles.runModeOption} ${form.runMode === 'single' ? styles.runModeActive : ''}`}
              onClick={handleRunModeSingle}
            >
              <span className={styles.runModeIcon}>1</span>
              <span className={styles.runModeLabel}>Single</span>
              <span className={styles.runModeDesc}>Auto-disables after first run</span>
            </button>
          </div>
        </div>

        {form.error && <p className={styles.error}>{form.error}</p>}

        <div className={styles.actions}>
          <button type="button" className="btn btn-muted" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={form.saving}>
            {form.saving ? 'Saving…' : job ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
