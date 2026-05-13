import { BaseClient } from './base.js';
import type { Repo, RepoCreateInput, RepoUpdateInput } from '../types/repos.js';

class ReposApi extends BaseClient {
  list(): Promise<Repo[]> {
    return this.get<Repo[]>('/api/repos');
  }

  getById(id: number): Promise<Repo> {
    return this.get<Repo>(`/api/repos/${id}`);
  }

  create(data: RepoCreateInput): Promise<Repo> {
    return this.post<Repo>('/api/repos', data);
  }

  update(id: number, data: RepoUpdateInput): Promise<Repo> {
    return this.put<Repo>(`/api/repos/${id}`, data);
  }

  remove(id: number): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/api/repos/${id}`);
  }
}

export const repoApi = new ReposApi();
