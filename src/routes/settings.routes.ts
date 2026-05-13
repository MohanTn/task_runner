import { Router } from 'express';
import Database from 'better-sqlite3';
import type { Settings } from '../types.js';
import { broadcastSettingsChanged } from '../broadcast.js';
import type { WorkerPool } from '../queue/worker-pool.js';
import type { CronScheduler } from '../queue/cron-scheduler.js';

function parseSettings(db: Database.Database): Settings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as {
    key: string;
    value: string;
  }[];
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }
  return settings as unknown as Settings;
}

export function createSettingsRouter(
  db: Database.Database,
  workerPool: WorkerPool,
  cronScheduler: CronScheduler,
): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(parseSettings(db));
  });

  router.put('/', (req, res) => {
    const body = req.body as Partial<Settings>;
    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    );

    for (const [key, value] of Object.entries(body)) {
      upsert.run(key, JSON.stringify(value));
      broadcastSettingsChanged(key, value);
    }

    if (body.max_parallel_workers !== undefined) {
      workerPool.setMaxParallel(body.max_parallel_workers);
    }

    if (body.cron_enabled !== undefined) {
      if (body.cron_enabled) {
        cronScheduler.start();
      } else {
        cronScheduler.stop();
      }
    }

    if (body.wsl_mode !== undefined) {
      workerPool.setWslMode(body.wsl_mode);
    }

    if (body.cron_expression !== undefined) {
      cronScheduler.setExpression(body.cron_expression);
    }

    res.json(parseSettings(db));
  });

  return router;
}
