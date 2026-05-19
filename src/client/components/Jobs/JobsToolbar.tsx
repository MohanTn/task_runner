import { useCallback } from 'react';
import { Filter } from 'lucide-react';
import type { Cron } from '../../types/crons.js';
import { Select } from '../../ui/index.js';

export type JobFilter = 'all' | 'none' | string;

interface Props {
  filter: JobFilter;
  onFilterChange: (value: JobFilter) => void;
  crons: Cron[];
  visibleCount: number;
  totalCount: number;
}

export function JobsToolbar({ filter, onFilterChange, crons, visibleCount, totalCount }: Props) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onFilterChange(e.target.value as JobFilter),
    [onFilterChange],
  );

  return (
    <div className="flex items-center gap-3 px-4 h-12 border-b border-[color:var(--c-border)]">
      <Filter size={14} className="text-[color:var(--c-text-3)]" />
      <span className="text-xs font-medium text-[color:var(--c-text-2)]">Filter by schedule</span>
      <Select value={filter} onChange={handleChange} className="!h-7 !w-auto !min-w-40 text-xs">
        <option value="all">All jobs</option>
        <option value="none">Unscheduled</option>
        {crons.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name}</option>
        ))}
      </Select>
      <span className="ml-auto text-xs text-[color:var(--c-text-3)] tabular-nums">
        Showing {visibleCount} of {totalCount}
      </span>
    </div>
  );
}
