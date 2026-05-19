import { useCallback, useState } from 'react';
import { CalendarClock, Edit2, Plus, Power, Trash2, X } from 'lucide-react';
import type { Cron } from '../../types/crons.js';
import type { Job } from '../../types/jobs.js';
import { cronApi } from '../../api/crons.api.js';
import { Badge, Button, IconButton, Select, cn, useToast } from '../../ui/index.js';
import { getNextRunLabel } from '../../hooks/useCronRunner.js';

interface Props {
  cron: Cron;
  jobs: Job[];
  onEdit: (cron: Cron) => void;
  onToggle: (cron: Cron) => void;
  onDelete: (cron: Cron) => void;
  onChanged: () => Promise<void>;
}

export function ScheduleDetail({ cron, jobs, onEdit, onToggle, onDelete, onChanged }: Props) {
  const handleEdit = useCallback(() => onEdit(cron), [onEdit, cron]);
  const handleToggle = useCallback(() => onToggle(cron), [onToggle, cron]);
  const handleDelete = useCallback(() => onDelete(cron), [onDelete, cron]);

  const linkedJobs = jobs.filter((j) => cron.job_ids.includes(j.id));
  const unlinkedJobs = jobs.filter((j) => !cron.job_ids.includes(j.id));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-[color:var(--c-border)]">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[color:var(--c-accent-soft)] text-[color:var(--c-accent)] shrink-0">
          <CalendarClock size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-[color:var(--c-text)] truncate">{cron.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="font-mono text-xs text-[color:var(--c-text-3)]">{cron.expression}</code>
            <span className="text-[11px] text-[color:var(--c-text-2)]">·</span>
            <span className="text-[11px] text-[color:var(--c-text-2)]">Next: {getNextRunLabel(cron.expression)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone={cron.enabled ? 'success' : 'neutral'} dot>
            {cron.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <IconButton label="Edit" onClick={handleEdit}>
            <Edit2 size={14} />
          </IconButton>
          <IconButton
            label={cron.enabled ? 'Disable' : 'Enable'}
            tone={cron.enabled ? 'neutral' : 'brand'}
            onClick={handleToggle}
          >
            <Power size={14} />
          </IconButton>
          <IconButton label="Delete" tone="danger" onClick={handleDelete}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--c-text-2)] mb-2">
            Linked jobs ({linkedJobs.length})
          </h3>
          {linkedJobs.length === 0 ? (
            <p className="text-sm text-[color:var(--c-text-3)] italic">
              No jobs linked yet. Pick one from the dropdown below.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {linkedJobs.map((job) => (
                <JobChip key={job.id} job={job} cron={cron} onChanged={onChanged} />
              ))}
            </div>
          )}
        </section>

        <LinkJobControl cron={cron} jobs={unlinkedJobs} onChanged={onChanged} />
      </div>
    </div>
  );
}

function JobChip({ job, cron, onChanged }: { job: Job; cron: Cron; onChanged: () => Promise<void> }) {
  const [removing, setRemoving] = useState(false);
  const toast = useToast();
  const handleRemove = useCallback(async () => {
    setRemoving(true);
    try {
      await cronApi.removeJob(cron.id, job.id);
      toast.success('Link removed', `'${job.name}' unlinked from '${cron.name}'`);
      await onChanged();
    } catch (err) {
      toast.error('Failed to unlink', err instanceof Error ? err.message : undefined);
    } finally {
      setRemoving(false);
    }
  }, [cron.id, cron.name, job.id, job.name, onChanged, toast]);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1 rounded-full border border-[color:var(--c-border-2)] bg-[color:var(--c-surface)] text-sm',
        removing && 'opacity-50',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          job.enabled ? 'bg-[color:var(--c-success)]' : 'bg-[color:var(--c-text-3)]',
        )}
      />
      <span className="text-[color:var(--c-text)]">{job.name}</span>
      <button
        onClick={handleRemove}
        disabled={removing}
        title="Unlink"
        className="h-5 w-5 inline-flex items-center justify-center rounded-full text-[color:var(--c-text-3)] hover:bg-[color:var(--c-danger-soft)] hover:text-[color:var(--c-danger)]"
      >
        <X size={11} />
      </button>
    </span>
  );
}

function LinkJobControl({ cron, jobs, onChanged }: { cron: Cron; jobs: Job[]; onChanged: () => Promise<void> }) {
  const [selected, setSelected] = useState<number | ''>('');
  const [adding, setAdding] = useState(false);
  const toast = useToast();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setSelected(Number(e.target.value) || ''),
    [],
  );

  const handleAdd = useCallback(async () => {
    if (!selected) return;
    setAdding(true);
    try {
      await cronApi.addJob(cron.id, selected as number);
      const job = jobs.find((j) => j.id === selected);
      toast.success('Job linked to schedule', job ? `'${job.name}' → '${cron.name}'` : undefined);
      setSelected('');
      await onChanged();
    } catch (err) {
      toast.error('Failed to link job', err instanceof Error ? err.message : undefined);
    } finally {
      setAdding(false);
    }
  }, [cron.id, cron.name, jobs, selected, onChanged, toast]);

  if (jobs.length === 0) {
    return (
      <p className="text-xs text-[color:var(--c-text-3)] italic">
        All jobs are already linked to this schedule.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onChange={handleChange} className="!w-auto !min-w-56">
        <option value="">+ Link a job…</option>
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>{j.name}</option>
        ))}
      </Select>
      <Button
        variant="primary"
        size="md"
        leftIcon={<Plus size={13} />}
        onClick={handleAdd}
        disabled={!selected || adding}
      >
        Link
      </Button>
    </div>
  );
}
