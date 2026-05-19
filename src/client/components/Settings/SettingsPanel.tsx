import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import styles from './SettingsPanel.module.css';

export function SettingsPanel() {
  const { settings, refreshSettings } = useAppState();

  const handleCronToggle = async () => {
    if (settings?.cron_enabled) {
      await settingsApi.cronStop();
    } else {
      await settingsApi.cronStart();
    }
    await refreshSettings();
  };

  const handleTerminalModeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await settingsApi.update({ terminal_mode: e.target.value as 'wt' | 'powershell' });
    await refreshSettings();
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Cron Scheduler</h3>
          <div className={styles.row}>
            <span>Cron scheduler is {settings?.cron_enabled ? 'running' : 'stopped'}</span>
            <button
              className={`${styles.toggleBtn} ${settings?.cron_enabled ? styles.on : styles.off}`}
              onClick={handleCronToggle}
            >
              {settings?.cron_enabled ? 'Stop' : 'Start'}
            </button>
          </div>
          <p className={styles.hint}>
            Each job fires on its own schedule — configure it in the job editor.
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Terminal</h3>
          <div className={styles.field}>
            <label className={styles.label}>Launch mode</label>
            <select
              className={styles.select}
              value={settings?.terminal_mode ?? 'powershell'}
              onChange={handleTerminalModeChange}
            >
              <option value="powershell">PowerShell (works on all Windows systems)</option>
              <option value="wt">Windows Terminal — wt.exe (requires Windows Terminal installed)</option>
            </select>
          </div>
          <p className={styles.hint}>
            PowerShell opens a new PowerShell window via WSL. Windows Terminal opens a new tab in wt.exe.
          </p>
        </div>
      </div>
    </div>
  );
}
