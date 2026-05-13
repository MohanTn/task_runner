import { Router } from 'express';
import Database from 'better-sqlite3';
import type { Execution, ExecutionListOptions, Job } from '../types.js';
import { NotFoundError, ValidationError } from '../errors.js';
import { broadcastExecutionCreated, broadcastJobUpdated } from '../broadcast.js';
import type { WorkerPool } from '../queue/worker-pool.js';

export function createExecutionsRouter(
  db: Database.Database,
  workerPool: WorkerPool,
): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const { job_id, status, limit, offset, from, to } = req.query as Record<string, string | undefined>;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (job_id) {
      conditions.push('job_id = ?');
      params.push(Number(job_id));
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (from) {
      conditions.push('created_at >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('created_at <= ?');
      params.push(to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitVal = Math.min(Math.max(Number(limit) || 50, 1), 500);
    const offsetVal = Math.max(Number(offset) || 0, 0);

    const executions = db
      .prepare(
        `SELECT * FROM executions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, limitVal, offsetVal) as Execution[];

    const count = db
      .prepare(`SELECT COUNT(*) as count FROM executions ${where}`)
      .get(...params) as { count: number };

    res.json({ executions, total: count.count, limit: limitVal, offset: offsetVal });
  });

  router.get('/stats', (_req, res) => {
    const stats = db
      .prepare(
        `SELECT status, COUNT(*) as count FROM executions
         GROUP BY status`,
      )
      .all() as { status: string; count: number }[];

    const result: Record<string, number> = {};
    for (const s of ['pending', 'running', 'completed', 'failed', 'cancelled']) {
      result[s] = 0;
    }
    for (const s of stats) {
      result[s.status] = s.count;
    }

    res.json(result);
  });

  router.get('/:id', (req, res) => {
    const exec = db.prepare('SELECT * FROM executions WHERE id = ?').get(Number(req.params.id)) as
      | Execution
      | undefined;
    if (!exec) throw new NotFoundError('Execution not found');
    res.json(exec);
  });

  router.get('/:id/output', (req, res) => {
    const exec = db.prepare('SELECT id, output, error_output FROM executions WHERE id = ?').get(
      Number(req.params.id),
    ) as { id: number; output: string; error_output: string } | undefined;
    if (!exec) throw new NotFoundError('Execution not found');
    res.json(exec);
  });

  router.post('/trigger', (req, res) => {
    const { job_id } = req.body;
    if (!job_id) throw new ValidationError('job_id is required');

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(Number(job_id)) as Job | undefined;
    if (!job) throw new NotFoundError('Job not found');

    const result = db
      .prepare(
        `INSERT INTO executions (job_id, status, triggered_by)
         VALUES (?, 'pending', 'manual')`,
      )
      .run(Number(job_id));

    const execution = db.prepare('SELECT * FROM executions WHERE id = ?').get(
      result.lastInsertRowid,
    ) as Execution;

    broadcastExecutionCreated(execution);
    workerPool.enqueue(execution);

    if (job.run_mode === 'single') {
      db.prepare(`UPDATE jobs SET enabled = 0, updated_at = datetime('now') WHERE id = ?`).run(job.id);
      const updated = db
        .prepare(`SELECT j.*, r.name AS repo_name, r.path AS repo_path, r.ai_type
                  FROM jobs j LEFT JOIN repos r ON r.id = j.repo_id WHERE j.id = ?`)
        .get(job.id) as object;
      broadcastJobUpdated(updated);
    }

    res.status(201).json(execution);
  });

  router.post('/:id/stdin', (req, res) => {
    const { input } = req.body;
    if (typeof input !== 'string') throw new ValidationError('input is required');

    const exec = db.prepare('SELECT * FROM executions WHERE id = ?').get(Number(req.params.id)) as
      | Execution
      | undefined;
    if (!exec) throw new NotFoundError('Execution not found');
    if (exec.status !== 'running') throw new ValidationError('Execution is not running');

    workerPool.writeStdin(exec.id, input);
    res.json({ success: true });
  });

  router.post('/:id/cancel', (req, res) => {
    const exec = db.prepare('SELECT * FROM executions WHERE id = ?').get(Number(req.params.id)) as
      | Execution
      | undefined;
    if (!exec) throw new NotFoundError('Execution not found');
    if (exec.status !== 'pending' && exec.status !== 'running') {
      throw new ValidationError(`Cannot cancel execution in status "${exec.status}"`);
    }

    workerPool.cancelExecution(exec.id);
    res.json({ success: true });
  });

  router.post('/prune', (req, res) => {
    const { olderThanDays } = req.body;
    const days = Math.max(Number(olderThanDays) || 30, 1);

    const result = db
      .prepare(
        `DELETE FROM executions WHERE created_at < datetime('now', ? || ' days')`,
      )
      .run(`-${days}`);

    res.json({ deleted: result.changes });
  });

  return router;
}
