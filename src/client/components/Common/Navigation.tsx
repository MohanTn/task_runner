import styles from './Navigation.module.css';

export function Navigation() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        Task Runner
      </div>
    </header>
  );
}
