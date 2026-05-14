import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Job } from '../types/jobs.js';
import type { Settings } from '../types/settings.js';
import type { Repo } from '../types/repos.js';
import type { CliConfig } from '../types/cli-configs.js';
import type { Cron } from '../types/crons.js';
import { jobApi } from '../api/jobs.api.js';
import { settingsApi } from '../api/settings.api.js';
import { repoApi } from '../api/repos.api.js';
import { cliConfigApi } from '../api/cli-configs.api.js';
import { cronApi } from '../api/crons.api.js';

interface AppState {
  jobs: Job[];
  settings: Settings | null;
  repos: Repo[];
  cliConfigs: CliConfig[];
  crons: Cron[];

  refreshJobs: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshRepos: () => Promise<void>;
  refreshCliConfigs: () => Promise<void>;
  refreshCrons: () => Promise<void>;
  refreshAll: () => Promise<void>;

  applySettingsChange: (key: string, value: unknown) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [cliConfigs, setCliConfigs] = useState<CliConfig[]>([]);
  const [crons, setCrons] = useState<Cron[]>([]);

  const refreshJobs = useCallback(async () => {
    try { setJobs(await jobApi.list()); } catch { /* ignore */ }
  }, []);

  const refreshSettings = useCallback(async () => {
    try { setSettings(await settingsApi.getAll()); } catch { /* ignore */ }
  }, []);

  const refreshRepos = useCallback(async () => {
    try { setRepos(await repoApi.list()); } catch { /* ignore */ }
  }, []);

  const refreshCliConfigs = useCallback(async () => {
    try { setCliConfigs(await cliConfigApi.list()); } catch { /* ignore */ }
  }, []);

  const refreshCrons = useCallback(async () => {
    try { setCrons(await cronApi.list()); } catch { /* ignore */ }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshJobs(),
      refreshSettings(),
      refreshRepos(),
      refreshCliConfigs(),
      refreshCrons(),
    ]);
  }, [refreshJobs, refreshSettings, refreshRepos, refreshCliConfigs, refreshCrons]);

  const applySettingsChange = useCallback((key: string, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  return (
    <AppStateContext.Provider
      value={{
        jobs, settings, repos, cliConfigs, crons,
        refreshJobs, refreshSettings, refreshRepos, refreshCliConfigs, refreshCrons, refreshAll,
        applySettingsChange,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
