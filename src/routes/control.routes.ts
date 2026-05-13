import { Router } from 'express';
import Database from 'better-sqlite3';
import type { CronScheduler } from '../queue/cron-scheduler.js';

export function createControlRouter(
  db: Database.Database,
  cronScheduler: CronScheduler,
): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      cron: { running: cronScheduler.isRunning(), jobs: cronScheduler.activeJobCount() },
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

  return router;
}
