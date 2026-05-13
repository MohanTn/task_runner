import express from 'express';
import { createServer, type Server as HttpServer } from 'http';
import path from 'path';
import fs from 'fs';
import { getDatabase } from './db/database.js';
import { CronScheduler } from './queue/cron-scheduler.js';
import { createJobsRouter } from './routes/jobs.routes.js';
import { createExecutionsRouter } from './routes/executions.routes.js';
import { createSettingsRouter } from './routes/settings.routes.js';
import { createControlRouter } from './routes/control.routes.js';
import { createReposRouter } from './routes/repos.routes.js';
import { createCliConfigsRouter } from './routes/cli-configs.routes.js';
import { NotFoundError, ValidationError, ConflictError, AppError } from './errors.js';
import { isWtAvailable } from './queue/wt-launcher.js';

export interface ServerInstance {
  httpServer: HttpServer;
  cronScheduler: CronScheduler;
  shutdown: () => Promise<void>;
}

export function buildServer(): ServerInstance {
  const app = express();
  const httpServer = createServer(app);
  const db = getDatabase();

  app.use(express.json());

  if (!isWtAvailable()) {
    console.warn('[task-runner] WARNING: Running inside Docker — wt.exe is unreachable.');
    console.warn('[task-runner] To open Windows Terminal tabs, run the server directly on WSL2: npm start');
  }

  const cronScheduler = new CronScheduler(db);

  app.use('/api/jobs', createJobsRouter(db));
  app.use('/api/executions', createExecutionsRouter(db));
  app.use('/api/settings', createSettingsRouter(db, cronScheduler));
  app.use('/api/control', createControlRouter(db, cronScheduler));
  app.use('/api/repos', createReposRouter(db));
  app.use('/api/cli-configs', createCliConfigsRouter(db));

  const clientDist = path.resolve(process.cwd(), 'dist/client');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  const settings = db
    .prepare('SELECT key, value FROM settings')
    .all() as { key: string; value: string }[];

  for (const row of settings) {
    if (row.key === 'cron_enabled' && JSON.parse(row.value) === true) {
      cronScheduler.start();
    }
    if (row.key === 'cron_expression') {
      cronScheduler.setExpression(JSON.parse(row.value));
    }
  }

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
    } else if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
    } else if (err instanceof ConflictError) {
      res.status(409).json({ error: err.message });
    } else if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  async function shutdown(): Promise<void> {
    cronScheduler.destroy();
  }

  process.on('SIGTERM', () => {
    shutdown().then(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    shutdown().then(() => process.exit(0));
  });

  return { httpServer, cronScheduler, shutdown };
}
