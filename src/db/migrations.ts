import Database from 'better-sqlite3';

const SCHEMA_VERSION = 3;

export function runMigrations(db: Database.Database): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  if (currentVersion >= SCHEMA_VERSION) return;

  if (currentVersion < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        repo_path TEXT NOT NULL,
        command TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        timeout_seconds INTEGER NOT NULL DEFAULT 1800,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending','running','completed','failed','cancelled')),
        exit_code INTEGER,
        output TEXT NOT NULL DEFAULT '',
        error_output TEXT NOT NULL DEFAULT '',
        started_at TEXT,
        completed_at TEXT,
        triggered_by TEXT NOT NULL DEFAULT 'cron'
          CHECK (triggered_by IN ('cron','manual')),
        worker_pid INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_executions_job_id ON executions(job_id);
      CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      INSERT OR IGNORE INTO settings (key, value) VALUES ('cron_enabled', 'false');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('max_parallel_workers', '2');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('wsl_mode', '"auto"');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('keep_execution_days', '30');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('cron_expression', '"*/5 * * * *"');
    `);
  } else if (currentVersion === 1) {
    // v1 -> v2: remove cron_expression from jobs, add to settings
    const hasCol = db.prepare(
      "SELECT COUNT(*) as c FROM pragma_table_info('jobs') WHERE name='cron_expression'"
    ).get() as { c: number };
    if (hasCol.c > 0) {
      db.exec(`ALTER TABLE jobs DROP COLUMN cron_expression`);
    }
    db.prepare(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('cron_expression', '\"*/5 * * * *\"')"
    ).run();
  }

  if (currentVersion === 2) {
    // v2 -> v3: repos table, cli_configs table, repo_id + prompt on jobs
    db.exec(`
      CREATE TABLE IF NOT EXISTS repos (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL UNIQUE,
        path       TEXT NOT NULL,
        ai_type    TEXT NOT NULL DEFAULT 'claude' CHECK (ai_type IN ('claude', 'copilot')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS cli_configs (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        cli_name         TEXT NOT NULL UNIQUE,
        command_template TEXT NOT NULL,
        created_at       TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Insert default CLI configs
    const claudeExists = db.prepare(
      "SELECT COUNT(*) as c FROM cli_configs WHERE cli_name = 'claude'"
    ).get() as { c: number };
    if (claudeExists.c === 0) {
      db.prepare(
        "INSERT INTO cli_configs (cli_name, command_template) VALUES ('claude', 'claude --dangerously-skip-permissions --model haiku -p')"
      ).run();
    }

    const copilotExists = db.prepare(
      "SELECT COUNT(*) as c FROM cli_configs WHERE cli_name = 'copilot'"
    ).get() as { c: number };
    if (copilotExists.c === 0) {
      db.prepare(
        "INSERT INTO cli_configs (cli_name, command_template) VALUES ('copilot', 'copilot --yolo -m sonnet-4.5 -p')"
      ).run();
    }

    // Add columns to jobs if not present
    const hasRepoId = db.prepare(
      "SELECT COUNT(*) as c FROM pragma_table_info('jobs') WHERE name='repo_id'"
    ).get() as { c: number };
    if (hasRepoId.c === 0) {
      db.exec(`ALTER TABLE jobs ADD COLUMN repo_id INTEGER REFERENCES repos(id) ON DELETE SET NULL`);
    }

    const hasPrompt = db.prepare(
      "SELECT COUNT(*) as c FROM pragma_table_info('jobs') WHERE name='prompt'"
    ).get() as { c: number };
    if (hasPrompt.c === 0) {
      db.exec(`ALTER TABLE jobs ADD COLUMN prompt TEXT NOT NULL DEFAULT ''`);
    }
  }

  db.pragma(`user_version = ${SCHEMA_VERSION}`);
}
