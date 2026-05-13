import { useState } from 'react';
import type { CliConfig } from '../../types/cli-configs.js';
import { cliConfigApi } from '../../api/cli-configs.api.js';
import styles from './CliSettings.module.css';

interface CliSettingsProps {
  cliConfigs: CliConfig[];
  onChanged: () => void;
}

export function CliSettings({ cliConfigs, onChanged }: CliSettingsProps) {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (config: CliConfig) => {
    setEditingName(config.cli_name);
    setEditTemplate(config.command_template);
  };

  const handleSave = async () => {
    if (!editingName || !editTemplate.trim()) return;
    setSaving(true);
    try {
      await cliConfigApi.update(editingName, { command_template: editTemplate.trim() });
      setEditingName(null);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save CLI config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className={styles.title}>CLI Settings</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>CLI</th>
            <th>Command Template</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cliConfigs.map((config) =>
            editingName === config.cli_name ? (
              <tr key={config.cli_name}>
                <td className={styles.cliName}>{config.cli_name}</td>
                <td>
                  <input
                    className={styles.inp}
                    value={editTemplate}
                    onChange={(e) => setEditTemplate(e.target.value)}
                  />
                </td>
                <td className={styles.actions}>
                  <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>Save</button>
                  <button className={styles.cancelBtn} onClick={() => setEditingName(null)}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={config.cli_name}>
                <td className={styles.cliName}>{config.cli_name}</td>
                <td className={styles.templateCell}>
                  <code className={styles.template}>{config.command_template}</code>
                </td>
                <td className={styles.actions}>
                  <button className={styles.linkBtn} onClick={() => startEdit(config)}>Edit</button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
