import { BaseClient } from './base.js';

class ExecutionsApi extends BaseClient {
  trigger(jobId: number): Promise<{ launched: boolean }> {
    return this.request<{ launched: boolean }>('POST', '/api/executions/trigger', { job_id: jobId });
  }
}

export const executionApi = new ExecutionsApi();
