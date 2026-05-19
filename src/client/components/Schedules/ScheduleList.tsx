import { useCallback } from 'react';
import { CalendarClock } from 'lucide-react';
import type { Cron } from '../../types/crons.js';
import { Badge, cn } from '../../ui/index.js';

interface Props {
  crons: Cron[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ScheduleList({ crons, selectedId, onSelect }: Props) {
  if (crons.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs text-[color:var(--c-text-3)]">
        No schedules yet.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[color:var(--c-border)]">
      {crons.map((cron) => (
        <ScheduleItem
          key={cron.id}
          cron={cron}
          active={selectedId === cron.id}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function ScheduleItem({ cron, active, onSelect }: { cron: Cron; active: boolean; onSelect: (id: number) => void }) {
  const handleClick = useCallback(() => onSelect(cron.id), [cron.id, onSelect]);
  return (
    <li>
      <button
        onClick={handleClick}
        className={cn(
          'w-full text-left px-4 py-3 flex items-start gap-2.5 transition-colors',
          active
            ? 'bg-[color:var(--c-accent-soft)]'
            : 'hover:bg-[color:var(--c-surface-2)]',
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md shrink-0',
            active
              ? 'bg-[color:var(--c-accent)] text-white'
              : 'bg-[color:var(--c-surface-2)] text-[color:var(--c-text-2)]',
          )}
        >
          <CalendarClock size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'text-sm font-medium truncate',
              active ? 'text-[color:var(--c-accent)]' : 'text-[color:var(--c-text)]',
            )}
          >
            {cron.name}
          </div>
          <code className="font-mono text-[11px] text-[color:var(--c-text-3)] truncate block">
            {cron.expression}
          </code>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge tone={cron.enabled ? 'success' : 'neutral'} dot>
            {cron.enabled ? 'On' : 'Off'}
          </Badge>
          <span className="text-[10px] text-[color:var(--c-text-3)] tabular-nums">
            {cron.job_ids.length} job{cron.job_ids.length === 1 ? '' : 's'}
          </span>
        </div>
      </button>
    </li>
  );
}
