import { useEffect, useState } from 'react';
import type { Execution } from '../../types/executions.js';
import { executionApi } from '../../api/executions.api.js';
import { StatusBadge } from '../Common/StatusBadge.js';
import styles from './ExecutionOutput.module.css';

interface ExecutionOutputProps {
  execution: Execution;
  onClose: () => void;
}

export function ExecutionOutput({ execution, onClose }: ExecutionOutputProps) {
  const [output, setOutput] = useState(execution.output || '');
  const [errorOutput, setErrorOutput] = useState(execution.error_output || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (execution.output === '' && execution.error_output === '') {
      setLoading(true);
      executionApi.getOutput(execution.id).then((data) => {
        setOutput(data.output);
        setErrorOutput(data.error_output);
      }).catch(() => {
        setOutput('Failed to load output');
      }).finally(() => setLoading(false));
    }
  }, [execution.id, execution.output, execution.error_output]);

  const handleCopy = () => {
    const text = `STDOUT:\n${output}\n\nSTDERR:\n${errorOutput}`;
    navigator.clipboard.writeText(text);
  };

  const started = execution.started_at ? new Date(execution.started_at).toLocaleString() : '-';
  const completed = execution.completed_at ? new Date(execution.completed_at).toLocaleString() : '-';
  const duration = execution.started_at && execution.completed_at
    ? `${Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)}s`
    : '-';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Execution #{execution.id}</h2>
          <div className={styles.headerMeta}>
            <StatusBadge status={execution.status} />
            {execution.exit_code !== null && (
              <span className={styles.exitCode}>Exit code: {execution.exit_code}</span>
            )}
            {execution.worker_pid && (
              <span className={styles.meta}>PID: {execution.worker_pid}</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.metaBar}>
          <span>Started: {started}</span>
          <span>Completed: {completed}</span>
          <span>Duration: {duration}</span>
          <span>Trigger: {execution.triggered_by}</span>
        </div>

        <div className={styles.outputArea}>
          <div className={styles.outputHeader}>
            <span>stdout</span>
            <button className={styles.copyBtn} onClick={handleCopy}>Copy</button>
          </div>
          <pre className={styles.output}>
            {loading ? 'Loading...' : output || '(no output)'}
          </pre>

          {errorOutput && (
            <>
              <div className={styles.outputHeader}>
                <span>stderr</span>
              </div>
              <pre className={`${styles.output} ${styles.stderr}`}>
                {errorOutput}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
