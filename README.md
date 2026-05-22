<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License">
  <img src="https://img.shields.io/badge/node-20%2B-brightgreen.svg" alt="Node >= 20">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express-5-black.svg" alt="Express 5">
  <img src="https://img.shields.io/badge/React-19-61DAFB.svg" alt="React 19">
  <img src="https://img.shields.io/github/actions/workflow/status/MohanTn/task_runner/ci.yml?branch=main&label=CI" alt="CI">
  <img src="https://img.shields.io/npm/v/%40mohantn%2Ftask-runner?color=red" alt="npm">
</p>

<h1 align="center">⬡ Task Runner</h1>
<p align="center"><strong>Self-hosted AI task scheduler — schedule and run Claude Code / Copilot jobs across multiple repos from a web dashboard.</strong></p>

---

## What it is

Task Runner is a self-hosted web app that schedules and executes AI coding tasks across your repositories. Each job opens in its own **Windows Terminal tab** — you see the AI agent working live.

- Schedule Claude Code or Copilot CLI commands via cron
- Manage repos, prompts, and CLI templates from a single dashboard
- Each job runs in an isolated terminal window — no output capture, just live execution

---

## Requirements

- **Node.js 20+**
- **Windows 11 / Windows 10** with [Windows Terminal](https://aka.ms/terminal) (`wt.exe`)
- **WSL2** — the server must run inside WSL2 to call `wt.exe`

---

## Install

```bash
npm install -g @mohantn/task-runner
```

This installs the `task-runner` and `tr` CLI commands.

---

## Quick Start

```bash
# Start the server
task-runner
```

Open **http://localhost:5222**. The dashboard shows your repos, jobs, and cron schedule.

To stop the server: `Ctrl+C`.

Use a custom port:

```bash
task-runner --port 5223
PORT=5223 task-runner
```

---

## How It Works

When you click **Run** on a job (or the cron scheduler fires), the server:

1. Writes a shell script to `/tmp/task-runner-XXXXX/run.sh`
2. Opens a new Windows Terminal tab: `wt.exe nt -- wsl.exe -- bash -l /tmp/.../run.sh`
3. The AI agent runs live in that terminal — you watch it work in real time

Auto-fallback: if `wt.exe` fails, it tries `powershell.exe`. If both fail, an error banner appears on the dashboard.

---

## Dashboard

| Tab | Description |
|-----|-------------|
| **Dashboard** | Health, cron status, quick trigger, recent runs |
| **Jobs** | Create/edit jobs, attach prompts to repos |
| **Schedules** | Cron expressions, start/stop scheduler |
| **Settings** | Terminal paths, CLI templates, cron config |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5222` | HTTP server port |

### Terminal Settings (Settings → Terminal)

| Setting | Default | Description |
|---------|---------|-------------|
| Launch mode | `wt` | `wt` (Windows Terminal) or `powershell` |
| Windows Terminal path | `wt.exe` | Path to `wt.exe` |
| PowerShell path | `powershell.exe` | Path to `powershell.exe` |

### CLI Templates (Cockpit → CLI Settings)

| CLI | Template |
|-----|----------|
| **claude** | `claude --dangerously-skip-permissions --model haiku -p` |
| **copilot** | `copilot --yolo -m sonnet-4.5 -p` |

The prompt text is appended: `{template} "{prompt}"`.

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
|-------|-----------|
| Frontend | React 19, TypeScript, CSS Modules, Vite |
| Backend | Express 5, TypeScript |
| Database | SQLite via better-sqlite3 |
| Scheduling | node-cron |
| Terminal | wt.exe (Windows Terminal) via WSL2 interop |

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/jobs/:id` | Get a single job |
| `POST` | `/api/jobs` | Create a job |
| `PUT` | `/api/jobs/:id` | Update a job |
| `DELETE` | `/api/jobs/:id` | Delete a job |
| `POST` | `/api/jobs/:id/toggle` | Enable/disable a job |
| `GET` | `/api/repos` | List all repos |
| `POST` | `/api/repos` | Create a repo |
| `PUT` | `/api/repos/:id` | Update a repo |
| `DELETE` | `/api/repos/:id` | Delete a repo |
| `POST` | `/api/executions/trigger` | Trigger a job |
| `GET` | `/api/settings` | Get all settings |
| `PUT` | `/api/settings` | Update settings |
| `GET` | `/api/control/health` | Health check |
| `POST` | `/api/control/cron/start` | Start cron scheduler |
| `POST` | `/api/control/cron/stop` | Stop cron scheduler |
| `GET` | `/api/cli-configs` | List CLI templates |
| `PUT` | `/api/cli-configs/:cli_name` | Update a CLI template |

---

## Development

```bash
git clone https://github.com/MohanTn/task_runner.git
cd task_runner
npm install
npm run dev        # API :5222 + client :5173 with hot-reload
npm run typecheck  # Type check only
npm run build      # Full production build
```

### Adding a Migration

Edit `src/db/migrations.ts`:
1. Bump `SCHEMA_VERSION`
2. Add `if (currentVersion === N)` block with your DDL
3. Migrations run automatically on server start

---

## License

MIT — see [LICENSE](LICENSE).
