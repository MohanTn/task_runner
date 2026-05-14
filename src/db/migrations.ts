import Database from 'better-sqlite3';

const SCHEMA_VERSION = 11;

const JOBS_TABLE_V11 = `
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
`;

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const row = db.prepare(
    `SELECT COUNT(*) as c FROM pragma_table_info('${table}') WHERE name=?`
  ).get(column) as { c: number };
  return row.c > 0;
}

function ensureCliDefaults(db: Database.Database): void {
  const upsert = db.prepare(
    'INSERT OR IGNORE INTO cli_configs (cli_name, command_template) VALUES (?, ?)'
  );
  upsert.run('claude', 'claude --dangerously-skip-permissions --model haiku -p');
  upsert.run('copilot', 'copilot --yolo -m sonnet-4.5 -p');
}

function ensureRepoJobColumns(db: Database.Database): void {
  if (!hasColumn(db, 'jobs', 'repo_id')) {
    db.exec(`ALTER TABLE jobs ADD COLUMN repo_id INTEGER REFERENCES repos(id) ON DELETE SET NULL`);
  }
  if (!hasColumn(db, 'jobs', 'prompt')) {
    db.exec(`ALTER TABLE jobs ADD COLUMN prompt TEXT NOT NULL DEFAULT ''`);
  }
}

function createReposAndCliTables(db: Database.Database): void {
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
}

function migrateV0(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (${JOBS_TABLE_V11});
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT OR IGNORE INTO settings (key, value) VALUES ('cron_enabled', 'false');
    CREATE TABLE IF NOT EXISTS crons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      expression TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cron_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cron_id INTEGER NOT NULL REFERENCES crons(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      UNIQUE(cron_id, job_id)
    );
    CREATE TABLE IF NOT EXISTS repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      path TEXT NOT NULL,
      ai_type TEXT NOT NULL DEFAULT 'claude',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cli_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cli_name TEXT NOT NULL UNIQUE,
      command_template TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO cli_configs (cli_name, command_template)
      VALUES ('claude', 'claude --dangerously-skip-permissions --model haiku -p');
    INSERT OR IGNORE INTO cli_configs (cli_name, command_template)
      VALUES ('copilot', 'copilot --yolo -m sonnet-4.5 -p');
  `);
}

function migrateV1(db: Database.Database): void {
  if (hasColumn(db, 'jobs', 'cron_expression')) {
    db.exec(`ALTER TABLE jobs DROP COLUMN cron_expression`);
  }
  db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES ('cron_expression', '\"*/5 * * * *\"')"
  ).run();
}

function migrateV2(db: Database.Database): void {
  createReposAndCliTables(db);
  ensureCliDefaults(db);
  ensureRepoJobColumns(db);
}

function migrateV3(db: Database.Database): void {
  createReposAndCliTables(db);
  ensureCliDefaults(db);
  ensureRepoJobColumns(db);
}

function migrateV4(db: Database.Database): void {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE repos_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      path TEXT NOT NULL,
      ai_type TEXT NOT NULL DEFAULT 'claude',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO repos_new SELECT * FROM repos;
    DROP TABLE repos;
    ALTER TABLE repos_new RENAME TO repos;
    PRAGMA foreign_keys = ON;
  `);
}

function migrateV5(db: Database.Database): void {
  if (!hasColumn(db, 'jobs', 'schedule_type')) {
    db.exec(`ALTER TABLE jobs ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'manual'
             CHECK (schedule_type IN ('manual','cron'))`);
  }
}

function migrateV6(db: Database.Database): void {
  if (!hasColumn(db, 'jobs', 'run_mode')) {
    db.exec(`ALTER TABLE jobs ADD COLUMN run_mode TEXT NOT NULL DEFAULT 'multiple'
             CHECK (run_mode IN ('single','multiple'))`);
  }
}

function migrateV7(db: Database.Database): void {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE jobs_new (${JOBS_TABLE_V11});
    INSERT INTO jobs_new (id, name, repo_path, command, enabled, timeout_seconds,
                          run_mode, repo_id, prompt, created_at, updated_at)
      SELECT id, name, repo_path, command, enabled, timeout_seconds,
             run_mode, repo_id, prompt, created_at, updated_at FROM jobs;
    DROP TABLE jobs;
    ALTER TABLE jobs_new RENAME TO jobs;
    PRAGMA foreign_keys = ON;
  `);
}

function migrateV8(db: Database.Database): void {
  db.exec(`DROP TABLE IF EXISTS executions`);
}

function migrateV9(db: Database.Database): void {
  if (!hasColumn(db, 'jobs', 'cron_expression')) {
    db.exec(`ALTER TABLE jobs ADD COLUMN cron_expression TEXT NOT NULL DEFAULT ''`);
  }
  db.prepare("DELETE FROM settings WHERE key = 'cron_expression'").run();
}

function migrateV10(db: Database.Database): void {
  if (hasColumn(db, 'jobs', 'cron_expression')) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE jobs_v11 (${JOBS_TABLE_V11});
      INSERT INTO jobs_v11 (id, name, repo_path, command, enabled, timeout_seconds,
                            run_mode, repo_id, prompt, created_at, updated_at)
        SELECT id, name, repo_path, command, enabled, timeout_seconds,
               run_mode, repo_id, prompt, created_at, updated_at FROM jobs;
      DROP TABLE jobs;
      ALTER TABLE jobs_v11 RENAME TO jobs;
      PRAGMA foreign_keys = ON;
    `);
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS crons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      expression TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cron_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cron_id INTEGER NOT NULL REFERENCES crons(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      UNIQUE(cron_id, job_id)
    );
  `);
}

const STEP_MAP: Record<number, (db: Database.Database) => void> = {
  1: migrateV1,
  2: migrateV2,
  3: migrateV3,
  4: migrateV4,
  5: migrateV5,
  6: migrateV6,
  7: migrateV7,
  8: migrateV8,
  9: migrateV9,
  10: migrateV10,
};

export function runMigrations(db: Database.Database): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;
  if (currentVersion >= SCHEMA_VERSION) return;

  if (currentVersion < 1) {
    migrateV0(db);
  } else {
    for (let v = currentVersion; v < SCHEMA_VERSION; v++) {
      STEP_MAP[v]?.(db);
    }
  }

  db.pragma(`user_version = ${SCHEMA_VERSION}`);
}
