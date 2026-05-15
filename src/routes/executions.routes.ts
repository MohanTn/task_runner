import { Router } from 'express';
import Database from 'better-sqlite3';
import type { Job } from '../types.js';
import { NotFoundError, ValidationError, AppError } from '../errors.js';
import { launchInWindowsTerminal } from '../queue/wt-launcher.js';

function getBaseCommand(db: Database.Database, job: Job): string {
  if (job.repo_id) {
    const repo = db.prepare('SELECT ai_type FROM repos WHERE id = ?').get(job.repo_id) as
      | { ai_type: string }
      | undefined;
    if (repo) {
      const config = db
        .prepare('SELECT command_template FROM cli_configs WHERE cli_name = ?')
        .get(repo.ai_type) as { command_template: string } | undefined;
      if (config) return config.command_template;
    }
  }
  return job.command;
}

export function createExecutionsRouter(db: Database.Database): Router {
  const router = Router();

  router.post('/trigger', async (req, res, next) => {
    try {
      const { job_id } = req.body;
      if (!job_id) throw new ValidationError('job_id is required');

      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(Number(job_id)) as Job | undefined;
      if (!job) throw new NotFoundError('Job not found');

      const baseCommand = getBaseCommand(db, job);
      await launchInWindowsTerminal(job.repo_path, baseCommand, job.prompt || '', job.name);

      if (job.run_mode === 'single') {
        db.prepare(`UPDATE jobs SET enabled = 0, updated_at = datetime('now') WHERE id = ?`).run(job.id);
      }

      res.json({ launched: true });
    } catch (err) {
      if (err instanceof ValidationError || err instanceof NotFoundError || err instanceof AppError) {
        next(err);
      } else {
        next(new AppError(err instanceof Error ? err.message : String(err), 500));
      }
    }
  });

  return router;
}
