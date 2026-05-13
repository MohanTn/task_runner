import styles from './StatusBadge.module.css';

type Status = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface StatusBadgeProps {
  status: Status;
}

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  pending: { color: 'var(--color-warning)', label: 'Pending' },
  running: { color: 'var(--color-info)', label: 'Running' },
  completed: { color: 'var(--color-success)', label: 'Completed' },
  failed: { color: 'var(--color-danger)', label: 'Failed' },
  cancelled: { color: 'var(--color-text-muted)', label: 'Cancelled' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span className={styles.badge}>
      <span className={styles.dot} style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}
