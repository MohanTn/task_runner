import { BaseClient } from './base.js';
import type { Cron, CronCreateInput, CronUpdateInput } from '../types/crons.js';

class CronsApi extends BaseClient {
  list(): Promise<Cron[]> {
    return this.get<Cron[]>('/api/crons');
  }

  create(data: CronCreateInput): Promise<Cron> {
    return this.post<Cron>('/api/crons', data);
  }

  update(id: number, data: CronUpdateInput): Promise<Cron> {
    return this.put<Cron>(`/api/crons/${id}`, data);
  }

  remove(id: number): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/api/crons/${id}`);
  }

  toggle(id: number): Promise<Cron> {
    return this.post<Cron>(`/api/crons/${id}/toggle`);
  }

  addJob(cronId: number, jobId: number): Promise<Cron> {
    return this.post<Cron>(`/api/crons/${cronId}/jobs`, { job_id: jobId });
  }

  removeJob(cronId: number, jobId: number): Promise<Cron> {
    return this.delete<Cron>(`/api/crons/${cronId}/jobs/${jobId}`);
  }
}

export const cronApi = new CronsApi();
