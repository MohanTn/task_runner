import { useState, useMemo, type FormEvent } from 'react';
import type { Job, RunMode } from '../../types/jobs.js';
import type { Repo } from '../../types/repos.js';
import type { CliConfig } from '../../types/cli-configs.js';
import styles from './JobPromptEditor.module.css';

interface JobPromptEditorProps {
  job?: Job;
  repos: Repo[];
  cliConfigs: CliConfig[];
  onSave: (data: {
    name: string;
    repo_id: number;
    prompt: string;
    timeout_seconds: number;
    run_mode: RunMode;
  }) => Promise<void>;
  onCancel: () => void;
}

export function JobPromptEditor({ job, repos, cliConfigs, onSave, onCancel }: JobPromptEditorProps) {
  const [name, setName] = useState(job?.name ?? '');
  const [repoId, setRepoId] = useState<number | ''>(job?.repo_id ?? '');
  const [prompt, setPrompt] = useState(job?.prompt ?? '');
  const [timeoutSeconds, setTimeoutSeconds] = useState(job?.timeout_seconds ?? 1800);
  const [runMode, setRunMode] = useState<RunMode>(job?.run_mode ?? 'multiple');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRepo = useMemo(() => repos.find((r) => r.id === repoId), [repos, repoId]);
  const selectedCliConfig = useMemo(
    () => cliConfigs.find((c) => c.cli_name === selectedRepo?.ai_type),
    [cliConfigs, selectedRepo],
  );
  const commandPreview = useMemo(() => {
    if (!selectedCliConfig || !prompt.trim()) return '';
    return `${selectedCliConfig.command_template} "${prompt.trim()}"`;
  }, [selectedCliConfig, prompt]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Name is required'); return; }
    if (!repoId) { setError('Please select a repo'); return; }
    if (!prompt.trim()) { setError('Prompt is required'); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        repo_id: repoId as number,
        prompt: prompt.trim(),
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
    <div className={styles.overlay} onClick={onCancel}>
      <form className={styles.modal} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{job ? 'Edit Job' : 'New Job'}</h2>

        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input className="f-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="review-mr-1122" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Repo</label>
          <select className="f-select" value={repoId} onChange={(e) => setRepoId(Number(e.target.value) || '')}>
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
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="review PR #123 and summarize changes"
            rows={3}
          />
          {selectedRepo && <span className={styles.cliHint}>CLI: {selectedRepo.ai_type}</span>}
        </div>

        {commandPreview && (
          <div className={styles.field}>
            <label className={styles.label}>Command Preview</label>
            <pre className={styles.preview}>{commandPreview}</pre>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Timeout (seconds)</label>
          <input
            className="f-input"
            type="number"
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
            min={10}
            max={86400}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Run Mode</label>
          <div className={styles.runModeToggle}>
            <button
              type="button"
              className={`${styles.runModeOption} ${runMode === 'multiple' ? styles.runModeActive : ''}`}
              onClick={() => setRunMode('multiple')}
            >
              <span className={styles.runModeIcon}>∞</span>
              <span className={styles.runModeLabel}>Multiple</span>
              <span className={styles.runModeDesc}>Runs every trigger</span>
            </button>
            <button
              type="button"
              className={`${styles.runModeOption} ${runMode === 'single' ? styles.runModeActive : ''}`}
              onClick={() => setRunMode('single')}
            >
              <span className={styles.runModeIcon}>1</span>
              <span className={styles.runModeLabel}>Single</span>
              <span className={styles.runModeDesc}>Auto-disables after first run</span>
            </button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className="btn btn-muted" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : job ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
