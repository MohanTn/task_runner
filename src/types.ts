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

export interface Cron {
  id: number;
  name: string;
  expression: string;
  enabled: boolean;
  job_count: number;
  job_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface CronCreateInput {
  name: string;
  expression: string;
  enabled?: boolean;
}

export interface CronUpdateInput {
  name?: string;
  expression?: string;
  enabled?: boolean;
}

export interface Settings {
  cron_enabled: boolean;
  [key: string]: unknown;
}
