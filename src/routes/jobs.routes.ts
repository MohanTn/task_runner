import { Router } from 'express';
import Database from 'better-sqlite3';
import type { Job } from '../types.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors.js';

interface StoredJob extends Job {
  repo_id: number | null;
  prompt: string;
}

const JOB_WITH_REPO_SQL = `
  SELECT j.*, r.name AS repo_name, r.path AS repo_path, r.ai_type
  FROM jobs j
  LEFT JOIN repos r ON r.id = j.repo_id
`;

function getJobWithRepo(db: Database.Database, id: number): object | undefined {
  return db.prepare(`${JOB_WITH_REPO_SQL} WHERE j.id = ?`).get(id) as object | undefined;
}

function getAllJobsWithRepo(db: Database.Database): object[] {
  return db.prepare(`${JOB_WITH_REPO_SQL} ORDER BY j.name`).all() as object[];
}

function buildCommand(db: Database.Database, repoId: number, prompt: string): string | null {
  const repo = db.prepare('SELECT ai_type FROM repos WHERE id = ?').get(repoId) as
    | { ai_type: string }
    | undefined;
  if (!repo) return null;
  const config = db
    .prepare('SELECT command_template FROM cli_configs WHERE cli_name = ?')
    .get(repo.ai_type) as { command_template: string } | undefined;
  if (!config) return null;
  return `${config.command_template} "${prompt.trim()}"`;
}

export function createJobsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(getAllJobsWithRepo(db));
  });

  router.get('/:id', (req, res) => {
    const job = getJobWithRepo(db, Number(req.params.id));
    if (!job) throw new NotFoundError('Job not found');
    res.json(job);
  });

  router.post('/', (req, res) => {
    const { name, repo_id, repo_path, command, prompt, enabled, timeout_seconds, run_mode } =
      req.body;
    if (!name?.trim()) throw new ValidationError('name is required');

    const existing = db.prepare('SELECT id FROM jobs WHERE name = ?').get(name.trim());
    if (existing) throw new ConflictError(`Job "${name}" already exists`);

    const finalRunMode = run_mode === 'single' ? 'single' : 'multiple';
    let finalCommand: string;
    let finalRepoPath: string;
    let finalRepoId: number | null = repo_id ?? null;
    let finalPrompt = prompt ?? '';

    if (repo_id && prompt?.trim()) {
      const cmd = buildCommand(db, repo_id, prompt);
      if (!cmd) throw new ValidationError('Could not construct command from repo and prompt');
      finalCommand = cmd;
      const repo = db.prepare('SELECT path FROM repos WHERE id = ?').get(repo_id) as
        | { path: string }
        | undefined;
      if (!repo) throw new ValidationError('Repo not found');
      finalRepoPath = repo.path;
    } else if (repo_path?.trim() && command?.trim()) {
      finalRepoPath = repo_path.trim();
      finalCommand = command.trim();
      finalRepoId = null;
      finalPrompt = '';
    } else {
      throw new ValidationError('Provide either (repo_id + prompt) or (repo_path + command)');
    }

    const result = db
      .prepare(
        `INSERT INTO jobs (name, repo_path, command, repo_id, prompt, enabled, timeout_seconds, run_mode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        name.trim(),
        finalRepoPath,
        finalCommand,
        finalRepoId,
        finalPrompt,
        enabled !== false ? 1 : 0,
        timeout_seconds ?? 1800,
        finalRunMode,
      );

    res.status(201).json(getJobWithRepo(db, Number(result.lastInsertRowid))!);
  });

  router.put('/:id', (req, res) => {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(Number(req.params.id)) as
      | StoredJob
      | undefined;
    if (!job) throw new NotFoundError('Job not found');

    const { name, repo_id, repo_path, command, prompt, enabled, timeout_seconds, run_mode } =
      req.body;
    if (name !== undefined && !name.trim()) throw new ValidationError('name cannot be empty');

    if (name && name.trim() !== job.name) {
      const dup = db
        .prepare('SELECT id FROM jobs WHERE name = ? AND id != ?')
        .get(name.trim(), job.id);
      if (dup) throw new ConflictError(`Job "${name}" already exists`);
    }

    const updatedRepoId = repo_id !== undefined ? repo_id : job.repo_id;
    const updatedPrompt = prompt !== undefined ? prompt : job.prompt;
    const updatedRunMode =
      run_mode === 'single' ? 'single' : run_mode === 'multiple' ? 'multiple' : job.run_mode;

    let updatedCommand: string;
    if (command?.trim()) {
      updatedCommand = command.trim();
    } else if (updatedRepoId && updatedPrompt?.trim()) {
      updatedCommand = buildCommand(db, updatedRepoId, updatedPrompt) ?? job.command;
    } else {
      updatedCommand = job.command;
    }

    let updatedRepoPath: string;
    if (updatedRepoId) {
      const repo = db.prepare('SELECT path FROM repos WHERE id = ?').get(updatedRepoId) as
        | { path: string }
        | undefined;
      updatedRepoPath = repo?.path ?? job.repo_path;
    } else {
      updatedRepoPath = repo_path?.trim() ?? job.repo_path;
    }

    db.prepare(
      `UPDATE jobs SET name = ?, repo_path = ?, command = ?, repo_id = ?, prompt = ?,
       enabled = ?, timeout_seconds = ?, run_mode = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      name?.trim() ?? job.name,
      updatedRepoPath,
      updatedCommand,
      updatedRepoId,
      updatedPrompt,
      enabled !== undefined ? (enabled ? 1 : 0) : (job.enabled ? 1 : 0),
      timeout_seconds ?? job.timeout_seconds,
      updatedRunMode,
      job.id,
    );

    res.json(getJobWithRepo(db, job.id)!);
  });

  router.delete('/:id', (req, res) => {
    const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(Number(req.params.id));
    if (!job) throw new NotFoundError('Job not found');
    db.prepare('DELETE FROM jobs WHERE id = ?').run(Number(req.params.id));
    res.json({ success: true });
  });

  router.post('/:id/toggle', (req, res) => {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(Number(req.params.id)) as
      | StoredJob
      | undefined;
    if (!job) throw new NotFoundError('Job not found');
    db.prepare("UPDATE jobs SET enabled = ?, updated_at = datetime('now') WHERE id = ?").run(
      job.enabled ? 0 : 1,
      job.id,
    );
    res.json(getJobWithRepo(db, job.id)!);
  });

  return router;
}
