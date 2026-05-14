import type { Cron } from '../../types/crons.js';
import type { Job } from '../../types/jobs.js';
import { CronJobMapping } from './CronJobMapping.js';
import styles from './CronsManager.module.css';

export function CronRow({ cron, jobs, onEdit, onToggle, onDelete, onChanged }: {
  cron: Cron;
  jobs: Job[];
  onEdit: (c: Cron) => void;
  onToggle: (c: Cron) => void;
  onDelete: (c: Cron) => void;
  onChanged: () => Promise<void>;
}) {
  function handleEdit() { onEdit(cron); }
  function handleToggle() { onToggle(cron); }
  function handleDelete() { onDelete(cron); }

  const statusClass = cron.enabled ? styles.dotOn : styles.dotOff;
  const statusTitle = cron.enabled ? 'Enabled' : 'Disabled';
  const toggleLabel = cron.enabled ? 'Disable' : 'Enable';

  return (
    <tr>
      <td className={styles.nameCell}>{cron.name}</td>
      <td><code className={styles.expr}>{cron.expression}</code></td>
      <td><span className={`${styles.dot} ${statusClass}`} title={statusTitle} /></td>
      <td className={styles.jobsCell}>
        <CronJobMapping cron={cron} jobs={jobs} onChanged={onChanged} compact />
      </td>
      <td className={styles.actions}>
        <button className="btn btn-sm btn-link" onClick={handleEdit}>Edit</button>
        <button className="btn btn-sm btn-link" onClick={handleToggle}>{toggleLabel}</button>
        <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>
      </td>
    </tr>
  );
}
