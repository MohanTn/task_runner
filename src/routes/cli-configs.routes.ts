import { Router } from 'express';
import Database from 'better-sqlite3';
import { NotFoundError, ValidationError } from '../errors.js';

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

  return router;
}
