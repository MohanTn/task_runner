# Task Runner

A self-hosted AI task runner with a web cockpit. Schedule and run Claude Code / GitHub Copilot CLI commands across multiple repositories — all from a single dashboard, with live output streaming and parallel worker pools.

![Dashboard](https://img.shields.io/badge/status-active-success)
![Node](https://img.shields.io/badge/node-20+-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Features

- **Cockpit Dashboard** — unified mission-control view with schedule, repos, jobs, queue, and CLI tool settings
- **Prompt-Driven Jobs** — define jobs by prompt and repo; the full CLI command is auto-constructed from configurable templates
- **Cron Scheduling** — standard cron expressions with preset picker; configurable parallel worker count
- **Multi-Repo Management** — register repos with an AI type (Claude Code / Copilot), each with its own CLI template
- **Live Streaming** — execution output streams in real-time via WebSocket; send stdin to running processes
- **Execution History** — paginated history with status filtering, output replay, and retention-based pruning
- **CLI Tool Templates** — configurable command templates for each AI tool, persisted in the database
- **SQLite Backed** — zero-config database, no external services required
- **Docker Ready** — single-container deployment with persistent volume

---

## Quick Start

### Using Docker (recommended)

```bash
# Build the image
docker build -t task-runner .

# Run it (data persists in ./data/)
docker run -d \
  --name task-runner \
  -p 5222:5222 \
  -v "$(pwd)/data:/app/data" \
  task-runner
```

Open [http://localhost:5222](http://localhost:5222).

### Without Docker

```bash
# Prerequisites: Node.js 20+
npm install
npm run build
npm start
```

Or for development with hot-reload:

```bash
npm run dev
```

This starts both the API server (port 5222) and the Vite dev server (port 5173).

---

## Screens

| Tab | Description |
|---|---|
| **Cockpit** | Schedule config, repos table, jobs table with prompt editor, execution queue, CLI tool settings |
| **Jobs** | Card-based job browser with full CRUD |
| **History** | Paginated execution logs with filters and output viewer |
| **Settings** | WSL mode, execution retention, worker pool controls |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5222` | HTTP server port |

### Schedule Settings (Cockpit)

- **Cron Expression** — standard 5-field cron syntax with preset picker
- **Parallel Workers** — max concurrent job executions (1–10)
- **Start/Stop** — toggle the cron scheduler on and off

### CLI Templates (Cockpit → CLI Settings)

Default templates seeded on first run:

| CLI | Template |
|---|---|
| **claude** | `claude --dangerously-skip-permissions --model haiku -p` |
| **copilot** | `copilot --yolo -m sonnet-4.5 -p` |

The prompt text is appended at the end: `{template} "{prompt}"`. Edit these templates live from the Cockpit.

### WSL Mode

When running on Windows via WSL, the terminal spawner can adapt:

| Mode | Behavior |
|---|---|
| `auto` | Auto-detect WSL environment |
| `always` | Force WSL-mode path translation |
| `never` | Native execution |

---

## Repos & Jobs

### Repos

Each repo has:
- A **name** and **filesystem path**
- An **AI type** (`claude` or `copilot`) — determines which CLI template is used when constructing commands

### Jobs

Jobs are the core unit of work. Each job has:
- **Name** — unique identifier
- **Repo** — which repo to operate on (determines the CLI tool)
- **Prompt** — the instruction text (not the full command). The system auto-constructs the command from the repo's CLI template + prompt.
- **Timeout** — max execution time in seconds

When you add a job, you see a live preview of the full command before saving. Edits reconstruct the command if the prompt or repo changes.

---

## Architecture

```
                         ┌─────────────────────┐
                         │   React SPA (Vite)   │
                         │  :5173 dev / :5222   │
                         └──────────┬──────────┘
                                    │ HTTP / WS
                         ┌──────────▼──────────┐
                         │   Express Server     │
                         │      :5222           │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
   ┌──────────▼──────────┐ ┌───────▼────────┐ ┌─────────▼──────────┐
   │     SQLite DB       │ │  Worker Pool   │ │  Cron Scheduler    │
   │  (better-sqlite3)   │ │  (parallel      │ │  (node-cron)       │
   │  data/queue.db      │ │   execution)    │ │                    │
   └─────────────────────┘ └────────────────┘ └────────────────────┘
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, CSS Modules, Vite |
| Backend | Express 5, TypeScript |
| Database | SQLite via better-sqlite3 (zero config) |
| Scheduling | node-cron |
| Real-time | WebSocket (ws library) |
| Workers | Child process pool with cross-platform terminal spawner |

### Project Layout

```
src/
├── index.ts                  # Entry point
├── server.ts                 # Express server builder
├── routes/                   # REST API routes
│   ├── jobs.routes.ts
│   ├── executions.routes.ts
│   ├── repos.routes.ts
│   ├── settings.routes.ts
│   ├── control.routes.ts
│   └── cli-configs.routes.ts
├── queue/                    # Job execution engine
│   ├── cron-scheduler.ts
│   ├── worker-pool.ts
│   ├── worker.ts
│   └── terminal-spawner.ts
├── db/                       # Database layer
│   ├── database.ts
│   └── migrations.ts
└── client/                   # React frontend
    ├── App.tsx
    ├── components/
    │   ├── Cockpit/          # Mission control dashboard
    │   ├── Jobs/             # Job cards & editor
    │   ├── ExecutionHistory/ # Execution logs
    │   ├── Settings/         # App settings panel
    │   └── Common/           # Shared UI components
    ├── api/                  # API client modules
    ├── state/                # React Context state
    └── hooks/                # Custom hooks (WebSocket)
```

---

## API Reference

### Jobs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/jobs` | List all jobs (includes `repo_name`, `ai_type`) |
| `GET` | `/api/jobs/:id` | Get a single job |
| `POST` | `/api/jobs` | Create a job (provide `name` + `repo_id` + `prompt` or `name` + `repo_path` + `command`) |
| `PUT` | `/api/jobs/:id` | Update a job |
| `DELETE` | `/api/jobs/:id` | Delete a job and its executions |
| `POST` | `/api/jobs/:id/toggle` | Enable/disable a job |

### Repos

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/repos` | List all repos |
| `POST` | `/api/repos` | Create a repo |
| `PUT` | `/api/repos/:id` | Update a repo |
| `DELETE` | `/api/repos/:id` | Delete a repo (jobs reference set to null) |

### Executions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/executions` | List executions (supports `job_id`, `status`, `limit`, `offset`, `from`, `to`) |
| `GET` | `/api/executions/:id` | Get an execution |
| `GET` | `/api/executions/:id/output` | Get stdout/stderr |
| `GET` | `/api/executions/stats` | Execution counts by status |
| `POST` | `/api/executions/trigger` | Manually trigger a job |
| `POST` | `/api/executions/:id/stdin` | Send stdin to a running execution |
| `POST` | `/api/executions/:id/cancel` | Cancel a pending/running execution |
| `POST` | `/api/executions/prune` | Delete executions older than N days |

### Settings & Control

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/settings` | Get all settings |
| `PUT` | `/api/settings` | Update settings (cron, workers, WSL mode, retention) |
| `GET` | `/api/control/health` | Health check |
| `POST` | `/api/control/cron/start` | Start the cron scheduler |
| `POST` | `/api/control/cron/stop` | Stop the cron scheduler |
| `POST` | `/api/control/worker/cancel-all` | Cancel all running/pending executions |

### CLI Configs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/cli-configs` | List all CLI tool templates |
| `PUT` | `/api/cli-configs/:cli_name` | Update a CLI template |

### WebSocket

Connect to `ws://host:5222/ws`. The server pushes events:

- `execution-created` / `execution-started`
- `execution-output` (streamed stdout/stderr chunks)
- `execution-completed` / `execution-failed` / `execution-cancelled`
- `cron-status-changed` / `settings-changed` / `job-updated`
- `worker-pool-stats`

---

## Development

```bash
# Clone and install
git clone <url> && cd task-runner
npm install

# Start dev servers (API :5222 + client :5173 with proxy)
npm run dev

# Type check
npm run typecheck

# Full build
npm run build
```

### Adding a Migration

Edit `src/db/migrations.ts`:

1. Bump `SCHEMA_VERSION`
2. Add an `else if (currentVersion === N-1)` block with your DDL
3. Migrations run automatically on server start

---

## License

MIT
