import { useState } from 'react';
import type { Cron } from '../../types/crons.js';
import type { Job } from '../../types/jobs.js';
import { cronApi } from '../../api/crons.api.js';
import { CronEditorModal } from './CronEditorModal.js';
import { CronRow } from './CronRow.js';
import styles from './CronsManager.module.css';

interface ManagerState { editing: Cron | 'new' | null; }

function useCronsManager(onChanged: () => Promise<void>) {
  const [state, setState] = useState<ManagerState>({ editing: null });

  function openNew() { setState({ editing: 'new' }); }
  function closeEditor() { setState({ editing: null }); }
  function handleEdit(cron: Cron) { setState({ editing: cron }); }

  async function handleSave(name: string, expression: string) {
    if (state.editing === 'new') await cronApi.create({ name, expression });
    else if (state.editing) await cronApi.update(state.editing.id, { name, expression });
    setState({ editing: null });
    await onChanged();
  }
  async function handleToggle(cron: Cron) { await cronApi.toggle(cron.id); await onChanged(); }
  async function handleDelete(cron: Cron) {
    if (!confirm(`Delete cron "${cron.name}"?`)) return;
    await cronApi.remove(cron.id);
    await onChanged();
  }

  return { state, openNew, closeEditor, handleEdit, handleSave, handleToggle, handleDelete };
}

export function CronsManager({ crons, jobs, cronEnabled, onCronToggle, onChanged }: {
  crons: Cron[];
  jobs: Job[];
  cronEnabled: boolean;
  onCronToggle: () => void;
  onChanged: () => Promise<void>;
}) {
  const mgr = useCronsManager(onChanged);
  const editingCron = mgr.state.editing === 'new' ? undefined : mgr.state.editing ?? undefined;
  const toggleClass = `btn btn-sm ${cronEnabled ? 'btn-on' : 'btn-off'}`;
  const toggleLabel = cronEnabled ? 'Running' : 'Stopped';

  return (
    <>
      <div className="section-head">
        <span className="section-title">Scheduler</span>
        <div className={styles.headerActions}>
          <button className={toggleClass} onClick={onCronToggle}>{toggleLabel}</button>
          <button className="btn btn-sm btn-ghost" onClick={mgr.openNew}>+ Add Cron</button>
        </div>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Schedule</th>
            <th>Status</th>
            <th>Linked Jobs</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {crons.map((cron) => (
            <CronRow
              key={cron.id}
              cron={cron}
              jobs={jobs}
              onEdit={mgr.handleEdit}
              onToggle={mgr.handleToggle}
              onDelete={mgr.handleDelete}
              onChanged={onChanged}
            />
          ))}
          {crons.length === 0 && (
            <tr>
              <td className={styles.emptyCell} colSpan={5}>
                No crons yet — click &quot;+ Add Cron&quot; to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {mgr.state.editing !== null && (
        <CronEditorModal cron={editingCron} onSave={mgr.handleSave} onCancel={mgr.closeEditor} />
      )}
    </>
  );
}
