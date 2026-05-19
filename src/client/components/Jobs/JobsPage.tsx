import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppState } from '../../state/AppState.js';
import { useCronRunner } from '../../hooks/useCronRunner.js';
import {
  Badge,
  Banner,
  Button,
  Card,
  ConfirmDialog,
  EmptyRow,
  PageHeader,
  TH,
  THead,
  Table,
} from '../../ui/index.js';
import type { Job } from '../../types/jobs.js';
import type { Cron } from '../../types/crons.js';
import { JobRow } from './JobRow.js';
import { JobEditor, type JobSaveData } from './JobEditor.js';
import { JobsToolbar, type JobFilter } from './JobsToolbar.js';
import { useJobActions } from './useJobActions.js';

export function JobsPage() {
  const { jobs, repos, cliConfigs, crons, settings, refreshAll } = useAppState();
  const cronOn = settings?.cron_enabled === true;
  const runningMap = useCronRunner({ crons, jobs, enabled: cronOn });
  const actions = useJobActions(refreshAll);

  const [filter, setFilter] = useState<JobFilter>('all');
  const [editing, setEditing] = useState<{ job?: Job } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Job | null>(null);

  const visible = useMemo(() => filterJobs(jobs, crons, filter), [jobs, crons, filter]);

  const handleNew = useCallback(() => setEditing({}), []);
  const handleEdit = useCallback((job: Job) => setEditing({ job }), []);
  const closeEditor = useCallback(() => setEditing(null), []);
  const requestDelete = useCallback((job: Job) => setConfirmDelete(job), []);
  const cancelDelete = useCallback(() => setConfirmDelete(null), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    await actions.remove(confirmDelete);
    setConfirmDelete(null);
  }, [confirmDelete, actions]);

  const handleSave = useCallback(async (data: JobSaveData) => {
    await actions.save(data, editing?.job);
    setEditing(null);
  }, [actions, editing]);

  const handleToggleCron = useCallback(() => actions.toggleCron(cronOn), [actions, cronOn]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Jobs"
        description="Triggerable workloads — manual runs or attached to a schedule."
        actions={
          <>
            <Button
              variant={cronOn ? 'secondary' : 'success'}
              size="md"
              onClick={handleToggleCron}
            >
              <Badge tone={cronOn ? 'success' : 'neutral'} dot variant="soft" className="!h-4 !px-1.5">
                {cronOn ? 'Scheduler on' : 'Scheduler off'}
              </Badge>
            </Button>
            <Button variant="primary" size="md" leftIcon={<Plus size={14} />} onClick={handleNew}>
              New job
            </Button>
          </>
        }
      />

      {actions.error && <Banner tone="error" onDismiss={actions.clearError}>{actions.error}</Banner>}

      <Card>
        <JobsToolbar
          filter={filter}
          onFilterChange={setFilter}
          crons={crons}
          visibleCount={visible.length}
          totalCount={jobs.length}
        />
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Mode</TH>
              <TH>Repo</TH>
              <TH>Command</TH>
              <TH>Timeout</TH>
              <TH>Schedule</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <tbody>
            {visible.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                crons={crons}
                runState={runningMap[job.id]}
                onRun={actions.run}
                onToggle={actions.toggle}
                onDelete={requestDelete}
                onEdit={handleEdit}
                onChanged={refreshAll}
              />
            ))}
            {visible.length === 0 && (
              <EmptyRow colSpan={7}>
                {jobs.length === 0 ? 'No jobs yet — create your first one.' : 'No jobs match this filter.'}
              </EmptyRow>
            )}
          </tbody>
        </Table>
      </Card>

      {editing && (
        <JobEditor
          job={editing.job}
          repos={repos}
          cliConfigs={cliConfigs}
          crons={crons}
          onSave={handleSave}
          onCancel={closeEditor}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete job"
          message={`Delete "${confirmDelete.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

function filterJobs(jobs: Job[], crons: Cron[], filter: JobFilter): Job[] {
  if (filter === 'all') return jobs;
  if (filter === 'none') return jobs.filter((j) => !crons.some((c) => c.job_ids.includes(j.id)));
  const id = Number(filter);
  const cron = crons.find((c) => c.id === id);
  return cron ? jobs.filter((j) => cron.job_ids.includes(j.id)) : jobs;
}
