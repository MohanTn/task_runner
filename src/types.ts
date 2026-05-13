export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TriggerType = 'cron' | 'manual';
export type RunMode = 'single' | 'multiple';

export interface Job {
  id: number;
  name: string;
  repo_path: string;
  command: string;
  enabled: boolean;
  timeout_seconds: number;
  run_mode: RunMode;
  created_at: string;
  updated_at: string;
}

export interface JobCreateInput {
  name: string;
  repo_path: string;
  command: string;
  enabled?: boolean;
  timeout_seconds?: number;
  run_mode?: RunMode;
}

export interface JobUpdateInput {
  name?: string;
  repo_path?: string;
  command?: string;
  enabled?: boolean;
  timeout_seconds?: number;
  run_mode?: RunMode;
}

export interface Execution {
  id: number;
  job_id: number;
  status: ExecutionStatus;
  exit_code: number | null;
  output: string;
  error_output: string;
  started_at: string | null;
  completed_at: string | null;
  triggered_by: TriggerType;
  worker_pid: number | null;
  created_at: string;
}

export interface ExecutionListOptions {
  job_id?: number;
  status?: ExecutionStatus;
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
}

export interface Settings {
  cron_enabled: boolean;
  cron_expression: string;
  max_parallel_workers: number;
  wsl_mode: 'auto' | 'always' | 'never';
  keep_execution_days: number;
  [key: string]: unknown;
}

export interface PoolStats {
  active: number;
  pending: number;
  maxParallel: number;
}

export interface HealthStatus {
  status: 'ok';
  uptime: number;
  cron: { running: boolean; jobs: number };
  worker: PoolStats;
}

export interface DashboardStats {
  total_jobs: number;
  active_jobs: number;
  running_executions: number;
  pending_executions: number;
  failed_today: number;
  completed_today: number;
}
