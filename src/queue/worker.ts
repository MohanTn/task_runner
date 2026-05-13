import { ChildProcess } from 'child_process';
import process from 'process';
import Database from 'better-sqlite3';
import type { Execution, Job } from '../types.js';
import { spawnCommand, type WSLMode } from './terminal-spawner.js';
import {
  broadcastExecutionStarted,
  broadcastExecutionOutput,
  broadcastExecutionCompleted,
  broadcastExecutionFailed,
} from '../broadcast.js';

const MAX_OUTPUT_LENGTH = 100_000;
const CHUNK_INTERVAL_MS = 200;

export class Worker {
  private process: ChildProcess | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private outputBuffer: string = '';
  private errorBuffer: string = '';
  private lastChunkTime: number = 0;
  private chunkTimer: ReturnType<typeof setInterval> | null = null;
  private finished = false;

  constructor(
    private execution: Execution,
    private job: Job,
    private db: Database.Database,
    private wslMode: WSLMode,
    private onComplete: (executionId: number) => void,
  ) {}

  start(): void {
    const update = this.db.prepare(
      `UPDATE executions SET status = 'running', started_at = datetime('now'), worker_pid = ? WHERE id = ?`,
    );

    // ── Terminal status header (streamed live into the page) ──
    const header = [
      `> wsl terminal opened (${this.getPlatformLabel()})`,
      `> switching to repo folder: ${this.job.repo_path}`,
    ];
    for (const line of header) {
      const msg = `${line}\n`;
      this.outputBuffer += msg;
      broadcastExecutionOutput(this.execution.id, 'stdout', msg);
    }

    const { process: child, platform } = spawnCommand(
      this.job.repo_path,
      this.job.command,
      this.wslMode,
    );

    this.process = child;

    update.run(child.pid ?? null, this.execution.id);
    this.execution.status = 'running';
    this.execution.worker_pid = child.pid ?? null;
    this.execution.started_at = new Date().toISOString();

    broadcastExecutionStarted(this.execution);

    // ── Command-execution line (also live-streamed) ──
    const execMsg = `> executing claude: ${this.job.command}\n`;
    this.outputBuffer += execMsg;
    broadcastExecutionOutput(this.execution.id, 'stdout', execMsg);

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      if (this.outputBuffer.length < MAX_OUTPUT_LENGTH) {
        this.outputBuffer += text.slice(0, MAX_OUTPUT_LENGTH - this.outputBuffer.length);
      }
      this.throttledChunk('stdout', text);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      if (this.errorBuffer.length < MAX_OUTPUT_LENGTH) {
        this.errorBuffer += text.slice(0, MAX_OUTPUT_LENGTH - this.errorBuffer.length);
      }
      this.throttledChunk('stderr', text);
    });

    child.on('close', (exitCode: number | null, signal: string | null) => {
      this.cleanup();
      this.finish(exitCode, signal);
    });

    child.on('error', (err: Error) => {
      this.cleanup();
      this.fail(err.message);
    });

    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, Math.max(1, this.job.timeout_seconds ?? 1800) * 1000);
  }

  writeStdin(input: string): void {
    if (this.process?.stdin?.writable) {
      this.process.stdin.write(input);
      this.process.stdin.write('\n');
    }
  }

  abort(): void {
    if (this.finished) return;
    this.finished = true;
    this.cleanup();
    if (this.process) {
      this.process.kill('SIGTERM');
      setTimeout(() => this.process?.kill('SIGKILL'), 5000);
    }
    this.db
      .prepare(
        `UPDATE executions SET status = 'cancelled', output = ?, completed_at = datetime('now') WHERE id = ?`,
      )
      .run(this.outputBuffer, this.execution.id);
    this.execution.status = 'cancelled';
    this.execution.output = this.outputBuffer;
    this.onComplete(this.execution.id);
  }

  private throttledChunk(stream: 'stdout' | 'stderr', text: string): void {
    const now = Date.now();
    if (now - this.lastChunkTime >= CHUNK_INTERVAL_MS) {
      broadcastExecutionOutput(this.execution.id, stream, text);
      this.lastChunkTime = now;
    }
  }

  private finish(exitCode: number | null, signal: string | null = null): void {
    if (this.finished) return;
    this.finished = true;

    const status = exitCode === 0 ? 'completed' : 'failed';
    const code = exitCode ?? (signal ? -1 : -1);

    let errorOutput = this.errorBuffer;
    if (status === 'failed' && !errorOutput) {
      if (signal) {
        errorOutput = `Process killed by signal ${signal}`;
      } else if (exitCode !== null) {
        errorOutput = `Process exited with code ${exitCode}`;
      } else {
        errorOutput = 'Process exited with unknown status';
      }
    }

    this.db
      .prepare(
        `UPDATE executions SET status = ?, exit_code = ?, output = ?, error_output = ?,
         completed_at = datetime('now') WHERE id = ?`,
      )
      .run(status, code, this.outputBuffer, errorOutput, this.execution.id);

    this.execution.status = status;
    this.execution.exit_code = code;
    this.execution.output = this.outputBuffer;
    this.execution.error_output = errorOutput;

    if (status === 'completed') {
      broadcastExecutionCompleted(this.execution);
    } else {
      broadcastExecutionFailed(this.execution);
    }

    this.onComplete(this.execution.id);
  }

  private fail(error: string): void {
    if (this.finished) return;
    this.finished = true;

    this.db
      .prepare(
        `UPDATE executions SET status = 'failed', exit_code = -1, error_output = ?,
         completed_at = datetime('now') WHERE id = ?`,
      )
      .run(error.slice(0, MAX_OUTPUT_LENGTH), this.execution.id);

    this.execution.status = 'failed';
    this.execution.exit_code = -1;
    this.execution.error_output = error;
    broadcastExecutionFailed(this.execution, error);
    this.onComplete(this.execution.id);
  }

  private handleTimeout(): void {
    if (this.finished) return;
    this.finished = true;

    if (this.process) {
      this.process.kill('SIGTERM');
      setTimeout(() => this.process?.kill('SIGKILL'), 5000);
    }
    this.db
      .prepare(
        `UPDATE executions SET status = 'failed', exit_code = -1, output = ?,
         error_output = ?,
         completed_at = datetime('now') WHERE id = ?`,
      )
      .run(
        this.outputBuffer,
        (this.execution.error_output || '') + `\n[TIMEOUT] Job exceeded ${this.job.timeout_seconds}s`,
        this.execution.id,
      );

    this.execution.status = 'failed';
    this.execution.exit_code = -1;
    this.execution.error_output = `Timeout after ${this.job.timeout_seconds}s`;
    broadcastExecutionFailed(this.execution, `Timeout after ${this.job.timeout_seconds}s`);
    this.onComplete(this.execution.id);
  }

  private cleanup(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.chunkTimer) {
      clearInterval(this.chunkTimer);
      this.chunkTimer = null;
    }
  }

  private getPlatformLabel(): string {
    if (process.platform === 'darwin') return 'macOS';
    if (process.platform === 'win32') return 'Windows';
    if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) return 'WSL';
    return 'Linux';
  }
}
