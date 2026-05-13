import { EventEmitter } from 'events';
import { CronJob } from 'cron';
import Database from 'better-sqlite3';
import type { Job } from '../types.js';
import { launchInWindowsTerminal } from './wt-launcher.js';

export class CronScheduler extends EventEmitter {
  private cronJob: CronJob | null = null;
  private running: boolean = false;
  private expression: string = '* * * * *';
  private db: Database.Database;

  constructor(db: Database.Database) {
    super();
    this.db = db;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleJob();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.unscheduleJob();
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
    const count = this.db
      .prepare('SELECT COUNT(*) as c FROM jobs WHERE enabled = 1')
      .get() as { c: number };
    return count.c;
  }

  tickOnce(): void {
    this.onTick();
  }

  destroy(): void {
    this.stop();
    this.removeAllListeners();
  }

  private scheduleJob(): void {
    try {
      this.cronJob = new CronJob(this.expression, () => this.onTick(), null, true, 'UTC');
    } catch {
      this.expression = '* * * * *';
      this.cronJob = new CronJob(this.expression, () => this.onTick(), null, true, 'UTC');
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

    const disableJob = this.db.prepare(
      `UPDATE jobs SET enabled = 0, updated_at = datetime('now') WHERE id = ?`,
    );

    for (const job of jobs) {
      launchInWindowsTerminal(job.repo_path, job.command, job.name).catch((err) => {
        console.error(`[cron] Failed to launch job "${job.name}": ${err.message}`);
      });
      if (job.run_mode === 'single') {
        disableJob.run(job.id);
      }
    }
  }
}
