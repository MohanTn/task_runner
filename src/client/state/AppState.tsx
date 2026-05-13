import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Job } from '../types/jobs.js';
import type { Execution, ExecutionStats } from '../types/executions.js';
import type { Settings, PoolStats } from '../types/settings.js';
import type { Repo } from '../types/repos.js';
import type { CliConfig } from '../types/cli-configs.js';
import { jobApi } from '../api/jobs.api.js';
import { executionApi } from '../api/executions.api.js';
import { settingsApi } from '../api/settings.api.js';
import { repoApi } from '../api/repos.api.js';
import { cliConfigApi } from '../api/cli-configs.api.js';

interface AppState {
  // Data
  jobs: Job[];
  executions: Execution[];
  executionStats: ExecutionStats | null;
  settings: Settings | null;
  poolStats: PoolStats | null;
  repos: Repo[];
  cliConfigs: CliConfig[];

  // Actions
  refreshJobs: () => Promise<void>;
  refreshExecutions: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshRepos: () => Promise<void>;
  refreshCliConfigs: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Mutation helpers (called from WS events)
  applyExecutionUpdate: (exec: Execution) => void;
  applyPoolStats: (stats: PoolStats) => void;
  applySettingsChange: (key: string, value: unknown) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [executionStats, setExecutionStats] = useState<ExecutionStats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [cliConfigs, setCliConfigs] = useState<CliConfig[]>([]);

  const refreshJobs = useCallback(async () => {
    try {
      const data = await jobApi.list();
      setJobs(data);
    } catch { /* ignore */ }
  }, []);

  const refreshExecutions = useCallback(async () => {
    try {
      const data = await executionApi.list({ limit: 50 });
      setExecutions(data.executions);
    } catch { /* ignore */ }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const data = await executionApi.stats();
      setExecutionStats(data);
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
      refreshExecutions(),
      refreshStats(),
      refreshSettings(),
      refreshRepos(),
      refreshCliConfigs(),
    ]);
  }, [refreshJobs, refreshExecutions, refreshStats, refreshSettings, refreshRepos, refreshCliConfigs]);

  const applyExecutionUpdate = useCallback((exec: Execution) => {
    setExecutions((prev) => {
      const idx = prev.findIndex((e) => e.id === exec.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = exec;
        return next;
      }
      return [exec, ...prev].slice(0, 50);
    });
    refreshStats();
  }, [refreshStats]);

  const applyPoolStats = useCallback((stats: PoolStats) => {
    setPoolStats(stats);
  }, []);

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
        executions,
        executionStats,
        settings,
        poolStats,
        repos,
        cliConfigs,
        refreshJobs,
        refreshExecutions,
        refreshStats,
        refreshSettings,
        refreshRepos,
        refreshCliConfigs,
        refreshAll,
        applyExecutionUpdate,
        applyPoolStats,
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
