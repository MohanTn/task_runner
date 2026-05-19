import { useCallback, useState } from 'react';
import type { Cron } from '../../types/crons.js';
import { cronApi } from '../../api/crons.api.js';
import { Select } from '../../ui/index.js';

interface Props {
  jobId: number;
  crons: Cron[];
  onChanged: () => Promise<void>;
}

async function reassign(jobId: number, allCrons: Cron[], newCronId: number | null): Promise<void> {
  for (const cron of allCrons) {
    if (cron.job_ids.includes(jobId)) await cronApi.removeJob(cron.id, jobId);
  }
  if (newCronId !== null) await cronApi.addJob(newCronId, jobId);
}

export function JobScheduleSelect({ jobId, crons, onChanged }: Props) {
  const [saving, setSaving] = useState(false);
  const currentCron = crons.find((c) => c.job_ids.includes(jobId));

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCronId = e.target.value ? Number(e.target.value) : null;
      setSaving(true);
      try {
        await reassign(jobId, crons, newCronId);
        await onChanged();
      } catch (err) {
        console.error('[JobScheduleSelect] failed:', err);
      } finally {
        setSaving(false);
      }
    },
    [jobId, crons, onChanged],
  );

  return (
    <Select
      value={currentCron?.id ?? ''}
      onChange={handleChange}
      disabled={saving}
      aria-label="Assign schedule"
      className="text-xs h-7"
    >
      <option value="">— None —</option>
      {crons.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </Select>
  );
}
