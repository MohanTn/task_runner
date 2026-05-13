import { BaseClient } from './base.js';
import type { CliConfig } from '../types/cli-configs.js';

class CliConfigsApi extends BaseClient {
  list(): Promise<CliConfig[]> {
    return this.get<CliConfig[]>('/api/cli-configs');
  }

  update(cliName: string, data: { command_template: string }): Promise<CliConfig> {
    return this.put<CliConfig>(`/api/cli-configs/${cliName}`, data);
  }
}

export const cliConfigApi = new CliConfigsApi();
