# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Quality Checks:** @.github/instructions/gate-keeper-quality-check.instructions.md

## Commands

```bash
npm run dev          # Start both API server (:5222) + Vite dev client (:5173) with hot-reload
npm run dev:server   # API server only via tsx watch
npm run dev:client   # Vite client only
npm run build        # tsc + vite build
npm start            # node dist/index.js (production)
npm run typecheck    # tsc --noEmit
```

App is served at http://localhost:5222 (both UI and API from the same port in production).

**Must run on WSL2 directly** — not in Docker. Jobs are launched by spawning `wt.exe` (Windows Terminal), which requires WSL2 interop with the Windows host. Docker containers cannot reach `wt.exe`.

## Project Structure

Full-stack TypeScript monorepo (single package.json). Express 5 backend + React 19 SPA frontend, SQLite via better-sqlite3, all ESM (`"type": "module"`).

### Backend (`src/`)

| Path | Role |
|---|---|
| `src/index.ts` | Entry — creates server, listens on PORT (default 5222) |
| `src/server.ts` | Express app builder wires middleware, route groups, shutdown hooks |
| `src/routes/*.ts` | REST routers: jobs, executions, repos, settings, control, cli-configs |
| `src/queue/wt-launcher.ts` | Spawns `wt.exe` to open a new Windows Terminal tab for each job |
| `src/queue/cron-scheduler.ts` | node-cron wrapper — ticks enabled jobs, calls wt-launcher |
| `src/db/database.ts` | Singleton better-sqlite3 connection, WAL mode, foreign keys |
| `src/db/migrations.ts` | Versioned migrations (pragma user_version), bump SCHEMA_VERSION to add |
| `src/errors.ts` | AppError / NotFoundError / ValidationError / ConflictError classes |
| `src/types.ts` | Shared types: Job, Settings, etc. |

### Frontend (`src/client/`)

- **State**: React Context via `state/AppState.tsx` — holds jobs, repos, settings, cliConfigs
- **API layer**: `api/*.ts` — fetch wrappers, one module per resource
- **Components**: One directory per screen (Cockpit, Jobs, Settings, Dashboard) + Common (Navigation, ConfirmDialog, CronInput, Slider, StatusBadge)

### Conventions

- **Routing**: Express routers are factory functions `createXRouter(db, ...)` returning `Router`
- **DB**: better-sqlite3 synchronous API — no async/await for queries. Prepared statements reused via `db.prepare()`
- **Migrations**: Add `if (currentVersion === N)` block in `migrations.ts`, bump `SCHEMA_VERSION`
- **CSS**: CSS Modules co-located with each component (`Foo.module.css`)
- **Job execution**: Jobs reference a repo (which has an `ai_type` like `claude`/`copilot`). The full CLI command is built from `cli_configs.command_template + prompt`. On trigger, `wt-launcher.ts` writes a temp shell script to `/tmp` and hands the path to `wt.exe nt -- bash -l <script>`.
