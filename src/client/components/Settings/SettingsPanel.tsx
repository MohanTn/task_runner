import { useCallback, useState } from 'react';
import { useAppState } from '../../state/AppState.js';
import { Slider } from '../Common/Slider.js';
import { settingsApi } from '../../api/settings.api.js';
import type { Settings } from '../../types/settings.js';
import styles from './SettingsPanel.module.css';

export function SettingsPanel() {
  const { settings, poolStats, refreshSettings } = useAppState();
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
              On each tick, all enabled jobs are enqueued for execution.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <Slider
            label="Max Parallel Workers"
            value={settings?.max_parallel_workers ?? 2}
            min={1}
            max={10}
            onChange={(v) => update({ max_parallel_workers: v })}
          />
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>WSL Mode</h3>
          <select
            className={styles.select}
            value={settings?.wsl_mode ?? 'auto'}
            onChange={(e) => update({ wsl_mode: e.target.value as Settings['wsl_mode'] })}
          >
            <option value="auto">Auto-detect</option>
            <option value="always">Always use WSL</option>
            <option value="never">Never use WSL</option>
          </select>
          <p className={styles.hint}>
            Controls whether commands run via WSL on Windows.
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Execution Retention</h3>
          <div className={styles.row}>
            <input
              className={styles.numberInput}
              type="number"
              value={settings?.keep_execution_days ?? 30}
              min={1}
              max={365}
              onChange={(e) => update({ keep_execution_days: Number(e.target.value) })}
            />
            <span>days</span>
          </div>
          <p className={styles.hint}>
            Executions older than this are pruned automatically.
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Worker Pool Status</h3>
          <div className={styles.statRow}>
            <span>Active workers</span>
            <span className={styles.statValue}>{poolStats?.active ?? 0}</span>
          </div>
          <div className={styles.statRow}>
            <span>Queued jobs</span>
            <span className={styles.statValue}>{poolStats?.pending ?? 0}</span>
          </div>
          <div className={styles.statRow}>
            <span>Max parallel</span>
            <span className={styles.statValue}>{poolStats?.maxParallel ?? 2}</span>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Danger Zone</h3>
          <button
            className={styles.dangerBtn}
            onClick={async () => {
              await settingsApi.cancelAll();
              await refreshSettings();
            }}
          >
            Cancel All Running Jobs
          </button>
        </div>
      </div>
    </div>
  );
}
