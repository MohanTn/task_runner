import { useState } from 'react';
import type { Cron } from '../../types/crons.js';
import { cronApi } from '../../api/crons.api.js';
import styles from './JobsTable.module.css';

interface Props {
  jobId: number;
  crons: Cron[];
  onChanged: () => Promise<void>;
}

async function reassignSchedule(jobId: number, allCrons: Cron[], newCronId: number | null): Promise<void> {
  for (const cron of allCrons) {
    if (cron.job_ids.includes(jobId)) await cronApi.removeJob(cron.id, jobId);
  }
  if (newCronId !== null) await cronApi.addJob(newCronId, jobId);
}

export function JobScheduleDropdown({ jobId, crons, onChanged }: Props) {
  const [saving, setSaving] = useState(false);
  const currentCron = crons.find((c) => c.job_ids.includes(jobId));

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCronId = e.target.value ? Number(e.target.value) : null;
    setSaving(true);
    try {
      await reassignSchedule(jobId, crons, newCronId);
      await onChanged();
    } catch (err) {
      console.error('[JobScheduleDropdown] failed to update schedule:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className={styles.scheduleSelect}
      value={currentCron?.id ?? ''}
      onChange={handleChange}
      disabled={saving}
      aria-label="Assign schedule"
    >
      <option value="">None</option>
      {crons.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}
