import type { ReactNode } from 'react';
import { Card, cn } from '../../ui/index.js';

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: number;
  sub?: ReactNode;
  onClick?: () => void;
}

export function StatTile({ icon, label, value, sub, onClick }: StatTileProps) {
  return (
    <Card
      padded
      className={cn(
        'flex flex-col gap-2 transition-colors',
        onClick && 'cursor-pointer hover:border-[color:var(--c-border-2)] hover:bg-[color:var(--c-surface-2)]',
      )}
    >
      <button onClick={onClick} className="text-left w-full flex flex-col gap-2 cursor-inherit">
        <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[color:var(--c-text-2)]">
          {icon} {label}
        </span>
        <span className="text-3xl font-semibold tabular-nums leading-none text-[color:var(--c-text)]">
          {value}
        </span>
        <span className="flex flex-wrap items-center gap-1.5">{sub}</span>
      </button>
    </Card>
  );
}
