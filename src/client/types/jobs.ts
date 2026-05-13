export interface Job {
  id: number;
  name: string;
  repo_path: string;
  command: string;
  enabled: boolean;
  timeout_seconds: number;
  repo_id: number | null;
  prompt: string;
  repo_name?: string;
  ai_type?: string;
  created_at: string;
  updated_at: string;
}

export interface JobCreateInput {
  name: string;
  repo_path?: string;
  command?: string;
  repo_id?: number;
  prompt?: string;
  enabled?: boolean;
  timeout_seconds?: number;
}

export interface JobUpdateInput {
  name?: string;
  repo_path?: string;
  command?: string;
  repo_id?: number | null;
  prompt?: string;
  enabled?: boolean;
  timeout_seconds?: number;
}
