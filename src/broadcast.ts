import { wsManager } from './websocket.js';
import type { Execution, PoolStats } from './types.js';

export function broadcastExecutionCreated(execution: Execution): void {
  wsManager.broadcast({ type: 'execution-created', execution });
}

export function broadcastExecutionStarted(execution: Execution): void {
  wsManager.broadcast({
    type: 'execution-started',
    executionId: execution.id,
    jobId: execution.job_id,
    pid: execution.worker_pid,
  });
}

export function broadcastExecutionOutput(
  executionId: number,
  stream: 'stdout' | 'stderr',
  chunk: string,
): void {
  wsManager.broadcast({ type: 'execution-output', executionId, stream, chunk });
}

export function broadcastExecutionCompleted(execution: Execution): void {
  wsManager.broadcast({
    type: 'execution-completed',
    execution,
    exitCode: execution.exit_code,
  });
}

export function broadcastExecutionFailed(execution: Execution, error?: string): void {
  wsManager.broadcast({
    type: 'execution-failed',
    execution,
    exitCode: execution.exit_code,
    error,
  });
}

export function broadcastExecutionCancelled(executionId: number): void {
  wsManager.broadcast({ type: 'execution-cancelled', executionId });
}

export function broadcastCronStatus(enabled: boolean): void {
  wsManager.broadcast({ type: 'cron-status-changed', enabled });
}

export function broadcastSettingsChanged(key: string, value: unknown): void {
  wsManager.broadcast({ type: 'settings-changed', key, value });
}

export function broadcastJobUpdated(job: object): void {
  wsManager.broadcast({ type: 'job-updated', job });
}

export function broadcastPoolStats(stats: PoolStats): void {
  wsManager.broadcast({ type: 'worker-pool-stats', ...stats });
}
