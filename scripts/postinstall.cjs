#!/usr/bin/env node

/**
 * task-runner postinstall script
 *
 * Runs after `npm install -g @mohantn/task-runner`.
 * Prints a welcome message and setup instructions.
 */

const pkg = require('../package.json');

console.log(`
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
`);
