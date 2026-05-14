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
