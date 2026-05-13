import styles from './Navigation.module.css';

export type Tab = 'cockpit' | 'jobs' | 'history' | 'settings';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  connected: boolean;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'cockpit', label: 'Cockpit' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

export function Navigation({ activeTab, onTabChange, connected }: NavigationProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.logo}>⚡</span>
        <span className={styles.title}>Task Runner</span>
      </div>
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.status}>
        <span
          className={styles.dot}
          style={{ backgroundColor: connected ? 'var(--color-success)' : 'var(--color-danger)' }}
        />
        {connected ? 'Connected' : 'Disconnected'}
      </div>
    </nav>
  );
}
