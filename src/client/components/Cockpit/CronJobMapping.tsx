import { useState } from 'react';
import type { Cron } from '../../types/crons.js';
import type { Job } from '../../types/jobs.js';
import { cronApi } from '../../api/crons.api.js';
import styles from './CronsManager.module.css';

interface PanelState { selectedJobId: number | ''; adding: boolean; }

function JobChip({ job, onRemove }: { job: Job; onRemove: (id: number) => void }) {
  function handleClick() { onRemove(job.id); }
  return (
    <span className={styles.chip}>
      {job.name}
      <button className={styles.chipRemove} onClick={handleClick} title="Remove">×</button>
    </span>
  );
}

export function CronJobMapping({ cron, jobs, onChanged, compact }: {
  cron: Cron;
  jobs: Job[];
  onChanged: () => Promise<void>;
  compact?: boolean;
}) {
  const [panel, setPanel] = useState<PanelState>({ selectedJobId: '', adding: false });

  const mapped = jobs.filter((j) => cron.job_ids.includes(j.id));
  const unmapped = jobs.filter((j) => !cron.job_ids.includes(j.id));

  function onSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    setPanel((p) => ({ ...p, selectedJobId: Number(e.target.value) || '' }));
  }

  async function handleAdd() {
    if (!panel.selectedJobId) return;
    setPanel((p) => ({ ...p, adding: true }));
    try {
      await cronApi.addJob(cron.id, panel.selectedJobId as number);
      setPanel({ selectedJobId: '', adding: false });
      await onChanged();
    } catch {
      setPanel((p) => ({ ...p, adding: false }));
    }
  }

  async function handleRemove(jobId: number) {
    try { await cronApi.removeJob(cron.id, jobId); await onChanged(); } catch { /* ignore */ }
  }

  const panelClass = compact ? styles.mappingPanelCompact : styles.mappingPanel;

  return (
    <div className={panelClass}>
      {!compact && <div className={styles.mappingLabel}>Linked jobs</div>}
      <div className={styles.chips}>
        {mapped.length === 0 && <span className={styles.noJobs}>None</span>}
        {mapped.map((j) => <JobChip key={j.id} job={j} onRemove={handleRemove} />)}
        {unmapped.length > 0 && (
          <span className={styles.addInline}>
            <select className={styles.addSelect} value={panel.selectedJobId} onChange={onSelect}>
              <option value="">+ link job</option>
              {unmapped.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            {panel.selectedJobId !== '' && (
              <button className="btn btn-sm btn-primary" onClick={handleAdd} disabled={panel.adding}>
                Add
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
