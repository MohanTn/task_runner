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

  const cancelEdit = () => setEditingId(null);

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
    <>
      <div className="section-head">
        <span className="section-title">Repos</span>
        <button className="btn btn-sm btn-ghost" onClick={startAdd}>+ Add</button>
      </div>
      <table className="tbl">
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
                <td><input className="f-input f-mono" value={editName} onChange={(e) => setEditName(e.target.value)} /></td>
                <td><input className="f-input f-mono" value={editPath} onChange={(e) => setEditPath(e.target.value)} /></td>
                <td>
                  <select className="f-select" value={editAiType} onChange={(e) => setEditAiType(e.target.value)}>
                    {cliConfigs.map((c) => <option key={c.cli_name} value={c.cli_name}>{c.cli_name}</option>)}
                  </select>
                </td>
                <td className={styles.actions}>
                  <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>Save</button>
                  <button className="btn btn-sm btn-muted" onClick={cancelEdit}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={repo.id}>
                <td className={styles.nameCell}>{repo.name}</td>
                <td className={styles.pathCell}>{repo.path}</td>
                <td>
                  <span className={`badge badge-${repo.ai_type === 'claude' ? 'claude' : repo.ai_type === 'copilot' ? 'copilot' : 'custom'}`}>
                    {repo.ai_type}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button className="btn btn-sm btn-link" onClick={() => startEdit(repo)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(repo.id)}>Delete</button>
                </td>
              </tr>
            ),
          )}
          {editingId === '__new' && (
            <tr>
              <td><input className="f-input f-mono" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="my-repo" autoFocus /></td>
              <td><input className="f-input f-mono" value={editPath} onChange={(e) => setEditPath(e.target.value)} placeholder="/home/user/project" /></td>
              <td>
                <select className="f-select" value={editAiType} onChange={(e) => setEditAiType(e.target.value)}>
                  {cliConfigs.map((c) => <option key={c.cli_name} value={c.cli_name}>{c.cli_name}</option>)}
                </select>
              </td>
              <td className={styles.actions}>
                <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>Add</button>
                <button className="btn btn-sm btn-muted" onClick={cancelEdit}>Cancel</button>
              </td>
            </tr>
          )}
          {repos.length === 0 && editingId !== '__new' && (
            <tr>
              <td className={styles.emptyCell} colSpan={4}>No repos yet — click &quot;+ Add&quot; to create one.</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
