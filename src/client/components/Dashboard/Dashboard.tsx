import { useCallback, useMemo, useState } from 'react';
import {
  CalendarClock,
  FolderGit2,
  ListChecks,
  RefreshCw,
} from 'lucide-react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import { executionApi } from '../../api/executions.api.js';
import { Badge, Banner, Button, PageHeader, useToast } from '../../ui/index.js';
import type { AppTab } from '../../App.js';
import { StatTile } from './StatTile.js';
import { CronControlTile } from './CronControlTile.js';
import { QuickTriggerCard } from './QuickTriggerCard.js';
import { UpcomingRunsCard } from './UpcomingRunsCard.js';
import { RecentJobsCard } from './RecentJobsCard.js';

interface Props {
  onNavigate: (tab: AppTab) => void;
}

export function Dashboard({ onNavigate }: Props) {
  const { jobs, repos, crons, settings, refreshAll } = useAppState();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const cronOn = settings?.cron_enabled === true;

  const stats = useMemo(() => {
    const enabled = jobs.filter((j) => j.enabled).length;
    const single = jobs.filter((j) => j.run_mode === 'single').length;
    const scheduled = jobs.filter((j) => crons.some((c) => c.job_ids.includes(j.id))).length;
    return { enabled, single, scheduled };
  }, [jobs, crons]);

  const handleCronToggle = useCallback(async () => {
    try {
      if (cronOn) {
        await settingsApi.cronStop();
        toast.success('Cron scheduler stopped');
      } else {
        await settingsApi.cronStart();
        toast.success('Cron scheduler started');
      }
      await refreshAll();
    } catch (err) {
      toast.error(cronOn ? 'Could not stop cron scheduler' : 'Could not start cron scheduler',
        err instanceof Error ? err.message : undefined);
    }
  }, [cronOn, refreshAll, toast]);

  const handleTrigger = useCallback(async (jobId: number) => {
    setError(null);
    const job = jobs.find((j) => j.id === jobId);
    const name = job?.name ?? `#${jobId}`;
    const modeLabel = job?.run_mode === 'single' ? 'single run' : 'multi run';
    try {
      await executionApi.trigger(jobId);
      toast.success(`Job '${name}' triggered`, modeLabel);
      await refreshAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(`Failed to trigger '${name}'`, message);
    }
  }, [jobs, refreshAll, toast]);

  const dismissError = useCallback(() => setError(null), []);
  const goJobs = useCallback(() => onNavigate('jobs'), [onNavigate]);
  const goRepos = useCallback(() => onNavigate('repos'), [onNavigate]);
  const goSchedules = useCallback(() => onNavigate('schedules'), [onNavigate]);

  const repoAiTypes = useMemo(
    () => [...new Set(repos.map((r) => r.ai_type))].slice(0, 3).join(' · ') || '—',
    [repos],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="At-a-glance overview of jobs, schedules, and quick actions."
        actions={
          <Button variant="ghost" size="md" leftIcon={<RefreshCw size={14} />} onClick={refreshAll}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Banner tone="error" onDismiss={dismissError}>
          <strong>Launch failed:</strong> {error}
        </Banner>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={<ListChecks size={16} />}
          label="Total Jobs"
          value={jobs.length}
          sub={
            <>
              <Badge tone="success" dot>{stats.enabled} enabled</Badge>
              <Badge tone="brand">{stats.single} single-run</Badge>
            </>
          }
          onClick={goJobs}
        />
        <StatTile
          icon={<CalendarClock size={16} />}
          label="Schedules"
          value={crons.length}
          sub={
            <Badge tone={cronOn ? 'success' : 'neutral'} dot>
              {stats.scheduled} jobs scheduled
            </Badge>
          }
          onClick={goSchedules}
        />
        <StatTile
          icon={<FolderGit2 size={16} />}
          label="Repos"
          value={repos.length}
          sub={<span className="text-[color:var(--c-text-3)]">{repoAiTypes}</span>}
          onClick={goRepos}
        />
        <CronControlTile running={cronOn} onToggle={handleCronToggle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <QuickTriggerCard jobs={jobs} onTrigger={handleTrigger} onManage={goJobs} />
        <div className="space-y-4">
          <UpcomingRunsCard crons={crons} onOpen={goSchedules} />
          <RecentJobsCard jobs={jobs} />
        </div>
      </div>
    </div>
  );
}
