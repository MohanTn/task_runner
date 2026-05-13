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

export interface Settings {
  cron_enabled: boolean;
  cron_expression: string;
  [key: string]: unknown;
}
