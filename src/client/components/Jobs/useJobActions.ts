import { useCallback, useState } from 'react';
import { jobApi } from '../../api/jobs.api.js';
import { executionApi } from '../../api/executions.api.js';
import { settingsApi } from '../../api/settings.api.js';
import { useToast } from '../../ui/index.js';
import type { Job, JobCreateInput, JobUpdateInput } from '../../types/jobs.js';
import type { JobSaveData } from './JobEditor.js';

export interface JobActions {
  error: string | null;
  clearError: () => void;
  run: (job: Job) => Promise<void>;
  toggle: (job: Job) => Promise<void>;
  remove: (job: Job) => Promise<void>;
  save: (data: JobSaveData, existing?: Job) => Promise<void>;
  toggleCron: (currentlyOn: boolean) => Promise<void>;
}

export function useJobActions(refreshAll: () => Promise<void>): JobActions {
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(async (job: Job) => {
    setError(null);
    try {
      await executionApi.trigger(job.id);
      toast.success(`Job '${job.name}' started`, job.run_mode === 'single' ? 'single run' : 'multi run');
      await refreshAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(`Failed to start '${job.name}'`, msg);
    }
  }, [refreshAll, toast]);

  const toggle = useCallback(async (job: Job) => {
    try {
      await jobApi.toggle(job.id);
      toast.success(job.enabled ? `Job '${job.name}' disabled` : `Job '${job.name}' enabled`);
      await refreshAll();
    } catch (err) {
      toast.error(`Failed to toggle '${job.name}'`, err instanceof Error ? err.message : undefined);
    }
  }, [refreshAll, toast]);

  const remove = useCallback(async (job: Job) => {
    try {
      await jobApi.remove(job.id);
      toast.success(`Job '${job.name}' deleted`);
      await refreshAll();
    } catch (err) {
      toast.error(`Failed to delete '${job.name}'`, err instanceof Error ? err.message : undefined);
    }
  }, [refreshAll, toast]);

  const save = useCallback(async (data: JobSaveData, existing?: Job) => {
    try {
      if (existing) {
        await jobApi.update(existing.id, data as JobUpdateInput);
        toast.success(`Job '${data.name}' updated`);
      } else {
        await jobApi.create(data as JobCreateInput);
        toast.success(`Job '${data.name}' created`);
      }
      await refreshAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(existing ? `Failed to update '${data.name}'` : 'Failed to create job', msg);
      throw err;
    }
  }, [refreshAll, toast]);

  const toggleCron = useCallback(async (currentlyOn: boolean) => {
    try {
      if (currentlyOn) {
        await settingsApi.cronStop();
        toast.success('Cron scheduler stopped');
      } else {
        await settingsApi.cronStart();
        toast.success('Cron scheduler started');
      }
      await refreshAll();
    } catch (err) {
      toast.error('Scheduler toggle failed', err instanceof Error ? err.message : undefined);
    }
  }, [refreshAll, toast]);

  return { error, clearError, run, toggle, remove, save, toggleCron };
}
