import { BaseClient } from './base.js';
import type { Job, JobCreateInput, JobUpdateInput } from '../types/jobs.js';

class JobsApi extends BaseClient {
  list(): Promise<Job[]> {
    return this.request<Job[]>('GET', '/api/jobs');
  }

  getById(id: number): Promise<Job> {
    return this.request<Job>('GET', `/api/jobs/${id}`);
  }

  create(data: JobCreateInput): Promise<Job> {
    return this.post('/api/jobs', data);
  }

  update(id: number, data: JobUpdateInput): Promise<Job> {
    return this.request<Job>('PUT', `/api/jobs/${id}`, data);
  }

  remove(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('DELETE', `/api/jobs/${id}`);
  }

  toggle(id: number): Promise<Job> {
    return this.request<Job>('POST', `/api/jobs/${id}/toggle`);
  }
}

export const jobApi = new JobsApi();
