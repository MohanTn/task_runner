import { useCallback, useEffect, useState } from 'react';
import { Activity, CalendarClock, Pause, Play, Plus } from 'lucide-react';
import { useAppState } from '../../state/AppState.js';
import { cronApi } from '../../api/crons.api.js';
import { settingsApi } from '../../api/settings.api.js';
import { Badge, Button, Card, ConfirmDialog, PageHeader, useToast } from '../../ui/index.js';
import type { Cron } from '../../types/crons.js';
import { ScheduleList } from './ScheduleList.js';
import { ScheduleDetail } from './ScheduleDetail.js';
import { ScheduleEditor } from './ScheduleEditor.js';

type EditorState = { mode: 'new' } | { mode: 'edit'; cron: Cron } | null;

export function SchedulesPage() {
  const { crons, jobs, settings, refreshAll } = useAppState();
  const toast = useToast();
  const cronOn = settings?.cron_enabled === true;

  const [selectedId, setSelectedId] = useState<number | null>(crons[0]?.id ?? null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Cron | null>(null);

  useEffect(() => {
    if (selectedId === null && crons.length > 0) setSelectedId(crons[0].id);
    if (selectedId !== null && !crons.some((c) => c.id === selectedId)) {
      setSelectedId(crons[0]?.id ?? null);
    }
  }, [crons, selectedId]);

  const selected = crons.find((c) => c.id === selectedId) ?? null;

  const handleNew = useCallback(() => setEditor({ mode: 'new' }), []);
  const handleEdit = useCallback((cron: Cron) => setEditor({ mode: 'edit', cron }), []);
  const closeEditor = useCallback(() => setEditor(null), []);
  const requestDelete = useCallback((cron: Cron) => setConfirmDelete(cron), []);
  const cancelDelete = useCallback(() => setConfirmDelete(null), []);

  const handleSave = useCallback(async (name: string, expression: string) => {
    try {
      if (editor?.mode === 'edit') {
        await cronApi.update(editor.cron.id, { name, expression });
        toast.success(`Schedule '${name}' updated`);
      } else {
        const created = await cronApi.create({ name, expression });
        setSelectedId(created.id);
        toast.success(`Schedule '${name}' created`);
      }
      setEditor(null);
      await refreshAll();
    } catch (err) {
      toast.error('Failed to save schedule', err instanceof Error ? err.message : undefined);
      throw err;
    }
  }, [editor, refreshAll, toast]);

  const handleToggleCron = useCallback(async (cron: Cron) => {
    try {
      await cronApi.toggle(cron.id);
      toast.success(cron.enabled ? `Schedule '${cron.name}' disabled` : `Schedule '${cron.name}' enabled`);
      await refreshAll();
    } catch (err) {
      toast.error(`Failed to toggle '${cron.name}'`, err instanceof Error ? err.message : undefined);
    }
  }, [refreshAll, toast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    try {
      await cronApi.remove(target.id);
      setConfirmDelete(null);
      toast.success(`Schedule '${target.name}' deleted`);
      await refreshAll();
    } catch (err) {
      toast.error('Failed to delete', err instanceof Error ? err.message : undefined);
      setConfirmDelete(null);
    }
  }, [confirmDelete, refreshAll, toast]);

  const handleSchedulerToggle = useCallback(async () => {
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
      toast.error('Scheduler toggle failed', err instanceof Error ? err.message : undefined);
    }
  }, [cronOn, refreshAll, toast]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Schedules"
        description="Reusable cron expressions linking many jobs to a single trigger."
        actions={
          <>
            <Button
              variant={cronOn ? 'danger' : 'success'}
              size="md"
              leftIcon={cronOn ? <Pause size={14} /> : <Play size={14} />}
              onClick={handleSchedulerToggle}
            >
              {cronOn ? 'Stop scheduler' : 'Start scheduler'}
            </Button>
            <Button variant="primary" size="md" leftIcon={<Plus size={14} />} onClick={handleNew}>
              New schedule
            </Button>
          </>
        }
      />

      <Card padded className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${cronOn ? 'bg-[color:var(--c-success-soft)] text-[color:var(--c-success)]' : 'bg-[color:var(--c-surface-2)] text-[color:var(--c-text-3)]'}`}>
          <Activity size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[color:var(--c-text)]">
            Cron scheduler is {cronOn ? 'running' : 'stopped'}
          </div>
          <div className="text-xs text-[color:var(--c-text-2)]">
            {cronOn
              ? 'Enabled schedules will fire automatically.'
              : 'Manual triggers still work, but cron expressions are paused.'}
          </div>
        </div>
        <Badge tone={cronOn ? 'success' : 'neutral'} dot>
          {cronOn ? 'Live' : 'Paused'}
        </Badge>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 h-11 border-b border-[color:var(--c-border)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--c-text-2)]">
              Schedules
            </span>
            <span className="text-xs text-[color:var(--c-text-3)] tabular-nums">{crons.length}</span>
          </div>
          <ScheduleList crons={crons} selectedId={selectedId} onSelect={setSelectedId} />
        </Card>

        <Card className="overflow-hidden min-h-[420px]">
          {selected ? (
            <ScheduleDetail
              cron={selected}
              jobs={jobs}
              onEdit={handleEdit}
              onToggle={handleToggleCron}
              onDelete={requestDelete}
              onChanged={refreshAll}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <CalendarClock size={32} className="text-[color:var(--c-text-3)] mb-3" />
              <p className="text-sm text-[color:var(--c-text-2)] mb-4">
                No schedule selected — create one to get started.
              </p>
              <Button variant="primary" leftIcon={<Plus size={14} />} onClick={handleNew}>
                New schedule
              </Button>
            </div>
          )}
        </Card>
      </div>

      {editor && (
        <ScheduleEditor
          cron={editor.mode === 'edit' ? editor.cron : undefined}
          onSave={handleSave}
          onCancel={closeEditor}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete schedule"
          message={`Delete "${confirmDelete.name}"? Jobs will lose their schedule binding.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
