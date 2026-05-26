#!/usr/bin/env node

/**
 * task-runner postinstall script
 *
 * Runs after `npm install @mohantn/task-runner` (global or local).
 * Prints a welcome message and setup instructions.
 *
 * Uses process.stderr so the banner is visible in both global and local
 * installs — npm may suppress stdout for lifecycle scripts.
 */

const pkg = require('../package.json');

const banner = `
  ╔═══════════════════════════════════════════╗
  ║    ⬡ Task Runner v${String(pkg.version).padEnd(16)}║
  ║   Self-hosted AI task scheduler           ║
  ╚═══════════════════════════════════════════╝

  Start server:   task-runner
  Shortcut:       tr
  Dashboard:      http://localhost:5222

  Requirements:
    - Node.js 20+
    - WSL2 with Windows Terminal (wt.exe)

  Docs: https://github.com/MohanTn/task_runner
`;

process.stderr.write(banner);
