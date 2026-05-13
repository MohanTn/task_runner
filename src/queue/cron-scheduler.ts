import { EventEmitter } from 'events';
import { CronJob } from 'cron';
import Database from 'better-sqlite3';
import type { Job, Execution } from '../types.js';
import { broadcastExecutionCreated, broadcastCronStatus } from '../broadcast.js';

export class CronScheduler extends EventEmitter {
  private cronJob: CronJob | null = null;
  private running: boolean = false;
  private expression: string = '*/5 * * * *';
  private db: Database.Database;

  constructor(db: Database.Database) {
    super();
    this.db = db;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleJob();
    broadcastCronStatus(true);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.unscheduleJob();
    broadcastCronStatus(false);
  }

  setExpression(expr: string): void {
    this.expression = expr;
    if (this.running) {
      this.unscheduleJob();
      this.scheduleJob();
    }
  }

  getExpression(): string {
    return this.expression;
  }

  isRunning(): boolean {
    return this.running;
  }

  activeJobCount(): number {
    // Return count of enabled jobs that will fire on next tick
    const count = this.db
      .prepare('SELECT COUNT(*) as c FROM jobs WHERE enabled = 1')
      .get() as { c: number };
    return count.c;
  }

  tickOnce(): void {
    // Called from routes for manual testing
    this.onTick();
  }

  destroy(): void {
    this.stop();
    this.removeAllListeners();
  }

  private scheduleJob(): void {
    try {
      this.cronJob = new CronJob(
        this.expression,
        () => this.onTick(),
        null,
        true,
        'UTC',
      );
    } catch {
      // Invalid cron expression, try fallback
      this.expression = '*/5 * * * *';
      this.cronJob = new CronJob(
        this.expression,
        () => this.onTick(),
        null,
        true,
        'UTC',
      );
    }
  }

  private unscheduleJob(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
  }

  private onTick(): void {
    if (!this.running) return;

    const jobs = this.db
      .prepare('SELECT * FROM jobs WHERE enabled = 1')
      .all() as Job[];

    const insert = this.db.prepare(
      `INSERT INTO executions (job_id, status, triggered_by)
       VALUES (?, 'pending', 'cron')`,
    );

    for (const job of jobs) {
      const result = insert.run(job.id);
      const execution = this.db
        .prepare('SELECT * FROM executions WHERE id = ?')
        .get(result.lastInsertRowid) as Execution;

      broadcastExecutionCreated(execution);
      this.emit('execution:enqueued', execution);
    }
  }
}
