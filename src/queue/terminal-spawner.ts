import { spawn, execSync, type ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import process from 'process';

export type Platform =
  | 'linux'
  | 'macos'
  | 'inside-wsl'
  | 'native-wsl'
  | 'windows';

export type WSLMode = 'auto' | 'always' | 'never';

export interface SpawnResult {
  process: ChildProcess;
  platform: Platform;
}

function detectPlatform(mode: WSLMode): Platform {
  if (process.platform === 'darwin') return 'macos';
  if (process.platform === 'win32') {
    if (mode === 'always') return 'native-wsl';
    return 'windows';
  }
  if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) return 'inside-wsl';
  return 'linux';
}

function convertToWslPath(windowsPath: string): string {
  const match = windowsPath.match(/^([A-Za-z]):\\(.*)$/);
  if (!match) return windowsPath.replace(/\\/g, '/');
  const drive = match[1].toLowerCase();
  const rest = match[2].replace(/\\/g, '/');
  return `/mnt/${drive}/${rest}`;
}

/** Resolve the absolute path for bash, falling back to well-known locations. */
function findBash(): string {
  for (const p of ['/bin/bash', '/usr/bin/bash', '/usr/local/bin/bash']) {
    if (existsSync(p)) return p;
  }
  return 'bash';
}

/** Resolve the absolute path for stdbuf, or null if not available. */
function findStdbuf(): string | null {
  for (const p of ['/usr/bin/stdbuf', '/bin/stdbuf', '/usr/local/bin/stdbuf']) {
    if (existsSync(p)) return p;
  }
  try {
    execSync('command -v stdbuf', { stdio: 'ignore' });
    return 'stdbuf';
  } catch {
    return null;
  }
}

const BASH_PATH = findBash();
const STDBUF_PATH = findStdbuf();

/**
 * Build a login-shell env: start from a minimal base so profile scripts
 * (nvm, conda, pyenv, etc.) can initialize cleanly, preserving any env vars
 * the server inherited that tools may need (e.g. API keys).
 */
function buildLoginEnv(): NodeJS.ProcessEnv {
  const home = process.env.HOME || `/home/${process.env.USER || 'root'}`;
  return {
    // Pass through any inherited vars (API keys, WSL vars, DISPLAY, etc.)
    ...process.env,
    // Ensure identity vars are set so profile scripts behave correctly
    HOME: home,
    USER: process.env.USER || process.env.LOGNAME || 'root',
    LOGNAME: process.env.LOGNAME || process.env.USER || 'root',
    SHELL: BASH_PATH,
    // Seed PATH with standard dirs; login profile scripts will prepend their
    // own entries (nvm, conda, ~/.local/bin, etc.) on top of this.
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    TERM: process.env.TERM || 'xterm-256color',
  };
}

export function spawnCommand(
  repoPath: string,
  command: string,
  wslMode: WSLMode = 'auto',
): SpawnResult {
  const platform = detectPlatform(wslMode);

  switch (platform) {
    case 'linux':
    case 'macos':
    case 'inside-wsl': {
      // -l  → login shell: sources /etc/profile, ~/.bash_profile, ~/.bashrc
      //       giving the same PATH/nvm/conda setup as opening a WSL terminal
      const wrapped = `cd "${repoPath}" && ${command}`;
      const args = STDBUF_PATH
        ? ['-oL', BASH_PATH, '-l', '-c', wrapped]
        : ['-l', '-c', wrapped];
      const child = spawn(STDBUF_PATH ?? BASH_PATH, args, {
        cwd: repoPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: buildLoginEnv(),
      });
      return { process: child, platform };
    }

    case 'native-wsl': {
      const wslPath = convertToWslPath(repoPath);
      const child = spawn('wsl.exe', ['--cd', wslPath, '--', BASH_PATH, '-l', '-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: buildLoginEnv(),
      });
      return { process: child, platform };
    }

    case 'windows': {
      const child = spawn('cmd.exe', ['/c', command], {
        cwd: repoPath,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { process: child, platform };
    }
  }
}
