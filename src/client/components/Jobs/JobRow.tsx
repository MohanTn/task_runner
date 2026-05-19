import { useCallback } from 'react';
import { Edit2, Play, Power, Trash2 } from 'lucide-react';
import type { Job } from '../../types/jobs.js';
import type { Cron } from '../../types/crons.js';
import type { RunningMap } from '../../hooks/useCronRunner.js';
import { Badge, IconButton, TD, TR, cn } from '../../ui/index.js';
import { JobScheduleSelect } from './JobScheduleSelect.js';

interface JobRowProps {
  job: Job;
  crons: Cron[];
  runState: RunningMap[number] | undefined;
  onRun: (job: Job) => void;
  onToggle: (job: Job) => void;
  onDelete: (job: Job) => void;
  onEdit: (job: Job) => void;
  onChanged: () => Promise<void>;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function JobRow({ job, crons, runState, onRun, onToggle, onDelete, onEdit, onChanged }: JobRowProps) {
  const isRunning = runState?.running === true;
  const handleRun = useCallback(() => onRun(job), [job, onRun]);
  const handleToggle = useCallback(() => onToggle(job), [job, onToggle]);
  const handleDelete = useCallback(() => onDelete(job), [job, onDelete]);
  const handleEdit = useCallback(() => onEdit(job), [job, onEdit]);

  return (
    <TR className={cn(isRunning && 'bg-[color:var(--c-accent-soft)]/40')}>
      <TD>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--c-success)] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--c-success)]" />
            </span>
          ) : (
            <span
              className={cn(
                'h-2 w-2 rounded-full shrink-0',
                job.enabled ? 'bg-[color:var(--c-success)]' : 'bg-[color:var(--c-text-3)]',
              )}
            />
          )}
          <span className="font-medium text-[color:var(--c-text)]">{job.name}</span>
          {runState?.lastRun && !isRunning && (
            <span
              className="text-[10px] text-[color:var(--c-text-3)] tabular-nums"
              title="Last run"
            >
              {formatTime(runState.lastRun)}
            </span>
          )}
        </div>
      </TD>
      <TD>
        <Badge tone={job.run_mode === 'single' ? 'brand' : 'neutral'} variant="soft">
          {job.run_mode === 'single' ? '1× single' : '∞ repeat'}
        </Badge>
      </TD>
      <TD className="text-[color:var(--c-text-2)]">{job.repo_name ?? '—'}</TD>
      <TD>
        <code className="font-mono text-[11px] text-[color:var(--c-text-3)] truncate max-w-[24ch] inline-block align-middle">
          {job.command}
        </code>
      </TD>
      <TD className="text-[color:var(--c-text-2)] tabular-nums">{job.timeout_seconds}s</TD>
      <TD className="w-44">
        <JobScheduleSelect jobId={job.id} crons={crons} onChanged={onChanged} />
      </TD>
      <TD>
        <div className="flex items-center gap-0.5 justify-end">
          <IconButton label="Run now" tone="brand" size="sm" onClick={handleRun}>
            <Play size={13} />
          </IconButton>
          <IconButton
            label={job.enabled ? 'Disable' : 'Enable'}
            tone="neutral"
            size="sm"
            onClick={handleToggle}
          >
            <Power size={13} />
          </IconButton>
          <IconButton label="Edit" tone="neutral" size="sm" onClick={handleEdit}>
            <Edit2 size={13} />
          </IconButton>
          <IconButton label="Delete" tone="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={13} />
          </IconButton>
        </div>
      </TD>
    </TR>
  );
}
