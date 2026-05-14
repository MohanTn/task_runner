import { EventEmitter } from 'events';
import { CronJob } from 'cron';
import Database from 'better-sqlite3';
import type { Job, Cron } from '../types.js';
import { launchInWindowsTerminal } from './wt-launcher.js';

export class CronScheduler extends EventEmitter {
  private cronJobs: Map<number, CronJob> = new Map();
  private running: boolean = false;
  private db: Database.Database;

  constructor(db: Database.Database) {
    super();
    this.db = db;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const crons = this.db
      .prepare('SELECT * FROM crons WHERE enabled = 1')
      .all() as Cron[];
    for (const cron of crons) this.scheduleCron(cron);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    for (const cj of this.cronJobs.values()) cj.stop();
    this.cronJobs.clear();
  }

  syncCron(cron: Cron): void {
    this.unscheduleCron(cron.id);
    if (this.running && cron.enabled) this.scheduleCron(cron);
  }

  removeCron(cronId: number): void {
    this.unscheduleCron(cronId);
  }

  isRunning(): boolean {
    return this.running;
  }

  activeJobCount(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as c FROM jobs WHERE enabled = 1')
      .get() as { c: number };
    return row.c;
  }

  scheduledCronCount(): number {
    return this.cronJobs.size;
  }

  destroy(): void {
    this.stop();
    this.removeAllListeners();
  }

  private scheduleCron(cron: Cron): void {
    try {
      const cj = new CronJob(
        cron.expression,
        () => this.onTick(cron.id),
        null,
        true,
        'UTC',
      );
      this.cronJobs.set(cron.id, cj);
    } catch {
      console.warn(`[cron] Invalid expression for cron "${cron.name}": ${cron.expression}`);
    }
  }

  private unscheduleCron(cronId: number): void {
    const existing = this.cronJobs.get(cronId);
    if (existing) {
      existing.stop();
      this.cronJobs.delete(cronId);
    }
  }

  private onTick(cronId: number): void {
    if (!this.running) return;
    const jobs = this.db
      .prepare(
        `SELECT j.* FROM jobs j
         INNER JOIN cron_jobs cj ON cj.job_id = j.id
         WHERE cj.cron_id = ? AND j.enabled = 1`,
      )
      .all(cronId) as Job[];

    const disableJob = this.db.prepare(
      "UPDATE jobs SET enabled = 0, updated_at = datetime('now') WHERE id = ?",
    );

    for (const job of jobs) {
      launchInWindowsTerminal(job.repo_path, job.command, job.name).catch((err) => {
        console.error(`[cron] Failed to launch job "${job.name}": ${err.message}`);
      });
      if (job.run_mode === 'single') disableJob.run(job.id);
    }
  }
}
