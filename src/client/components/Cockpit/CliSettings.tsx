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

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTemplate, setNewTemplate] = useState('');
  const [addSaving, setAddSaving] = useState(false);

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

  const handleDelete = async (cliName: string) => {
    if (!confirm(`Delete CLI config "${cliName}"?`)) return;
    try {
      await cliConfigApi.remove(cliName);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete CLI config');
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newTemplate.trim()) return;
    setAddSaving(true);
    try {
      await cliConfigApi.create({ cli_name: newName.trim(), command_template: newTemplate.trim() });
      setAdding(false);
      setNewName('');
      setNewTemplate('');
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create CLI config');
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <span className="section-title">CLI Settings</span>
        {!adding && (
          <button className="btn btn-sm btn-ghost" onClick={() => setAdding(true)}>+ Add</button>
        )}
      </div>
      <table className="tbl">
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
                <td className={styles.cliNameCell}>{config.cli_name}</td>
                <td>
                  <input
                    className="f-input f-mono"
                    value={editTemplate}
                    onChange={(e) => setEditTemplate(e.target.value)}
                  />
                </td>
                <td className={styles.actions}>
                  <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>Save</button>
                  <button className="btn btn-sm btn-muted" onClick={() => setEditingName(null)}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={config.cli_name}>
                <td className={styles.cliNameCell}>{config.cli_name}</td>
                <td className={styles.templateCell}>
                  <code className={styles.template}>{config.command_template}</code>
                </td>
                <td className={styles.actions}>
                  <button className="btn btn-sm btn-link" onClick={() => startEdit(config)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(config.cli_name)}>Delete</button>
                </td>
              </tr>
            ),
          )}
          {adding && (
            <tr>
              <td>
                <input
                  className="f-input f-mono"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. python3"
                  autoFocus
                />
              </td>
              <td>
                <input
                  className="f-input f-mono"
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  placeholder="e.g. python3 /home/user/scripts/run.py"
                />
              </td>
              <td className={styles.actions}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleAdd}
                  disabled={addSaving || !newName.trim() || !newTemplate.trim()}
                >
                  Add
                </button>
                <button
                  className="btn btn-sm btn-muted"
                  onClick={() => { setAdding(false); setNewName(''); setNewTemplate(''); }}
                >
                  Cancel
                </button>
              </td>
            </tr>
          )}
          {cliConfigs.length === 0 && !adding && (
            <tr>
              <td className={styles.emptyCell} colSpan={3}>No CLI configs yet — click &quot;+ Add&quot; to create one.</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className={styles.hint}>
        Command template is prepended to the job prompt — e.g. <code>claude -p</code> or <code>python3 /path/to/script.py</code>.
      </p>
    </>
  );
}
