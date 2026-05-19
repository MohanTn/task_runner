import { useCallback, useState, type FormEvent } from 'react';
import type { Cron } from '../../types/crons.js';
import { Banner, Button, Field, Input, Modal } from '../../ui/index.js';
import { getNextRunLabel } from '../../hooks/useCronRunner.js';
import { CronInput } from './CronInput.js';

interface Props {
  cron?: Cron;
  onSave: (name: string, expression: string) => Promise<void>;
  onCancel: () => void;
}

export function ScheduleEditor({ cron, onSave, onCancel }: Props) {
  const [name, setName] = useState(cron?.name ?? '');
  const [expr, setExpr] = useState(cron?.expression ?? '*/5 * * * *');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expr.trim()) { setError('Name and expression are required'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), expr.trim());
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [name, expr, onSave]);

  const handleName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value), []);

  return (
    <Modal
      title={cron ? 'Edit schedule' : 'New schedule'}
      subtitle="Define a cron expression and reuse it across many jobs."
      onClose={onCancel}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : cron ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Banner tone="error">{error}</Banner>}
        <Field label="Name">
          <Input value={name} onChange={handleName} placeholder="daily-review" autoFocus />
        </Field>
        <Field
          label="Cron expression"
          hint={expr.trim() ? `Next run: ${getNextRunLabel(expr)}` : undefined}
        >
          <CronInput value={expr} onChange={setExpr} />
        </Field>
      </form>
    </Modal>
  );
}
