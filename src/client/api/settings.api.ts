import { BaseClient } from './base.js';
import type { Settings, HealthStatus } from '../types/settings.js';

class SettingsApi extends BaseClient {
  getAll(): Promise<Settings> {
    return this.get('/api/settings');
  }

  update(settings: Partial<Settings>): Promise<Settings> {
    return this.put('/api/settings', settings);
  }

  cronStart(): Promise<{ success: boolean; cron_running: boolean }> {
    return this.post('/api/control/cron/start');
  }

  cronStop(): Promise<{ success: boolean; cron_running: boolean }> {
    return this.post('/api/control/cron/stop');
  }

  health(): Promise<HealthStatus> {
    return this.get('/api/control/health');
  }

  cancelAll(): Promise<{ success: boolean }> {
    return this.post('/api/control/worker/cancel-all');
  }
}

export const settingsApi = new SettingsApi();
