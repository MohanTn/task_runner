import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Job } from '../types/jobs.js';
import type { Settings } from '../types/settings.js';
import type { Repo } from '../types/repos.js';
import type { CliConfig } from '../types/cli-configs.js';
import { jobApi } from '../api/jobs.api.js';
import { settingsApi } from '../api/settings.api.js';
import { repoApi } from '../api/repos.api.js';
import { cliConfigApi } from '../api/cli-configs.api.js';

interface AppState {
  jobs: Job[];
  settings: Settings | null;
  repos: Repo[];
  cliConfigs: CliConfig[];

  refreshJobs: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshRepos: () => Promise<void>;
  refreshCliConfigs: () => Promise<void>;
  refreshAll: () => Promise<void>;

  applySettingsChange: (key: string, value: unknown) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [cliConfigs, setCliConfigs] = useState<CliConfig[]>([]);

  const refreshJobs = useCallback(async () => {
    try {
      const data = await jobApi.list();
      setJobs(data);
    } catch { /* ignore */ }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await settingsApi.getAll();
      setSettings(data);
    } catch { /* ignore */ }
  }, []);

  const refreshRepos = useCallback(async () => {
    try {
      const data = await repoApi.list();
      setRepos(data);
    } catch { /* ignore */ }
  }, []);

  const refreshCliConfigs = useCallback(async () => {
    try {
      const data = await cliConfigApi.list();
      setCliConfigs(data);
    } catch { /* ignore */ }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshJobs(),
      refreshSettings(),
      refreshRepos(),
      refreshCliConfigs(),
    ]);
  }, [refreshJobs, refreshSettings, refreshRepos, refreshCliConfigs]);

  const applySettingsChange = useCallback((key: string, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <AppStateContext.Provider
      value={{
        jobs,
        settings,
        repos,
        cliConfigs,
        refreshJobs,
        refreshSettings,
        refreshRepos,
        refreshCliConfigs,
        refreshAll,
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
