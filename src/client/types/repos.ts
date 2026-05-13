export interface Repo {
  id: number;
  name: string;
  path: string;
  ai_type: 'claude' | 'copilot';
  created_at: string;
  updated_at: string;
}

export interface RepoCreateInput {
  name: string;
  path: string;
  ai_type: 'claude' | 'copilot';
}

export interface RepoUpdateInput {
  name?: string;
  path?: string;
  ai_type?: 'claude' | 'copilot';
}
