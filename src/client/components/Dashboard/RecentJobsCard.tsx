import { ListChecks } from 'lucide-react';
import type { Job } from '../../types/jobs.js';
import { Badge, Card, CardBody, CardHeader, cn } from '../../ui/index.js';

interface Props {
  jobs: Job[];
}

function sortByUpdated(a: Job, b: Job): number {
  return b.updated_at > a.updated_at ? 1 : -1;
}

export function RecentJobsCard({ jobs }: Props) {
  const recent = [...jobs].sort(sortByUpdated).slice(0, 5);
  return (
    <Card>
      <CardHeader icon={<ListChecks size={14} />} title="Recent jobs" subtitle="Latest updates" />
      <CardBody className="!py-2 !px-0">
        <ul className="divide-y divide-[color:var(--c-border)]">
          {recent.map((job) => (
            <li key={job.id} className="px-4 py-2 flex items-center gap-2">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  job.enabled ? 'bg-[color:var(--c-success)]' : 'bg-[color:var(--c-text-3)]',
                )}
              />
              <span className="flex-1 text-sm text-[color:var(--c-text)] truncate">{job.name}</span>
              <Badge tone={job.run_mode === 'single' ? 'brand' : 'neutral'}>
                {job.run_mode === 'single' ? '1× single' : '∞ multi'}
              </Badge>
            </li>
          ))}
          {jobs.length === 0 && (
            <li className="px-4 py-3 text-xs text-[color:var(--c-text-3)]">No jobs yet.</li>
          )}
        </ul>
      </CardBody>
    </Card>
  );
}
