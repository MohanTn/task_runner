import { CalendarClock, Clock, Hourglass } from 'lucide-react';
import type { Cron } from '../../types/crons.js';
import { Card, CardBody, CardHeader, IconButton } from '../../ui/index.js';
import { getNextRunLabel } from '../../hooks/useCronRunner.js';

interface Props {
  crons: Cron[];
  onOpen: () => void;
}

export function UpcomingRunsCard({ crons, onOpen }: Props) {
  const upcoming = crons
    .filter((c) => c.enabled && c.job_ids.length > 0)
    .slice(0, 5)
    .map((c) => ({ cron: c, next: getNextRunLabel(c.expression) }));

  return (
    <Card>
      <CardHeader
        icon={<Clock size={14} />}
        title="Upcoming runs"
        actions={
          <IconButton label="Open schedules" tone="brand" size="sm" onClick={onOpen}>
            <CalendarClock size={14} />
          </IconButton>
        }
      />
      <CardBody className="!py-2 !px-0">
        {upcoming.length === 0 ? (
          <p className="px-4 py-3 text-xs text-[color:var(--c-text-3)]">No active schedules.</p>
        ) : (
          <ul className="divide-y divide-[color:var(--c-border)]">
            {upcoming.map(({ cron, next }) => (
              <li key={cron.id} className="px-4 py-2.5 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--c-accent-soft)] text-[color:var(--c-accent)] shrink-0">
                  <Hourglass size={13} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[color:var(--c-text)] truncate font-medium">{cron.name}</div>
                  <div className="text-[11px] text-[color:var(--c-text-3)] truncate font-mono">{cron.expression}</div>
                </div>
                <span className="text-[11px] text-[color:var(--c-text-2)] tabular-nums shrink-0">{next}</span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
