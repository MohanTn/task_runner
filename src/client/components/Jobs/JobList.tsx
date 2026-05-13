import { useState } from 'react';
import { useAppState } from '../../state/AppState.js';
import { JobCard } from './JobCard.js';
import { JobEditor } from './JobEditor.js';
import type { JobCreateInput, JobUpdateInput } from '../../types/jobs.js';
import { jobApi } from '../../api/jobs.api.js';
import styles from './JobList.module.css';

export function JobList() {
  const { jobs, refreshJobs } = useAppState();
  const [editing, setEditing] = useState<{ job?: typeof jobs[0] } | null>(null);

  const handleCreate = async (data: JobCreateInput) => {
    await jobApi.create(data);
    setEditing(null);
    await refreshJobs();
  };

  const handleUpdate = async (id: number, data: JobUpdateInput) => {
    await jobApi.update(id, data);
    setEditing(null);
    await refreshJobs();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Jobs</h1>
        <button className={styles.addBtn} onClick={() => setEditing({})}>
          + Add Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <p className={styles.empty}>
          No jobs configured yet. Click "Add Job" to create your first one.
        </p>
      ) : (
        <div className={styles.grid}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={(job) => setEditing({ job })}
              onToggled={refreshJobs}
            />
          ))}
        </div>
      )}

      {editing && (
        <JobEditor
          job={editing.job}
          onSave={(data) =>
            editing.job
              ? handleUpdate(editing.job.id, data)
              : handleCreate(data as JobCreateInput)
          }
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
