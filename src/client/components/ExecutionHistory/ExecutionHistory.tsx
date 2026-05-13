import { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../../state/AppState.js';
import { StatusBadge } from '../Common/StatusBadge.js';
import { ConfirmDialog } from '../Common/ConfirmDialog.js';
import { ExecutionOutput } from './ExecutionOutput.js';
import { executionApi } from '../../api/executions.api.js';
import type { Execution } from '../../types/executions.js';
import styles from './ExecutionHistory.module.css';

export function ExecutionHistory() {
  const { jobs } = useAppState();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterJob, setFilterJob] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [selectedExec, setSelectedExec] = useState<Execution | null>(null);
  const [showPrune, setShowPrune] = useState(false);

  const limit = 25;

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit, offset: page * limit };
      if (filterJob) params.job_id = filterJob;
      if (filterStatus) params.status = filterStatus;
      const data = await executionApi.list(params);
      setExecutions(data.executions);
      setTotal(data.total);
    } catch {
      setExecutions([]);
    } finally {
      setLoading(false);
    }
  }, [filterJob, filterStatus, page]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const handlePrune = async () => {
    await executionApi.prune(30);
    setShowPrune(false);
    await fetchExecutions();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Execution History</h1>
        <button className={styles.pruneBtn} onClick={() => setShowPrune(true)}>
          Prune Old
        </button>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.select}
          value={filterJob}
          onChange={(e) => { setFilterJob(e.target.value ? Number(e.target.value) : ''); setPage(0); }}
        >
          <option value="">All Jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.name}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <span className={styles.count}>{total} total</span>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : executions.length === 0 ? (
        <p className={styles.empty}>No executions found</p>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Job</span>
            <span>Status</span>
            <span>Started</span>
            <span>Duration</span>
            <span>Trigger</span>
            <span>Exit</span>
            <span>Actions</span>
          </div>
          {executions.map((exec) => {
            const job = jobs.find((j) => j.id === exec.job_id);
            const started = exec.started_at ? new Date(exec.started_at) : null;
            const completed = exec.completed_at ? new Date(exec.completed_at) : null;
            const duration =
              started && completed
                ? `${Math.round((completed.getTime() - started.getTime()) / 1000)}s`
                : '-';

            return (
              <div key={exec.id} className={styles.tableRow}>
                <span className={styles.jobName}>{job?.name ?? `Job #${exec.job_id}`}</span>
                <span><StatusBadge status={exec.status} /></span>
                <span className={styles.muted}>
                  {started ? started.toLocaleString() : '-'}
                </span>
                <span className={styles.muted}>{duration}</span>
                <span className={styles.muted}>{exec.triggered_by}</span>
                <span className={styles.muted}>{exec.exit_code ?? '-'}</span>
                <span>
                  <button
                    className={styles.viewBtn}
                    onClick={() => setSelectedExec(exec)}
                  >
                    Output
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {selectedExec && (
        <ExecutionOutput execution={selectedExec} onClose={() => setSelectedExec(null)} />
      )}

      {showPrune && (
        <ConfirmDialog
          title="Prune Old Executions"
          message="Delete execution records older than 30 days?"
          confirmLabel="Prune"
          danger
          onConfirm={handlePrune}
          onCancel={() => setShowPrune(false)}
        />
      )}
    </div>
  );
}
