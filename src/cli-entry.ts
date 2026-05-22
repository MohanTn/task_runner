#!/usr/bin/env node

/**
 * task-runner CLI entry point
 *
 * Usage:
 *   task-runner          Start the server (default port 5222)
 *   task-runner --port 5223
 *   task-runner --help
 *
 * Shortcut:
 *   tr
 */

import { buildServer } from './server.js';

const HELP = `
⬡ Task Runner — Self-hosted AI task scheduler

Usage:
  task-runner [options]

Options:
  --port, -p <port>  HTTP server port (default: 5222)
  --help, -h         Show this message

Examples:
  task-runner                    # Start on port 5222
  task-runner --port 5223        # Start on port 5223
  PORT=5223 task-runner          # Or use environment variable
`;

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

  const server = buildServer();

  server.httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n[task-runner] Port ${PORT} is already in use.\n` +
        `  Another server instance may still be running. Stop it first:\n` +
        `    kill $(lsof -ti :${PORT})\n` +
        `  Or pick a different port:\n` +
        `    PORT=5223 npx @mohantn/task-runner\n`,
      );
    } else {
      console.error('[task-runner] Fatal server error:', err);
    }
    process.exit(1);
  });

  server.httpServer.listen(PORT, () => {
    console.log(`[task-runner] Listening on http://localhost:${PORT}`);
    console.log(`[task-runner] Dashboard: http://localhost:${PORT}/`);
  });
}

main();
