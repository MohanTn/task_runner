import { useCallback, useState } from 'react';
import { MoreHorizontal, Play, Zap } from 'lucide-react';
import type { Job } from '../../types/jobs.js';
import { Badge, Button, Card, CardHeader } from '../../ui/index.js';

const VISIBLE = 8;

interface Props {
  jobs: Job[];
  onTrigger: (id: number) => void;
  onManage: () => void;
}

export function QuickTriggerCard({ jobs, onTrigger, onManage }: Props) {
  const [showAll, setShowAll] = useState(false);
  const toggleShowAll = useCallback(() => setShowAll((v) => !v), []);

  const visible = showAll ? jobs : jobs.slice(0, VISIBLE);
  const overflow = Math.max(0, jobs.length - VISIBLE);

  return (
    <Card className="lg:col-span-2 flex flex-col">
      <CardHeader
        icon={<Zap size={14} />}
        title="Quick Trigger"
        subtitle={`${jobs.length} job${jobs.length === 1 ? '' : 's'} ready to launch`}
        actions={
          <Button variant="ghost" size="sm" onClick={onManage}>
            Manage
          </Button>
        }
      />
      <div className="p-4">
        {jobs.length === 0 ? (
          <EmptyState onAction={onManage} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visible.map((job) => (
                <QuickButton key={job.id} job={job} onTrigger={onTrigger} />
              ))}
            </div>
            {overflow > 0 && (
              <button
                onClick={toggleShowAll}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--c-text-2)] hover:text-[color:var(--c-text)]"
              >
                <MoreHorizontal size={14} />
                {showAll ? 'Show fewer' : `Show ${overflow} more`}
              </button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function QuickButton({ job, onTrigger }: { job: Job; onTrigger: (id: number) => void }) {
  const handleClick = useCallback(() => onTrigger(job.id), [job.id, onTrigger]);
  return (
    <button
      onClick={handleClick}
      className="group flex items-center gap-2.5 p-2.5 rounded-md border border-[color:var(--c-border)] bg-[color:var(--c-surface)] hover:border-[color:var(--c-accent)] hover:bg-[color:var(--c-accent-soft)] transition-all text-left"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--c-surface-2)] text-[color:var(--c-text-2)] group-hover:bg-[color:var(--c-accent)] group-hover:text-white transition-colors shrink-0">
        <Play size={14} fill="currentColor" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[color:var(--c-text)] truncate">{job.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge tone={job.run_mode === 'single' ? 'brand' : 'neutral'}>
            {job.run_mode === 'single' ? '1× single' : '∞ multi'}
          </Badge>
          {job.repo_name && (
            <span className="text-[11px] text-[color:var(--c-text-3)] truncate">{job.repo_name}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-[color:var(--c-text-2)] mb-3">No jobs configured yet.</p>
      <Button variant="primary" onClick={onAction}>Create a job</Button>
    </div>
  );
}
