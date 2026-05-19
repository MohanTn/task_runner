import { useCallback, useMemo } from 'react';
import { Input, cn } from '../../ui/index.js';

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Every 30 min', value: '*/30 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Every 6h', value: '0 */6 * * *' },
  { label: 'Daily 00:00', value: '0 0 * * *' },
  { label: 'Daily 09:00', value: '0 9 * * *' },
  { label: 'Weekdays 09:00', value: '0 9 * * 1-5' },
  { label: 'Mondays 09:00', value: '0 9 * * 1' },
];

function describe(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid expression';
  const [min, hour, dom, month, dow] = parts;
  if (expr === '* * * * *') return 'Every minute';
  if (min.startsWith('*/')) return `Every ${min.slice(2)} minute${min.slice(2) === '1' ? '' : 's'}`;
  if (min === '0' && hour === '*' && dom === '*' && month === '*' && dow === '*') return 'Every hour';
  if (min === '0' && hour.startsWith('*/')) return `Every ${hour.slice(2)} hours`;
  if (min === '0' && hour === '0' && dom === '*' && month === '*' && dow === '*') return 'Daily at midnight';
  if (min === '0' && dom === '*' && month === '*' && dow === '1-5') return `Weekdays at ${hour.padStart(2, '0')}:00`;
  return `Cron: ${expr}`;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CronInput({ value, onChange, disabled }: Props) {
  const description = useMemo(() => describe(value), [value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder="* * * * *"
          disabled={disabled}
          mono
        />
        <span className="text-xs text-[color:var(--c-text-2)] whitespace-nowrap">{description}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <PresetChip key={p.value} value={p.value} label={p.label} active={value === p.value} onChange={onChange} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}

function PresetChip({
  value, label, active, onChange, disabled,
}: { value: string; label: string; active: boolean; onChange: (v: string) => void; disabled?: boolean }) {
  const handleClick = useCallback(() => onChange(value), [onChange, value]);
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium border transition-colors',
        active
          ? 'bg-[color:var(--c-accent)] border-[color:var(--c-accent)] text-white'
          : 'bg-[color:var(--c-surface-2)] border-[color:var(--c-border-2)] text-[color:var(--c-text-2)] hover:bg-[color:var(--c-surface-3)] hover:text-[color:var(--c-text)]',
      )}
    >
      {label}
    </button>
  );
}
