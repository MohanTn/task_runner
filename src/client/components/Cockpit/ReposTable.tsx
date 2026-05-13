import { useState } from 'react';
import type { Repo } from '../../types/repos.js';
import type { CliConfig } from '../../types/cli-configs.js';
import { repoApi } from '../../api/repos.api.js';
import styles from './ReposTable.module.css';

interface ReposTableProps {
  repos: Repo[];
  cliConfigs: CliConfig[];
  onReposChanged: () => void;
}

export function ReposTable({ repos, cliConfigs, onReposChanged }: ReposTableProps) {
  const [editingId, setEditingId] = useState<number | '__new' | null>(null);
  const [editName, setEditName] = useState('');
  const [editPath, setEditPath] = useState('');
  const [editAiType, setEditAiType] = useState<string>('claude');
  const [saving, setSaving] = useState(false);

  const startAdd = () => {
    setEditingId('__new');
    setEditName('');
    setEditPath('');
    setEditAiType('claude');
  };

  const startEdit = (repo: Repo) => {
    setEditingId(repo.id);
    setEditName(repo.name);
    setEditPath(repo.path);
    setEditAiType(repo.ai_type as string);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!editName.trim() || !editPath.trim()) return;
    setSaving(true);
    try {
      if (editingId === '__new') {
        await repoApi.create({ name: editName.trim(), path: editPath.trim(), ai_type: editAiType });
      } else if (editingId !== null) {
        await repoApi.update(editingId, { name: editName.trim(), path: editPath.trim(), ai_type: editAiType });
      }
      setEditingId(null);
      onReposChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save repo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this repo?')) return;
    try {
      await repoApi.remove(id);
      onReposChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete repo');
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h3 className={styles.title}>Repos</h3>
        <button className={styles.addBtn} onClick={startAdd}>+ Add</button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Path</th>
            <th>AI Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) =>
            editingId === repo.id ? (
              <tr key={repo.id}>
                <td>
                  <input className={styles.inp} value={editName} onChange={(e) => setEditName(e.target.value)} />
                </td>
                <td>
                  <input className={styles.inp} value={editPath} onChange={(e) => setEditPath(e.target.value)} />
                </td>
                <td>
                  <select className={styles.select} value={editAiType} onChange={(e) => setEditAiType(e.target.value)}>
                    {cliConfigs.map((c) => (
                      <option key={c.cli_name} value={c.cli_name}>{c.cli_name}</option>
                    ))}
                  </select>
                </td>
                <td className={styles.actions}>
                  <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>Save</button>
                  <button className={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={repo.id}>
                <td className={styles.cell}>{repo.name}</td>
                <td className={styles.cellMono}>{repo.path}</td>
                <td><span className={`${styles.badge} ${repo.ai_type === 'claude' ? styles.badgeClaude : repo.ai_type === 'copilot' ? styles.badgeCopilot : styles.badgeCustom}`}>{repo.ai_type}</span></td>
                <td className={styles.actions}>
                  <button className={styles.linkBtn} onClick={() => startEdit(repo)}>Edit</button>
                  <button className={styles.linkBtnDanger} onClick={() => handleDelete(repo.id)}>Delete</button>
                </td>
              </tr>
            ),
          )}
          {editingId === '__new' && (
            <tr>
              <td>
                <input className={styles.inp} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="my-repo" />
              </td>
              <td>
                <input className={styles.inp} value={editPath} onChange={(e) => setEditPath(e.target.value)} placeholder="/home/user/project" />
              </td>
              <td>
                <select className={styles.select} value={editAiType} onChange={(e) => setEditAiType(e.target.value)}>
                  {cliConfigs.map((c) => (
                    <option key={c.cli_name} value={c.cli_name}>{c.cli_name}</option>
                  ))}
                </select>
              </td>
              <td className={styles.actions}>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>Add</button>
                <button className={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
              </td>
            </tr>
          )}
          {repos.length === 0 && editingId !== '__new' && (
            <tr>
              <td className={styles.emptyCell} colSpan={4}>No repos configured. Click "+ Add" to create one.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
