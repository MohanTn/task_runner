import { Router } from 'express';
import Database from 'better-sqlite3';
import { NotFoundError, ValidationError, ConflictError } from '../errors.js';

interface CliConfig {
  id: number;
  cli_name: string;
  command_template: string;
  created_at: string;
  updated_at: string;
}

export function createCliConfigsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const configs = db.prepare('SELECT * FROM cli_configs ORDER BY cli_name').all() as CliConfig[];
    res.json(configs);
  });

  router.post('/', (req, res) => {
    const { cli_name, command_template } = req.body;

    if (!cli_name?.trim()) throw new ValidationError('cli_name is required');
    if (!command_template?.trim()) throw new ValidationError('command_template is required');

    const existing = db.prepare('SELECT id FROM cli_configs WHERE cli_name = ?').get(cli_name.trim());
    if (existing) throw new ConflictError(`CLI config "${cli_name}" already exists`);

    const result = db
      .prepare('INSERT INTO cli_configs (cli_name, command_template) VALUES (?, ?)')
      .run(cli_name.trim(), command_template.trim());

    const created = db.prepare('SELECT * FROM cli_configs WHERE id = ?').get(result.lastInsertRowid) as CliConfig;
    res.status(201).json(created);
  });

  router.put('/:cli_name', (req, res) => {
    const { cli_name } = req.params;
    const { command_template } = req.body;

    const config = db.prepare('SELECT * FROM cli_configs WHERE cli_name = ?').get(cli_name) as CliConfig | undefined;
    if (!config) throw new NotFoundError(`CLI config "${cli_name}" not found`);

    if (!command_template?.trim()) throw new ValidationError('command_template is required');

    db.prepare(
      "UPDATE cli_configs SET command_template = ?, updated_at = datetime('now') WHERE cli_name = ?"
    ).run(command_template.trim(), cli_name);

    const updated = db.prepare('SELECT * FROM cli_configs WHERE cli_name = ?').get(cli_name) as CliConfig;
    res.json(updated);
  });

  router.delete('/:cli_name', (req, res) => {
    const { cli_name } = req.params;

    const config = db.prepare('SELECT * FROM cli_configs WHERE cli_name = ?').get(cli_name) as CliConfig | undefined;
    if (!config) throw new NotFoundError(`CLI config "${cli_name}" not found`);

    const reposUsing = db.prepare('SELECT COUNT(*) as c FROM repos WHERE ai_type = ?').get(cli_name) as { c: number };
    if (reposUsing.c > 0) {
      throw new ValidationError(`Cannot delete: ${reposUsing.c} repo(s) use this CLI config`);
    }

    db.prepare('DELETE FROM cli_configs WHERE cli_name = ?').run(cli_name);
    res.json({ success: true });
  });

  return router;
}
