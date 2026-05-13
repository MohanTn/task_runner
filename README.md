# Task Runner

A self-hosted AI task runner with a web cockpit. Schedule and run Claude Code / GitHub Copilot CLI commands across multiple repositories — all from a single dashboard. Each job opens in its own **Windows Terminal tab** via `wt.exe`.

![Node](https://img.shields.io/badge/node-20+-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Requirements

- **Node.js 20+**
- **Windows 11 / Windows 10** with [Windows Terminal](https://aka.ms/terminal) installed
- **WSL2** — the server must run inside WSL2 so it can call `wt.exe` to open terminal tabs

---

## Quick Start

```bash
# Install dependencies
npm install

# Build and start (production)
npm run build
npm start

# Or start with hot-reload (development)
npm run dev
```

Open [http://localhost:5222](http://localhost:5222).

> **Note:** Run these commands from a WSL2 terminal, not from a Windows CMD/PowerShell session. The server needs WSL2 interop to reach `wt.exe`.

---

## How It Works

When you click **Run** on a job (or the cron scheduler fires), the server:

1. Writes a small shell script to `/tmp/task-runner-XXXXX/run.sh`
2. Calls `wt.exe nt --title "Job: name" -- bash -l /tmp/.../run.sh`
3. A new Windows Terminal tab opens, runs the job, and waits for you to press Enter before closing

No output is captured by the server — everything happens live in the terminal tab.

---

## Screens

| Tab | Description |
|---|---|
| **Cockpit** | Cron schedule config, repos table, jobs table with prompt editor, CLI tool settings |
| **Settings** | Cron scheduler toggle and expression |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5222` | HTTP server port |

### Schedule Settings (Cockpit)

- **Cron Expression** — standard 5-field cron syntax with preset picker
- **Start/Stop** — toggle the cron scheduler on and off

On each cron tick, all enabled jobs open in new Windows Terminal tabs simultaneously.

### CLI Templates (Cockpit → CLI Settings)

Default templates seeded on first run:

| CLI | Template |
|---|---|
| **claude** | `claude --dangerously-skip-permissions --model haiku -p` |
| **copilot** | `copilot --yolo -m sonnet-4.5 -p` |

The prompt text is appended at the end: `{template} "{prompt}"`. Edit these templates live from the Cockpit.

---

## Repos & Jobs

### Repos

Each repo has:
- A **name** and **filesystem path** (WSL2 path, e.g. `/home/user/projects/myapp`)
- An **AI type** (`claude` or `copilot`) — determines which CLI template is used

### Jobs

Each job has:
- **Name** — unique identifier
- **Repo** — which repo to operate on
- **Prompt** — the instruction text; the full command is auto-constructed from the repo's CLI template + prompt
- **Timeout** — not used for terminal execution (kept for future use)
- **Run mode** — `multiple` (re-enable after each run) or `single` (auto-disable after first trigger)

---

## Architecture

```
Browser (React SPA)
       │ HTTP REST
Express Server (:5222)
       │
  ┌────┴────────────┐
  │                 │
SQLite DB     Cron Scheduler
(jobs/repos/  (node-cron)
 settings)         │
                   │ wt.exe nt -- bash -l /tmp/run.sh
             Windows Terminal tab (WSL2)
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, CSS Modules, Vite |
| Backend | Express 5, TypeScript |
| Database | SQLite via better-sqlite3 |
| Scheduling | node-cron |
| Terminal | wt.exe (Windows Terminal) via WSL2 interop |

---

## API Reference

### Jobs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/jobs` | List all jobs (includes `repo_name`, `ai_type`) |
| `GET` | `/api/jobs/:id` | Get a single job |
| `POST` | `/api/jobs` | Create a job (`name` + `repo_id` + `prompt`, or `name` + `repo_path` + `command`) |
| `PUT` | `/api/jobs/:id` | Update a job |
| `DELETE` | `/api/jobs/:id` | Delete a job |
| `POST` | `/api/jobs/:id/toggle` | Enable/disable a job |

### Repos

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/repos` | List all repos |
| `POST` | `/api/repos` | Create a repo |
| `PUT` | `/api/repos/:id` | Update a repo |
| `DELETE` | `/api/repos/:id` | Delete a repo |

### Executions

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/executions/trigger` | Trigger a job (opens a new Windows Terminal tab) |

### Settings & Control

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/settings` | Get all settings |
| `PUT` | `/api/settings` | Update settings |
| `GET` | `/api/control/health` | Health check |
| `POST` | `/api/control/cron/start` | Start the cron scheduler |
| `POST` | `/api/control/cron/stop` | Stop the cron scheduler |

### CLI Configs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/cli-configs` | List all CLI tool templates |
| `PUT` | `/api/cli-configs/:cli_name` | Update a CLI template |

---

## Development

```bash
npm install
npm run dev        # API :5222 + client :5173 with hot-reload
npm run typecheck  # Type check only
npm run build      # Full production build
```

### Adding a Migration

Edit `src/db/migrations.ts`:

1. Bump `SCHEMA_VERSION`
2. Add an `if (currentVersion === N)` block with your DDL
3. Migrations run automatically on server start

---

## License

MIT
