#!/usr/bin/env node

/**
 * task-runner CLI entry point
 *
 * Usage:
 *   task-runner          Start the server (default port 5222)
 *   task-runner --port 5223
 *   task-runner --detach       Run in background (daemon mode)
 *   task-runner --help
 *
 * Shortcut:
 *   tr
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { buildServer } from './server.js';

// Resolve the installed package version at runtime
const __filename = fileURLToPath(import.meta.url);
const PKG_VERSION: string = (() => {
  try {
    const pkgPath = path.resolve(path.dirname(__filename), '..', 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
})();

const HELP = `
⬡ Task Runner — Self-hosted AI task scheduler

Usage:
  task-runner [options]

Options:
  --port, -p <port>  HTTP server port (default: 5222)
  --detach, -d       Run as a background daemon (detached process)
  --help, -h         Show this message

Examples:
  task-runner                    # Start on port 5222
  task-runner --port 5223        # Start on port 5223
  task-runner --detach           # Run in background
  PORT=5223 task-runner          # Or use environment variable
`;

const BANNER = `
  ╔═══════════════════════════════════════════╗
  ║    ⬡ Task Runner v${PKG_VERSION.padEnd(16)}║
  ║   Self-hosted AI task scheduler           ║
  ╚═══════════════════════════════════════════╝
`;

function startServer(port: number): void {
  console.log(BANNER);

  const server = buildServer();

  server.httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n[task-runner] Port ${port} is already in use.\n` +
        `  Another server instance may still be running. Stop it first:\n` +
        `    kill $(lsof -ti :${port})\n` +
        `  Or pick a different port:\n` +
        `    PORT=5223 npx @mohantn/task-runner\n`,
      );
    } else {
      console.error('[task-runner] Fatal server error:', err);
    }
    process.exit(1);
  });

  server.httpServer.listen(port, () => {
    console.log(`[task-runner] Listening on http://localhost:${port}`);
    console.log(`[task-runner] Dashboard: http://localhost:${port}/`);
  });
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }

  // Parse --port flag
  const portIndex = args.indexOf('--port');
  const portShortIndex = args.indexOf('-p');
  const cliPort = portIndex !== -1
    ? parseInt(args[portIndex + 1], 10)
    : portShortIndex !== -1
      ? parseInt(args[portShortIndex + 1], 10)
      : undefined;

  const PORT = cliPort || Number(process.env.PORT) || 5222;

  // Handle --detach / -d flag
  const shouldDetach = args.includes('--detach') || args.includes('-d');

  if (shouldDetach) {
    // Build the argument list for the child process (remove --detach/-d)
    const childArgs = args.filter(a => a !== '--detach' && a !== '-d');

    const child = spawn(process.execPath, [__filename, ...childArgs], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, PORT: String(PORT) },
    });

    child.on('error', (err) => {
      console.error(`[task-runner] Failed to start daemon: ${err.message}`);
      process.exit(1);
    });

    child.unref();

    console.log(`[task-runner] Daemon started (PID ${child.pid})`);
    console.log(`[task-runner] Dashboard: http://localhost:${PORT}/`);
    console.log(`[task-runner] To stop: kill ${child.pid}`);

    process.exit(0);
  }

  startServer(PORT);
}

main();
