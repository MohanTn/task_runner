import { spawn } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

function escapeForBash(str: string): string {
  return str.replace(/'/g, "'\\''");
}

export function isWtAvailable(): boolean {
  if (existsSync('/.dockerenv')) return false;
  return true;
}

export function launchInWindowsTerminal(repoPath: string, command: string, jobName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Write a temp script so no semicolons or special chars reach wt.exe's arg parser
    // (wt uses ";" as its own command separator — passing "bash -c '...; ...'" breaks it)
    const tmpDir = mkdtempSync(join(tmpdir(), 'task-runner-'));
    const scriptPath = join(tmpDir, 'run.sh');
    const safePath = escapeForBash(repoPath);
    const safeTmpDir = escapeForBash(tmpDir);

    const script = `#!/usr/bin/env bash
cd '${safePath}'
${command}
_exit=$?
echo
echo "--- exit $_exit ---"
read -rp "Press Enter to close"
rm -rf '${safeTmpDir}'
`;

    writeFileSync(scriptPath, script, { mode: 0o755 });

    const child = spawn('wt.exe', ['nt', '--title', `Job: ${jobName}`, '--', 'bash', '-l', scriptPath], {
      detached: true,
      stdio: 'ignore',
    });

    child.on('spawn', () => {
      child.unref();
      resolve();
    });

    child.on('error', (err) => {
      reject(new Error(`wt.exe not reachable: ${err.message}. Run the server directly on WSL2 (not in Docker).`));
    });
  });
}
