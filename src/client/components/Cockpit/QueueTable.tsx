import type { Execution } from '../../types/executions.js';
import { StatusBadge } from '../Common/StatusBadge.js';
import styles from './QueueTable.module.css';

interface QueueTableProps {
  executions: Execution[];
  onShowOutput: (exec: Execution) => void;
}

export function QueueTable({ executions, onShowOutput }: QueueTableProps) {
  const recent = executions.slice(0, 20);

  return (
    <div>
      <h3 className={styles.title}>Queue</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Time</th>
            <th>Job</th>
            <th>Status</th>
            <th>Exit</th>
            <th>Trigger</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((exec) => (
            <tr key={exec.id}>
              <td className={styles.timeCell}>
                {exec.created_at ? new Date(exec.created_at).toLocaleTimeString() : '-'}
              </td>
              <td className={styles.jobCell}>Job #{exec.job_id}</td>
              <td><StatusBadge status={exec.status} /></td>
              <td className={styles.exitCell}>{exec.exit_code ?? '-'}</td>
              <td className={styles.triggerCell}>{exec.triggered_by}</td>
              <td>
                <button className={styles.linkBtn} onClick={() => onShowOutput(exec)}>Output</button>
              </td>
            </tr>
          ))}
          {recent.length === 0 && (
            <tr>
              <td className={styles.emptyCell} colSpan={6}>No executions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
