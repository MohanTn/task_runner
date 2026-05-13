import { spawn, execSync, type ChildProcess } from 'child_process';
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

/** Check if stdbuf is available (force line-buffered output for live streaming) */
let _hasStdbuf: boolean | null = null;
function hasStdbuf(): boolean {
  if (_hasStdbuf !== null) return _hasStdbuf;
  try {
    execSync('command -v stdbuf', { stdio: 'ignore' });
    _hasStdbuf = true;
  } catch {
    _hasStdbuf = false;
  }
  return _hasStdbuf;
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
      const useLineBuf = hasStdbuf();
      const args = useLineBuf
        ? ['-oL', 'bash', '-c', command]
        : ['bash', '-c', command];
      const child = spawn(useLineBuf ? 'stdbuf' : 'bash', args, {
        cwd: repoPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, HOME: process.env.HOME || '/root' },
      });
      return { process: child, platform };
    }

    case 'native-wsl': {
      const wslPath = convertToWslPath(repoPath);
      const child = spawn('wsl.exe', ['--cd', wslPath, '--', 'bash', '-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
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
