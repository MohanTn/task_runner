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

## Is this for you?

Task Runner opens a real terminal tab and runs an AI CLI (Claude Code, Copilot, etc.) inside it, live, on a schedule you set. It only works if **all three** are true:

- ✅ You're on **Windows 11 or 10**
- ✅ You do your development inside **WSL2**
- ✅ You have **[Windows Terminal](https://aka.ms/terminal)** installed (`wt.exe`)

If any of those isn't true, this tool won't run jobs — it needs `wt.exe` to open a terminal window on the Windows side from inside WSL2.

---

## Install & run (2 minutes)

```bash
npm install -g @mohantn/task-runner
task-runner
```

Open **http://localhost:5222** — that's it, the dashboard is running.

> You may see a `prebuild-install` deprecation warning during install. That's from `better-sqlite3` (the database driver) and is harmless — the install still completes correctly.

This gives you two equivalent commands: `task-runner` and the shorter `tr`.

To stop the server, press `Ctrl+C`. To run on a different port:

```bash
task-runner --port 5223
# or
PORT=5223 task-runner
```

Run detached (keeps going after you close the terminal):

```bash
task-runner --detach
```

---

## First steps in the dashboard

1. **Repos** — add the local repo path(s) you want the AI to work in, and pick `claude` or `copilot` as the CLI.
2. **Jobs** — create a job: pick a repo and write the prompt the AI should run.
3. Click **Run** — a new Windows Terminal tab opens and you watch the AI work in real time.
4. Optional: attach the job to a **Schedule** (cron expression) so it runs automatically.

---

## How it works

When you click **Run** (or a schedule fires), the server:

1. Writes a small shell script to a temp folder (`/tmp/task-runner-XXXXX/run.sh`)
2. Opens a new Windows Terminal tab: `wt.exe nt -- wsl.exe -- bash -l /tmp/.../run.sh`
3. The AI CLI runs live in that terminal, using your configured command template + prompt

If `wt.exe` isn't reachable, it automatically falls back to `powershell.exe`. If neither works, the dashboard shows an error telling you to fix the paths in **Settings → Terminal**.

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

---

## Where your data lives

Jobs, repos, and settings are stored in a local SQLite file at **`./data/queue.db`, relative to the folder you run `task-runner` from.** Run it from the same folder every time (or use `task-runner --detach` from a fixed location) so you always see the same jobs.

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
| Windows Terminal path | `wt.exe` | Path to `wt.exe`, if not on PATH |
| PowerShell path | `powershell.exe` | Path to `powershell.exe`, if not on PATH |

### CLI Templates (Settings → CLI Templates)

| CLI | Default command template |
|-----|----------|
| **claude** | `claude --dangerously-skip-permissions --model haiku -p` |
| **copilot** | `copilot --yolo -m sonnet-4.5 -p` |

Your job's prompt is appended to the template: `{template} "{prompt}"`. Edit templates in Settings to change models, flags, or point at a different CLI entirely.

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

## Developing locally

```bash
git clone https://github.com/MohanTn/task_runner.git
cd task_runner
npm install
npm run dev        # API :5222 + client :5173, both hot-reload
npm run typecheck  # Type check only
npm run build      # Full production build
```

### Adding a database migration

Edit `src/db/migrations.ts`:
1. Bump `SCHEMA_VERSION`
2. Add an `if (currentVersion === N)` block with your DDL
3. Migrations run automatically the next time the server starts

---

## License

MIT — see [LICENSE](LICENSE).
