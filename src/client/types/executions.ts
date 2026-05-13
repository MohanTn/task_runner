export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Execution {
  id: number;
  job_id: number;
  status: ExecutionStatus;
  exit_code: number | null;
  output: string;
  error_output: string;
  started_at: string | null;
  completed_at: string | null;
  triggered_by: 'cron' | 'manual';
  worker_pid: number | null;
  created_at: string;
}

export interface ExecutionListResponse {
  executions: Execution[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExecutionStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}
