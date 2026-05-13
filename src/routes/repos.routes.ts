import { Router } from 'express';
import Database from 'better-sqlite3';
import { NotFoundError, ValidationError, ConflictError } from '../errors.js';

interface Repo {
  id: number;
  name: string;
  path: string;
  ai_type: 'claude' | 'copilot';
  created_at: string;
  updated_at: string;
}

export function createReposRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const repos = db.prepare('SELECT * FROM repos ORDER BY name').all() as Repo[];
    res.json(repos);
  });

  router.get('/:id', (req, res) => {
    const repo = db.prepare('SELECT * FROM repos WHERE id = ?').get(Number(req.params.id)) as Repo | undefined;
    if (!repo) throw new NotFoundError('Repo not found');
    res.json(repo);
  });

  router.post('/', (req, res) => {
    const { name, path, ai_type } = req.body;

    if (!name?.trim()) throw new ValidationError('name is required');
    if (!path?.trim()) throw new ValidationError('path is required');
    if (!['claude', 'copilot'].includes(ai_type)) throw new ValidationError('ai_type must be "claude" or "copilot"');

    const existing = db.prepare('SELECT id FROM repos WHERE name = ?').get(name.trim());
    if (existing) throw new ConflictError(`Repo "${name}" already exists`);

    const result = db
      .prepare('INSERT INTO repos (name, path, ai_type) VALUES (?, ?, ?)')
      .run(name.trim(), path.trim(), ai_type);

    const repo = db.prepare('SELECT * FROM repos WHERE id = ?').get(result.lastInsertRowid) as Repo;
    res.status(201).json(repo);
  });

  router.put('/:id', (req, res) => {
    const repo = db.prepare('SELECT * FROM repos WHERE id = ?').get(Number(req.params.id)) as Repo | undefined;
    if (!repo) throw new NotFoundError('Repo not found');

    const { name, path, ai_type } = req.body;

    if (name !== undefined && !name.trim()) throw new ValidationError('name cannot be empty');

    if (name && name.trim() !== repo.name) {
      const existing = db
        .prepare('SELECT id FROM repos WHERE name = ? AND id != ?')
        .get(name.trim(), repo.id);
      if (existing) throw new ConflictError(`Repo "${name}" already exists`);
    }

    if (ai_type !== undefined && !['claude', 'copilot'].includes(ai_type)) {
      throw new ValidationError('ai_type must be "claude" or "copilot"');
    }

    const updatedName = name?.trim() ?? repo.name;
    const updatedPath = path?.trim() ?? repo.path;
    const updatedAiType = ai_type ?? repo.ai_type;

    db.prepare(
      "UPDATE repos SET name = ?, path = ?, ai_type = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(updatedName, updatedPath, updatedAiType, repo.id);

    const updated = db.prepare('SELECT * FROM repos WHERE id = ?').get(repo.id) as Repo;
    res.json(updated);
  });

  router.delete('/:id', (req, res) => {
    const repo = db.prepare('SELECT * FROM repos WHERE id = ?').get(Number(req.params.id)) as Repo | undefined;
    if (!repo) throw new NotFoundError('Repo not found');

    // Set repo_id to null for jobs referencing this repo before deleting
    db.prepare('UPDATE jobs SET repo_id = NULL WHERE repo_id = ?').run(repo.id);
    db.prepare('DELETE FROM repos WHERE id = ?').run(repo.id);

    res.json({ success: true });
  });

  return router;
}
