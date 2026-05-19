import type { AppTab } from '../../App.js';
import styles from './Navigation.module.css';

const TABS: { id: AppTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'jobs',      label: 'Jobs' },
  { id: 'repos',     label: 'Repos' },
  { id: 'schedules', label: 'Schedules' },
  { id: 'settings',  label: 'Settings' },
];

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function Navigation({ activeTab, onTabChange }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        Task Runner
      </div>
      <nav className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
