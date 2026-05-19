export interface Settings {
  cron_enabled: boolean;
  terminal_mode?: 'wt' | 'powershell';
  [key: string]: unknown;
}

export interface HealthStatus {
  status: 'ok';
  uptime: number;
  cron: { running: boolean; jobs: number };
}
