import { BaseClient } from './base.js';
import type { CliConfig } from '../types/cli-configs.js';

class CliConfigsApi extends BaseClient {
  list(): Promise<CliConfig[]> {
    return this.get<CliConfig[]>('/api/cli-configs');
  }

  create(data: { cli_name: string; command_template: string }): Promise<CliConfig> {
    return this.post<CliConfig>('/api/cli-configs', data);
  }

  update(cliName: string, data: { command_template: string }): Promise<CliConfig> {
    return this.put<CliConfig>(`/api/cli-configs/${cliName}`, data);
  }

  remove(cliName: string): Promise<void> {
    return this.delete<void>(`/api/cli-configs/${cliName}`);
  }
}

export const cliConfigApi = new CliConfigsApi();
