# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Local dev
```bash
npm run dev          # Start both API server (:5222) + Vite dev client (:5173) with hot-reload
npm run dev:server   # API server only via tsx watch
npm run dev:client   # Vite client only
npm run build        # tsc + vite build
npm start            # node dist/index.js (production)
npm run typecheck    # tsc --noEmit
```

### Docker
```bash
# Build image
docker build -t task-runner .

# Run (data persists in ./data/ via volume)
docker run -d \
  --name task-runner \
  -p 5222:5222 \
  -v "$(pwd)/data:/app/data" \
  task-runner

# Useful docker ops
docker logs -f task-runner          # Follow logs
docker restart task-runner          # Restart container
docker stop task-runner             # Stop
docker rm task-runner               # Remove container (data volume is safe)

# Rebuild after code changes
docker stop task-runner && docker rm task-runner
docker build -t task-runner . && docker run -d \
  --name task-runner \
  -p 5222:5222 \
  -v "$(pwd)/data:/app/data" \
  task-runner
```

App is served at http://localhost:5222 (both UI and API from the same port in production).

## Project Structure

Full-stack TypeScript monorepo (single package.json). Express 5 backend + React 19 SPA frontend, SQLite via better-sqlite3, all ESM (`"type": "module"`).

### Backend (`src/`)

| Path | Role |
|---|---|
| `src/index.ts` | Entry — creates server, listens on PORT (default 5222) |
| `src/server.ts` | Express app builder wires middleware, route groups, shutdown hooks |
| `src/routes/*.ts` | REST routers: jobs, executions, repos, settings, control, cli-configs |
| `src/queue/worker.ts` | Single job execution — spawns child process, streams output, enforces timeout |
| `src/queue/worker-pool.ts` | Manages N concurrent workers, pending queue, stdin forwarding |
| `src/queue/cron-scheduler.ts` | node-cron wrapper — ticks enabled jobs, emits events |
| `src/queue/terminal-spawner.ts` | Cross-platform command spawner (Linux/macOS/WSL/Windows) |
| `src/db/database.ts` | Singleton better-sqlite3 connection, WAL mode, foreign keys |
| `src/db/migrations.ts` | Versioned migrations (pragma user_version), bump SCHEMA_VERSION to add |
| `src/websocket.ts` | WebSocket manager — connection tracking, ping/pong, broadcast |
| `src/broadcast.ts` | Typed broadcast helpers for each event type |
| `src/errors.ts` | AppError / NotFoundError / ValidationError / ConflictError classes |
| `src/types.ts` | Shared types: Job, Execution, Settings, PoolStats, etc. |

### Frontend (`src/client/`)

- **State**: React Context via `state/AppState.tsx` — holds jobs, repos, settings, executions
- **API layer**: `api/*.ts` — fetch wrappers, one module per resource
- **Hooks**: `hooks/useWebSocket.ts` — auto-connect, reconnect, typed message dispatch
- **Components**: One directory per screen (Cockpit, Jobs, ExecutionHistory, Settings, Dashboard) + Common (Navigation, ConfirmDialog, CronInput, Slider, StatusBadge)
- **Tabs**: Cockpit (mission control), Jobs (card browser), History (pagination+filter), Settings

### Conventions

- **Routing**: Express routers are factory functions `createXRouter(db, ...)` returning `Router`
- **DB**: better-sqlite3 synchronous API — no async/await for queries. Prepared statements reused via `db.prepare()`
- **Migrations**: Add `else if (currentVersion === N-1)` block in `migrations.ts`, bump `SCHEMA_VERSION`
- **Real-time**: Server pushes events via `broadcast.ts` -> `wsManager.broadcast()`. Client receives them in `App.tsx` switch statement
- **CSS**: CSS Modules co-located with each component (`Foo.module.css`)
- **Job execution**: Jobs reference a repo (which has an `ai_type` like `claude`/`copilot`). The full CLI command is built from `cli_configs.command_template + prompt`
- **Worker lifecycle**: WorkerPool dequeues -> Worker spawns child process -> streams output via WebSocket -> persists on completion -> WorkerPool processes next