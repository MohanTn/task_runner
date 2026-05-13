import { Router } from 'express';
import Database from 'better-sqlite3';
import type { Job } from '../types.js';
import type { CronScheduler } from '../queue/cron-scheduler.js';
import type { WorkerPool } from '../queue/worker-pool.js';

export function createControlRouter(
  db: Database.Database,
  cronScheduler: CronScheduler,
  workerPool: WorkerPool,
): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    const cronRunning = cronScheduler.isRunning();
    const poolStats = workerPool.getStats();

    res.json({
      status: 'ok',
      uptime: process.uptime(),
      cron: { running: cronRunning, jobs: cronScheduler.activeJobCount() },
      worker: poolStats,
    });
  });

  router.post('/cron/start', (_req, res) => {
    cronScheduler.start();
    db.prepare(`UPDATE settings SET value = 'true' WHERE key = 'cron_enabled'`).run();
    res.json({ success: true, cron_running: true });
  });

  router.post('/cron/stop', (_req, res) => {
    cronScheduler.stop();
    db.prepare(`UPDATE settings SET value = 'false' WHERE key = 'cron_enabled'`).run();
    res.json({ success: true, cron_running: false });
  });

  router.post('/worker/cancel-all', (_req, res) => {
    workerPool.cancelAll();
    res.json({ success: true });
  });

  return router;
}
