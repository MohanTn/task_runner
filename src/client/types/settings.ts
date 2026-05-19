export interface Settings {
  cron_enabled: boolean;
  terminal_mode?: 'wt' | 'powershell';
  wt_exe_path?: string;
  powershell_exe_path?: string;
  [key: string]: unknown;
}

export interface HealthStatus {
  status: 'ok';
  uptime: number;
  cron: { running: boolean; jobs: number };
}
