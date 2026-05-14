import { spawn } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join, basename } from 'path';
import { existsSync } from 'fs';

function escapeForShell(str: string): string {
  return str.replace(/'/g, "'\\''");
}

function getUserShell(): { shellPath: string; shellName: string } {
  const shellPath = process.env.SHELL || '/bin/bash';
  const shellName = basename(shellPath);
  return { shellPath, shellName };
}

function buildRcSourceBlock(shellName: string): string {
  if (shellName === 'zsh') {
    return [
      '[ -f "$HOME/.zprofile" ] && source "$HOME/.zprofile" 2>/dev/null || true',
      '[ -f "$HOME/.zshrc" ]   && source "$HOME/.zshrc"   2>/dev/null || true',
    ].join('\n');
  }
  // bash / sh / dash — source login profile first, then interactive rc
  return [
    '[ -f "$HOME/.bash_profile" ] && source "$HOME/.bash_profile" 2>/dev/null || true',
    '[ -f "$HOME/.profile" ]      && source "$HOME/.profile"      2>/dev/null || true',
    '[ -f "$HOME/.bashrc" ]       && source "$HOME/.bashrc"       2>/dev/null || true',
  ].join('\n');
}

// zsh uses a different `read` syntax for prompts
function buildReadPrompt(shellName: string): string {
  if (shellName === 'zsh') {
    return 'read -r "?Press Enter to close"';
  }
  return 'read -rp "Press Enter to close"';
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
    const safePath = escapeForShell(repoPath);
    const safeTmpDir = escapeForShell(tmpDir);

    const { shellPath, shellName } = getUserShell();
    const rcBlock = buildRcSourceBlock(shellName);
    const readPrompt = buildReadPrompt(shellName);

    const script = `#!${shellPath}
# ── 1. Load the full user environment (profile + interactive rc) ──────────────
${rcBlock}

# ── 2. Navigate to repo ───────────────────────────────────────────────────────
echo "[task-runner] Initialising WSL environment (${shellName})..."
echo
cd '${safePath}' || {
  echo "[task-runner] ERROR: could not cd into '${safePath}'"
  ${readPrompt}
  exit 1
}
echo "[task-runner] \$ cd ${safePath}"

# ── 3. Run command ────────────────────────────────────────────────────────────
echo "[task-runner] \$ ${command}"
echo
eval '${escapeForShell(command)}'
_exit=$?
echo
echo "--- exit $_exit ---"
${readPrompt}
rm -rf '${safeTmpDir}'
`;

    writeFileSync(scriptPath, script, { mode: 0o755 });

    const child = spawn(
      'wt.exe',
      // wsl.exe is a Windows binary — it resolves Linux paths like /bin/bash and /tmp/...
      // wt.exe cannot resolve Linux paths directly, so we bridge through wsl.exe.
      // -l = login shell so $PATH from /etc/profile.d/* is populated before our rc sources
      ['nt', '--title', `Job: ${jobName}`, '--', 'wsl.exe', '--', shellPath, '-l', scriptPath],
      { detached: true, stdio: 'ignore' },
    );

    child.on('spawn', () => {
      child.unref();
      resolve();
    });

    child.on('error', (err) => {
      reject(new Error(`wt.exe not reachable: ${err.message}. Run the server directly on WSL2 (not in Docker).`));
    });
  });
}
