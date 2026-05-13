import Database from 'better-sqlite3';
import type { Execution, Job } from '../types.js';
import { Worker } from './worker.js';
import { broadcastPoolStats, broadcastExecutionCancelled } from '../broadcast.js';
import type { WSLMode } from './terminal-spawner.js';

export class WorkerPool {
  private activeWorkers: Map<number, Worker> = new Map();
  private pendingQueue: Execution[] = [];
  private maxParallel: number = 2;
  private db: Database.Database;
  private wslMode: WSLMode = 'auto';

  constructor(db: Database.Database) {
    this.db = db;
  }

  setMaxParallel(n: number): void {
    this.maxParallel = Math.max(1, Math.min(50, n));
    this.processQueue();
  }

  setWslMode(mode: WSLMode): void {
    this.wslMode = mode;
  }

  enqueue(execution: Execution): void {
    this.pendingQueue.push(execution);
    this.processQueue();
  }

  enqueueMany(executions: Execution[]): void {
    this.pendingQueue.push(...executions);
    this.processQueue();
  }

  cancelExecution(executionId: number): void {
    const worker = this.activeWorkers.get(executionId);
    if (worker) {
      worker.abort();
      this.activeWorkers.delete(executionId);
      broadcastExecutionCancelled(executionId);
      this.processQueue();
      return;
    }

    const idx = this.pendingQueue.findIndex((e) => e.id === executionId);
    if (idx !== -1) {
      this.pendingQueue.splice(idx, 1);
      this.db
        .prepare(
          `UPDATE executions SET status = 'cancelled', completed_at = datetime('now') WHERE id = ?`,
        )
        .run(executionId);
      broadcastExecutionCancelled(executionId);
    }
  }

  writeStdin(executionId: number, input: string): void {
    const worker = this.activeWorkers.get(executionId);
    if (worker) {
      worker.writeStdin(input);
    }
  }

  cancelAll(): void {
    for (const [id, worker] of this.activeWorkers) {
      worker.abort();
      broadcastExecutionCancelled(id);
    }
    this.activeWorkers.clear();
    this.pendingQueue = [];
    this.broadcastStats();
  }

  getStats() {
    return {
      active: this.activeWorkers.size,
      pending: this.pendingQueue.length,
      maxParallel: this.maxParallel,
    };
  }

  shutdown(): void {
    this.cancelAll();
  }

  private processQueue(): void {
    while (this.pendingQueue.length > 0 && this.activeWorkers.size < this.maxParallel) {
      const execution = this.pendingQueue.shift()!;

      const job = this.db
        .prepare('SELECT * FROM jobs WHERE id = ?')
        .get(execution.job_id) as Job | undefined;

      if (!job) {
        this.db
          .prepare(
            `UPDATE executions SET status = 'failed', error_output = 'Job not found',
             completed_at = datetime('now') WHERE id = ?`,
          )
          .run(execution.id);
        continue;
      }

      const worker = new Worker(
        execution,
        job,
        this.db,
        this.wslMode,
        (execId) => this.onWorkerComplete(execId),
      );

      this.activeWorkers.set(execution.id, worker);
      worker.start();
    }

    this.broadcastStats();
  }

  private onWorkerComplete(executionId: number): void {
    this.activeWorkers.delete(executionId);
    this.processQueue();
  }

  private broadcastStats(): void {
    broadcastPoolStats(this.getStats());
  }
}
