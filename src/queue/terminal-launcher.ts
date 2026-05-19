import { spawn, spawnSync } from 'child_process';
import { writeFileSync, mkdtempSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, basename } from 'path';

export type TerminalMode = 'wt' | 'powershell';

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
  return [
    '[ -f "$HOME/.bash_profile" ] && source "$HOME/.bash_profile" 2>/dev/null || true',
    '[ -f "$HOME/.profile" ]      && source "$HOME/.profile"      2>/dev/null || true',
    '[ -f "$HOME/.bashrc" ]       && source "$HOME/.bashrc"       2>/dev/null || true',
  ].join('\n');
}

function buildReadPrompt(shellName: string): string {
  if (shellName === 'zsh') return 'read -r "?Press Enter to close"';
  return 'read -rp "Press Enter to close"';
}

function buildJobScript(
  shellPath: string,
  shellName: string,
  repoPath: string,
  command: string,
  promptPath: string,
  tmpDir: string,
  preCmd?: string,
  postCmd?: string,
): string {
  const safePath = escapeForShell(repoPath);
  const safeTmpDir = escapeForShell(tmpDir);
  const safePromptPath = escapeForShell(promptPath);
  const rcBlock = buildRcSourceBlock(shellName);
  const readPrompt = buildReadPrompt(shellName);

  const preCmdBlock = preCmd?.trim()
    ? `
echo "[task-runner] \$ ${preCmd}"
${preCmd}
_pre_exit=$?
if [ $_pre_exit -ne 0 ]; then
  echo "[task-runner] pre-cmd exited with \$_pre_exit"
  ${readPrompt}
  exit $_pre_exit
fi
`
    : '';

  const postCmdBlock = postCmd?.trim()
    ? `
echo "[task-runner] \$ ${postCmd}"
${postCmd}
`
    : '';

  return `#!${shellPath}
${rcBlock}

echo "[task-runner] Initialising WSL environment (${shellName})..."
echo
cd '${safePath}' || {
  echo "[task-runner] ERROR: could not cd into '${safePath}'"
  ${readPrompt}
  exit 1
}
echo "[task-runner] \$ cd ${safePath}"
${preCmdBlock}
PROMPT=$(cat '${safePromptPath}')

echo "[task-runner] \$ ${command}"
echo
${command} "\$PROMPT"
_exit=$?
echo
echo "--- exit \$_exit ---"
${postCmdBlock}
${readPrompt}
rm -rf '${safeTmpDir}'
`;
}

export function isWtAvailable(): boolean {
  if (existsSync('/.dockerenv')) return false;
  return true;
}

function launchInWindowsTerminal(
  repoPath: string,
  command: string,
  prompt: string,
  jobName: string,
  preCmd?: string,
  postCmd?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'task-runner-'));
    const scriptPath = join(tmpDir, 'run.sh');
    const promptPath = join(tmpDir, 'prompt.txt');

    writeFileSync(promptPath, prompt, 'utf-8');
    const { shellPath, shellName } = getUserShell();
    writeFileSync(
      scriptPath,
      buildJobScript(shellPath, shellName, repoPath, command, promptPath, tmpDir, preCmd, postCmd),
      { mode: 0o755 },
    );

    const child = spawn(
      'wt.exe',
      ['nt', '--title', `Job: ${jobName}`, '--', 'wsl.exe', '--', shellPath, '-i', '-l', scriptPath],
      { detached: true, stdio: 'ignore' },
    );
    child.on('spawn', () => { child.unref(); resolve(); });
    child.on('error', (err) => {
      reject(new Error(`wt.exe not reachable: ${err.message}. Run the server directly on WSL2 (not in Docker).`));
    });
  });
}

function launchInPowerShell(
  repoPath: string,
  command: string,
  prompt: string,
  jobName: string,
  preCmd?: string,
  postCmd?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'task-runner-'));
    const scriptPath = join(tmpDir, 'run.sh');
    const promptPath = join(tmpDir, 'prompt.txt');
    const psScriptPath = join(tmpDir, 'launch.ps1');

    writeFileSync(promptPath, prompt, 'utf-8');
    const { shellPath, shellName } = getUserShell();
    writeFileSync(
      scriptPath,
      buildJobScript(shellPath, shellName, repoPath, command, promptPath, tmpDir, preCmd, postCmd),
      { mode: 0o755 },
    );

    // wslpath converts the Linux temp path to a Windows path so PowerShell can reference it
    const wslpathResult = spawnSync('wslpath', ['-w', psScriptPath]);
    if (wslpathResult.error) {
      reject(new Error(`wslpath failed: ${wslpathResult.error.message}`));
      return;
    }
    const winPsPath = wslpathResult.stdout.toString().trim();

    const safeJobName = jobName.replace(/'/g, "''");
    writeFileSync(
      psScriptPath,
      `$host.UI.RawUI.WindowTitle = 'Job: ${safeJobName}'\nwsl.exe -- ${shellPath} -i -l ${scriptPath}\n`,
    );

    const escapedWinPath = winPsPath.replace(/'/g, "''");
    const child = spawn(
      'powershell.exe',
      ['-Command', `Start-Process powershell.exe -ArgumentList @('-NoExit', '-File', '${escapedWinPath}')`],
      { detached: true, stdio: 'ignore' },
    );
    child.on('spawn', () => { child.unref(); resolve(); });
    child.on('error', (err) => {
      reject(new Error(`powershell.exe not reachable: ${err.message}. Ensure you are running on WSL2.`));
    });
  });
}

export function launchTerminal(
  mode: TerminalMode,
  repoPath: string,
  command: string,
  prompt: string,
  jobName: string,
  preCmd?: string,
  postCmd?: string,
): Promise<void> {
  if (mode === 'wt') return launchInWindowsTerminal(repoPath, command, prompt, jobName, preCmd, postCmd);
  return launchInPowerShell(repoPath, command, prompt, jobName, preCmd, postCmd);
}
