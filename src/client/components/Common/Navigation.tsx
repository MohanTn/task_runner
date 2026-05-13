import styles from './Navigation.module.css';

interface NavigationProps {
  connected: boolean;
}

export function Navigation({ connected }: NavigationProps) {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>Task Runner</span>
      <span className={styles.spacer} />
      <span
        className={styles.dot}
        style={{ background: connected ? 'var(--success)' : 'var(--danger)' }}
      />
      <span className={styles.status}>{connected ? 'Connected' : 'Disconnected'}</span>
    </header>
  );
}
