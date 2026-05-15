import { Router } from 'express';
import Database from 'better-sqlite3';
import type { Cron } from '../types.js';
import type { CronScheduler } from '../queue/cron-scheduler.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors.js';

function parseCronRow(row: Record<string, unknown>): Cron {
  const { job_ids_csv, enabled, job_count, ...rest } = row;
  return {
    ...(rest as unknown as Cron),
    enabled: Boolean(enabled),
    job_count: (job_count as number) ?? 0,
    job_ids: job_ids_csv ? (job_ids_csv as string).split(',').map(Number) : [],
  };
}

function getCrons(db: Database.Database): Cron[] {
  const rows = db
    .prepare(
      `SELECT c.*, COUNT(cj.job_id) as job_count,
              GROUP_CONCAT(cj.job_id) as job_ids_csv
       FROM crons c
       LEFT JOIN cron_jobs cj ON cj.cron_id = c.id
       GROUP BY c.id
       ORDER BY c.name`,
    )
    .all() as Record<string, unknown>[];
  return rows.map(parseCronRow);
}

function getCron(db: Database.Database, id: number): Cron | undefined {
  const row = db
    .prepare(
      `SELECT c.*, COUNT(cj.job_id) as job_count,
              GROUP_CONCAT(cj.job_id) as job_ids_csv
       FROM crons c
       LEFT JOIN cron_jobs cj ON cj.cron_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
    )
    .get(id) as Record<string, unknown> | undefined;
  return row ? parseCronRow(row) : undefined;
}

export function createCronsRouter(db: Database.Database, scheduler: CronScheduler): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(getCrons(db));
  });

  router.get('/:id', (req, res) => {
    const cron = getCron(db, Number(req.params.id));
    if (!cron) throw new NotFoundError('Cron not found');
    res.json(cron);
  });

  router.post('/', (req, res) => {
    const { name, expression, enabled } = req.body;
    if (!name?.trim()) throw new ValidationError('name is required');
    if (!expression?.trim()) throw new ValidationError('expression is required');

    const existing = db.prepare('SELECT id FROM crons WHERE name = ?').get(name.trim());
    if (existing) throw new ConflictError(`Cron "${name}" already exists`);

    const result = db
      .prepare(
        `INSERT INTO crons (name, expression, enabled) VALUES (?, ?, ?)`,
      )
      .run(name.trim(), expression.trim(), enabled !== false ? 1 : 0);

    const cron = getCron(db, Number(result.lastInsertRowid))!;
    scheduler.syncCron(cron);
    res.status(201).json(cron);
  });

  router.put('/:id', (req, res) => {
    const cron = getCron(db, Number(req.params.id));
    if (!cron) throw new NotFoundError('Cron not found');

    const { name, expression, enabled } = req.body;
    if (name !== undefined && !name.trim()) throw new ValidationError('name cannot be empty');

    if (name && name.trim() !== cron.name) {
      const dup = db.prepare('SELECT id FROM crons WHERE name = ? AND id != ?').get(name.trim(), cron.id);
      if (dup) throw new ConflictError(`Cron "${name}" already exists`);
    }

    db.prepare(
      `UPDATE crons SET name = ?, expression = ?, enabled = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(
      name?.trim() ?? cron.name,
      expression?.trim() ?? cron.expression,
      enabled !== undefined ? (enabled ? 1 : 0) : (cron.enabled ? 1 : 0),
      cron.id,
    );

    const updated = getCron(db, cron.id)!;
    scheduler.syncCron(updated);
    res.json(updated);
  });

  router.delete('/:id', (req, res) => {
    const cron = getCron(db, Number(req.params.id));
    if (!cron) throw new NotFoundError('Cron not found');
    scheduler.removeCron(cron.id);
    db.prepare('DELETE FROM crons WHERE id = ?').run(cron.id);
    res.json({ success: true });
  });

  router.post('/:id/toggle', (req, res) => {
    const cron = getCron(db, Number(req.params.id));
    if (!cron) throw new NotFoundError('Cron not found');
    db.prepare("UPDATE crons SET enabled = ?, updated_at = datetime('now') WHERE id = ?")
      .run(cron.enabled ? 0 : 1, cron.id);
    const updated = getCron(db, cron.id)!;
    scheduler.syncCron(updated);
    res.json(updated);
  });

  router.post('/:id/jobs', (req, res) => {
    const cron = getCron(db, Number(req.params.id));
    if (!cron) throw new NotFoundError('Cron not found');

    const { job_id } = req.body;
    if (!job_id) throw new ValidationError('job_id is required');

    const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(Number(job_id));
    if (!job) throw new NotFoundError('Job not found');

    const exists = db
      .prepare('SELECT id FROM cron_jobs WHERE cron_id = ? AND job_id = ?')
      .get(cron.id, Number(job_id));
    if (exists) throw new ConflictError('Job already mapped to this cron');

    db.prepare('INSERT INTO cron_jobs (cron_id, job_id) VALUES (?, ?)').run(cron.id, Number(job_id));
    res.status(201).json(getCron(db, cron.id)!);
  });

  router.delete('/:id/jobs/:jobId', (req, res) => {
    const cron = getCron(db, Number(req.params.id));
    if (!cron) throw new NotFoundError('Cron not found');
    db.prepare('DELETE FROM cron_jobs WHERE cron_id = ? AND job_id = ?')
      .run(cron.id, Number(req.params.jobId));
    res.json(getCron(db, cron.id)!);
  });

  return router;
}
