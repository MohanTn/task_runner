export interface Settings {
  cron_enabled: boolean;
  cron_expression: string;
  [key: string]: unknown;
}

export interface HealthStatus {
  status: 'ok';
  uptime: number;
  cron: { running: boolean; jobs: number };
}
