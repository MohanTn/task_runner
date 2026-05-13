import { useCallback, useState } from 'react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import type { Settings } from '../../types/settings.js';
import styles from './SettingsPanel.module.css';

export function SettingsPanel() {
  const { settings, refreshSettings } = useAppState();
  const [saving, setSaving] = useState<string | null>(null);

  const update = useCallback(
    async (partial: Partial<Settings>) => {
      setSaving(Object.keys(partial)[0]);
      try {
        await settingsApi.update(partial);
        await refreshSettings();
      } catch {
        // ignore
      } finally {
        setSaving(null);
      }
    },
    [refreshSettings],
  );

  const handleCronToggle = async () => {
    if (settings?.cron_enabled) {
      await settingsApi.cronStop();
    } else {
      await settingsApi.cronStart();
    }
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
          <div className={styles.field} style={{ marginTop: 'var(--space-sm)' }}>
            <label className={styles.label}>Cron Expression</label>
            <input
              className={styles.input}
              type="text"
              value={settings?.cron_expression ?? '*/5 * * * *'}
              onChange={(e) => update({ cron_expression: e.target.value })}
              placeholder="*/5 * * * *"
            />
            <p className={styles.hint}>
              On each tick, all enabled jobs open in a new Windows Terminal tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
