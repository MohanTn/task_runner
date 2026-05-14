import { useState, type FormEvent } from 'react';
import type { Cron } from '../../types/crons.js';
import { CronInput } from '../Common/CronInput.js';
import styles from './CronsManager.module.css';

interface EditorState { name: string; expression: string; saving: boolean; error: string | null; }

export function CronEditorModal({ cron, onSave, onCancel }: {
  cron?: Cron;
  onSave: (name: string, expression: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EditorState>({
    name: cron?.name ?? '',
    expression: cron?.expression ?? '*/5 * * * *',
    saving: false,
    error: null,
  });

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((s) => ({ ...s, name: e.target.value }));
  }
  function onExprChange(value: string) { setForm((s) => ({ ...s, expression: value })); }
  function stopProp(e: React.MouseEvent) { e.stopPropagation(); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setForm((s) => ({ ...s, error: 'Name is required' })); return; }
    if (!form.expression.trim()) { setForm((s) => ({ ...s, error: 'Expression is required' })); return; }
    setForm((s) => ({ ...s, saving: true, error: null }));
    try {
      await onSave(form.name.trim(), form.expression.trim());
    } catch (err) {
      setForm((s) => ({ ...s, saving: false, error: err instanceof Error ? err.message : 'Failed' }));
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <form className={styles.modal} onSubmit={handleSubmit} onClick={stopProp}>
        <h2 className={styles.modalTitle}>{cron ? 'Edit Cron' : 'New Cron'}</h2>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input className="f-input" value={form.name} onChange={onNameChange} placeholder="daily-review" autoFocus />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Schedule</label>
          <CronInput value={form.expression} onChange={onExprChange} />
        </div>
        {form.error && <p className={styles.error}>{form.error}</p>}
        <div className={styles.modalActions}>
          <button type="button" className="btn btn-muted" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={form.saving}>
            {form.saving ? 'Saving…' : cron ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
