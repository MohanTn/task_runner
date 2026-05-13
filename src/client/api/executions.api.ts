import { BaseClient } from './base.js';
import type { Execution, ExecutionListResponse, ExecutionStats } from '../types/executions.js';

interface ListParams {
  job_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
}

class ExecutionsApi extends BaseClient {
  list(params?: ListParams): Promise<ExecutionListResponse> {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString() : '';
    return this.request<ExecutionListResponse>('GET', `/api/executions${qs}`);
  }

  stats(): Promise<ExecutionStats> {
    return this.request<ExecutionStats>('GET', '/api/executions/stats');
  }

  getById(id: number): Promise<Execution> {
    return this.request<Execution>('GET', `/api/executions/${id}`);
  }

  getOutput(id: number): Promise<{ id: number; output: string; error_output: string }> {
    return this.request<{ id: number; output: string; error_output: string }>('GET', `/api/executions/${id}/output`);
  }

  trigger(jobId: number): Promise<Execution> {
    return this.request<Execution>('POST', '/api/executions/trigger', { job_id: jobId });
  }

  cancel(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('POST', `/api/executions/${id}/cancel`);
  }

  sendStdin(id: number, input: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('POST', `/api/executions/${id}/stdin`, { input });
  }

  prune(olderThanDays: number): Promise<{ deleted: number }> {
    return this.request<{ deleted: number }>('POST', '/api/executions/prune', { olderThanDays });
  }
}

export const executionApi = new ExecutionsApi();
