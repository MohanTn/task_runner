export interface Settings {
  cron_enabled: boolean;
  cron_expression: string;
  max_parallel_workers: number;
  wsl_mode: 'auto' | 'always' | 'never';
  keep_execution_days: number;
  [key: string]: unknown;
}

export interface HealthStatus {
  status: 'ok';
  uptime: number;
  cron: { running: boolean; jobs: number };
  worker: { active: number; pending: number; maxParallel: number };
}

export interface PoolStats {
  active: number;
  pending: number;
  maxParallel: number;
}

export interface DashboardStats {
  total_jobs: number;
  active_jobs: number;
  running_executions: number;
  pending_executions: number;
  failed_today: number;
  completed_today: number;
}
