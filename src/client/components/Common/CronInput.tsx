import { useMemo } from 'react';
import styles from './CronInput.module.css';

interface CronInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Daily midnight', value: '0 0 * * *' },
  { label: 'Daily 9am', value: '0 9 * * *' },
  { label: 'Weekdays 9am', value: '0 9 * * 1-5' },
  { label: 'Every Monday 9am', value: '0 9 * * 1' },
];

function describeCron(expr: string): string {
  if (!expr) return '';
  try {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return 'Invalid expression';

    const [min, hour, dom, month, dow] = parts;

    if (expr === '* * * * *') return 'Every minute';
    if (expr === '*/5 * * * *') return 'Every 5 minutes';
    if (expr === '*/15 * * * *') return 'Every 15 minutes';
    if (expr === '*/30 * * * *') return 'Every 30 minutes';
    if (min === '0' && hour === '*' && dom === '*' && month === '*' && dow === '*')
      return 'Every hour';
    if (min === '0' && hour.startsWith('*/'))
      return `Every ${hour.slice(2)} hours`;
    if (min === '0' && dom === '*' && month === '*' && dow === '*')
      return `At :${min.padStart(2, '0')} past hour ${hour}`;
    if (min === '0' && hour === '0' && dom === '*' && month === '*' && dow === '*')
      return 'Daily at midnight';
    if (min === '0' && dom === '*' && month === '*' && dow === '1-5')
      return `Weekdays at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    if (min === '0' && dom === '*' && month === '*' && dow !== '*')
      return `Day ${dow} at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;

    return `Cron: ${expr}`;
  } catch {
    return 'Invalid expression';
  }
}

export function CronInput({ value, onChange, disabled }: CronInputProps) {
  const description = useMemo(() => describeCron(value), [value]);

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="* * * * *"
          disabled={disabled}
        />
        <span className={styles.description}>{description}</span>
      </div>
      <div className={styles.presets}>
        {CRON_PRESETS.map((preset) => (
          <button
            key={preset.value}
            className={`${styles.preset} ${value === preset.value ? styles.active : ''}`}
            onClick={() => onChange(preset.value)}
            disabled={disabled}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
