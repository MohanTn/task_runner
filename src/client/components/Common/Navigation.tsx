import styles from './Navigation.module.css';

export function Navigation() {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>Task Runner</span>
    </header>
  );
}
