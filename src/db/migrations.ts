import Database from 'better-sqlite3';

const SCHEMA_VERSION = 9;

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
        run_mode TEXT NOT NULL DEFAULT 'multiple' CHECK (run_mode IN ('single','multiple')),
        repo_id INTEGER REFERENCES repos(id) ON DELETE SET NULL,
        prompt TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      INSERT OR IGNORE INTO settings (key, value) VALUES ('cron_enabled', 'false');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('cron_expression', '"* * * * *"');

      CREATE TABLE IF NOT EXISTS repos (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL UNIQUE,
        path       TEXT NOT NULL,
        ai_type    TEXT NOT NULL DEFAULT 'claude',
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

      INSERT OR IGNORE INTO cli_configs (cli_name, command_template)
        VALUES ('claude', 'claude --dangerously-skip-permissions --model haiku -p');
      INSERT OR IGNORE INTO cli_configs (cli_name, command_template)
        VALUES ('copilot', 'copilot --yolo -m sonnet-4.5 -p');
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
        ai_type    TEXT NOT NULL DEFAULT 'claude',
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

  // v3 -> v4: repair databases that were created with the buggy v1 schema
  // (missing repos, cli_configs tables, and repo_id/prompt columns on jobs)
  if (currentVersion === 3) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS repos (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL UNIQUE,
        path       TEXT NOT NULL,
        ai_type    TEXT NOT NULL DEFAULT 'claude',
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

    const claudeExists2 = db.prepare(
      "SELECT COUNT(*) as c FROM cli_configs WHERE cli_name = 'claude'"
    ).get() as { c: number };
    if (claudeExists2.c === 0) {
      db.prepare(
        "INSERT INTO cli_configs (cli_name, command_template) VALUES ('claude', 'claude --dangerously-skip-permissions --model haiku -p')"
      ).run();
    }

    const copilotExists2 = db.prepare(
      "SELECT COUNT(*) as c FROM cli_configs WHERE cli_name = 'copilot'"
    ).get() as { c: number };
    if (copilotExists2.c === 0) {
      db.prepare(
        "INSERT INTO cli_configs (cli_name, command_template) VALUES ('copilot', 'copilot --yolo -m sonnet-4.5 -p')"
      ).run();
    }

    const hasRepoId2 = db.prepare(
      "SELECT COUNT(*) as c FROM pragma_table_info('jobs') WHERE name='repo_id'"
    ).get() as { c: number };
    if (hasRepoId2.c === 0) {
      db.exec(`ALTER TABLE jobs ADD COLUMN repo_id INTEGER REFERENCES repos(id) ON DELETE SET NULL`);
    }

    const hasPrompt2 = db.prepare(
      "SELECT COUNT(*) as c FROM pragma_table_info('jobs') WHERE name='prompt'"
    ).get() as { c: number };
    if (hasPrompt2.c === 0) {
      db.exec(`ALTER TABLE jobs ADD COLUMN prompt TEXT NOT NULL DEFAULT ''`);
    }
  }

  // v4 -> v5: drop CHECK constraint on repos.ai_type to allow custom CLI configs
  if (currentVersion === 4) {
    db.exec(`
      PRAGMA foreign_keys = OFF;

      CREATE TABLE repos_new (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL UNIQUE,
        path       TEXT NOT NULL,
        ai_type    TEXT NOT NULL DEFAULT 'claude',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO repos_new SELECT * FROM repos;
      DROP TABLE repos;
      ALTER TABLE repos_new RENAME TO repos;

      PRAGMA foreign_keys = ON;
    `);
  }

  // v5 -> v6: add schedule_type per job ('manual' | 'cron')
  if (currentVersion === 5) {
    const hasScheduleType = db.prepare(
      "SELECT COUNT(*) as c FROM pragma_table_info('jobs') WHERE name='schedule_type'"
    ).get() as { c: number };
    if (hasScheduleType.c === 0) {
      db.exec(`ALTER TABLE jobs ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'manual' CHECK (schedule_type IN ('manual','cron'))`);
    }
  }

  // v6 -> v7: add run_mode per job ('single' | 'multiple')
  if (currentVersion === 6) {
    const hasRunMode = db.prepare(
      "SELECT COUNT(*) as c FROM pragma_table_info('jobs') WHERE name='run_mode'"
    ).get() as { c: number };
    if (hasRunMode.c === 0) {
      db.exec(`ALTER TABLE jobs ADD COLUMN run_mode TEXT NOT NULL DEFAULT 'multiple' CHECK (run_mode IN ('single','multiple'))`);
    }
  }

  // v7 -> v8: drop schedule_type column (run_mode is sufficient)
  if (currentVersion === 7) {
    db.exec(`
      PRAGMA foreign_keys = OFF;

      CREATE TABLE jobs_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        repo_path TEXT NOT NULL,
        command TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        timeout_seconds INTEGER NOT NULL DEFAULT 1800,
        run_mode TEXT NOT NULL DEFAULT 'multiple' CHECK (run_mode IN ('single','multiple')),
        repo_id INTEGER REFERENCES repos(id) ON DELETE SET NULL,
        prompt TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO jobs_new (id, name, repo_path, command, enabled, timeout_seconds, run_mode, repo_id, prompt, created_at, updated_at)
        SELECT id, name, repo_path, command, enabled, timeout_seconds, run_mode, repo_id, prompt, created_at, updated_at FROM jobs;

      DROP TABLE jobs;
      ALTER TABLE jobs_new RENAME TO jobs;

      PRAGMA foreign_keys = ON;
    `);
  }

  // v8 -> v9: remove executions table (jobs now launch directly in Windows Terminal)
  if (currentVersion === 8) {
    db.exec(`DROP TABLE IF EXISTS executions`);
  }

  db.pragma(`user_version = ${SCHEMA_VERSION}`);
}
