export interface Repo {
  id: number;
  name: string;
  path: string;
  ai_type: string;
  created_at: string;
  updated_at: string;
}

export interface RepoCreateInput {
  name: string;
  path: string;
  ai_type: string;
}

export interface RepoUpdateInput {
  name?: string;
  path?: string;
  ai_type?: string;
}
