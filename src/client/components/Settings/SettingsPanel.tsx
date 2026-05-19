import { useState, useEffect } from 'react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import styles from './SettingsPanel.module.css';

export function SettingsPanel() {
  const { settings, refreshSettings } = useAppState();

  const [wtPath, setWtPath] = useState(settings?.wt_exe_path ?? 'wt.exe');
  const [psPath, setPsPath] = useState(settings?.powershell_exe_path ?? 'powershell.exe');

  useEffect(() => {
    if (settings?.wt_exe_path !== undefined) setWtPath(settings.wt_exe_path as string);
    if (settings?.powershell_exe_path !== undefined) setPsPath(settings.powershell_exe_path as string);
  }, [settings]);

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

  const handleWtPathBlur = async () => {
    await settingsApi.update({ wt_exe_path: wtPath });
    await refreshSettings();
  };

  const handlePsPathBlur = async () => {
    await settingsApi.update({ powershell_exe_path: psPath });
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
              value={settings?.terminal_mode ?? 'wt'}
              onChange={handleTerminalModeChange}
            >
              <option value="wt">Windows Terminal — wt.exe (tried first)</option>
              <option value="powershell">PowerShell (tried first)</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Windows Terminal path (wt.exe)</label>
            <input
              className={styles.input}
              type="text"
              value={wtPath}
              onChange={(e) => setWtPath(e.target.value)}
              onBlur={handleWtPathBlur}
              placeholder="wt.exe"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>PowerShell path (powershell.exe)</label>
            <input
              className={styles.input}
              type="text"
              value={psPath}
              onChange={(e) => setPsPath(e.target.value)}
              onBlur={handlePsPathBlur}
              placeholder="powershell.exe"
            />
          </div>
          <p className={styles.hint}>
            The selected mode is tried first; the other is the automatic fallback. If both fail, an
            error banner appears on the Dashboard. Use full paths (e.g.{' '}
            <code>C:\Users\you\AppData\Local\Microsoft\WindowsApps\wt.exe</code>) if the executable
            is not on the system PATH.
          </p>
        </div>
      </div>
    </div>
  );
}
