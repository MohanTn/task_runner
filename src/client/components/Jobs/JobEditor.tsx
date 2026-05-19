import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Infinity as InfIcon } from 'lucide-react';
import type { Job, RunMode } from '../../types/jobs.js';
import type { Repo } from '../../types/repos.js';
import type { CliConfig } from '../../types/cli-configs.js';
import type { Cron } from '../../types/crons.js';
import { Banner, Button, Field, Input, Modal, Select, Textarea, cn } from '../../ui/index.js';

export interface JobSaveData {
  name: string;
  repo_id: number;
  prompt: string;
  pre_cmd: string;
  post_cmd: string;
  timeout_seconds: number;
  run_mode: RunMode;
  cron_id: number | null;
}

interface Props {
  job?: Job;
  repos: Repo[];
  cliConfigs: CliConfig[];
  crons: Cron[];
  onSave: (data: JobSaveData) => Promise<void>;
  onCancel: () => void;
}

interface FormState {
  name: string;
  repoId: number | '';
  prompt: string;
  preCmd: string;
  postCmd: string;
  timeoutSeconds: number;
  runMode: RunMode;
  cronId: number | '';
  saving: boolean;
  error: string | null;
}

function initialForm(job: Job | undefined): FormState {
  return {
    name: job?.name ?? '',
    repoId: job?.repo_id ?? '',
    prompt: job?.prompt ?? '',
    preCmd: job?.pre_cmd ?? '',
    postCmd: job?.post_cmd ?? '',
    timeoutSeconds: job?.timeout_seconds ?? 1800,
    runMode: job?.run_mode ?? 'multiple',
    cronId: job?.cron_id ?? '',
    saving: false,
    error: null,
  };
}

export function JobEditor({ job, repos, cliConfigs, crons, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(() => initialForm(job));

  const { selectedRepo, commandPreview } = useMemo(() => {
    const repo = repos.find((r) => r.id === form.repoId);
    const cli = cliConfigs.find((c) => c.cli_name === repo?.ai_type);
    return { selectedRepo: repo, commandPreview: cli?.command_template ?? '' };
  }, [repos, cliConfigs, form.repoId]);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((s) => ({ ...s, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { update('error', 'Name is required'); return; }
    if (!form.repoId) { update('error', 'Please select a repo'); return; }
    if (!form.prompt.trim()) { update('error', 'Prompt is required'); return; }
    setForm((s) => ({ ...s, saving: true, error: null }));
    try {
      await onSave({
        name: form.name.trim(),
        repo_id: form.repoId as number,
        prompt: form.prompt.trim(),
        pre_cmd: form.preCmd.trim(),
        post_cmd: form.postCmd.trim(),
        timeout_seconds: form.timeoutSeconds,
        run_mode: form.runMode,
        cron_id: form.cronId ? (form.cronId as number) : null,
      });
    } catch (err) {
      setForm((s) => ({ ...s, saving: false, error: err instanceof Error ? err.message : 'Failed to save job' }));
    }
  }, [form, onSave, update]);

  return (
    <Modal
      title={job ? 'Edit Job' : 'New Job'}
      subtitle="Configure the prompt, repo, schedule, and run mode."
      onClose={onCancel}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={form.saving}>
            {form.saving ? 'Saving…' : job ? 'Save changes' : 'Create job'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {form.error && <Banner tone="error">{form.error}</Banner>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="review-mr-1122"
              autoFocus
            />
          </Field>
          <Field label="Repo">
            <Select value={form.repoId} onChange={(e) => update('repoId', Number(e.target.value) || '')}>
              <option value="">— Select repo —</option>
              {repos.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.ai_type})</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Prompt" hint={selectedRepo ? `CLI: ${selectedRepo.ai_type}` : undefined}>
          <Textarea
            value={form.prompt}
            onChange={(e) => update('prompt', e.target.value)}
            placeholder="review PR #123 and summarize changes"
            rows={3}
          />
        </Field>

        <Field label="Pre-Command" optional>
          <Textarea
            value={form.preCmd}
            onChange={(e) => update('preCmd', e.target.value)}
            placeholder="git fetch origin && git reset --hard origin/main"
            rows={2}
          />
        </Field>

        <Field label="Post-Command" optional>
          <Textarea
            value={form.postCmd}
            onChange={(e) => update('postCmd', e.target.value)}
            placeholder='powershell.exe -c "(New-Object Media.SoundPlayer).PlaySync()"'
            rows={2}
          />
        </Field>

        {commandPreview && (
          <Field label="CLI Template">
            <pre className="font-mono text-xs px-3 py-2 rounded-md bg-[color:var(--c-surface-2)] border border-[color:var(--c-border)] text-[color:var(--c-text-2)] overflow-x-auto">
              {commandPreview}
            </pre>
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Schedule">
            <Select value={form.cronId} onChange={(e) => update('cronId', Number(e.target.value) || '')}>
              <option value="">None (manual only)</option>
              {crons.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.expression}</option>
              ))}
            </Select>
          </Field>
          <Field label="Timeout (seconds)">
            <Input
              type="number"
              value={form.timeoutSeconds}
              onChange={(e) => update('timeoutSeconds', Number(e.target.value))}
              min={10}
              max={86400}
            />
          </Field>
        </div>

        <Field label="Run Mode">
          <div className="grid grid-cols-2 gap-2">
            <RunModeOption
              active={form.runMode === 'multiple'}
              icon={<InfIcon size={16} />}
              label="Multiple"
              desc="Runs on every trigger"
              onClick={() => update('runMode', 'multiple')}
            />
            <RunModeOption
              active={form.runMode === 'single'}
              icon={<span className="font-mono text-base font-bold">1</span>}
              label="Single"
              desc="Auto-disables after first run"
              onClick={() => update('runMode', 'single')}
            />
          </div>
        </Field>
      </form>
    </Modal>
  );
}

function RunModeOption({
  active, icon, label, desc, onClick,
}: { active: boolean; icon: React.ReactNode; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-2.5 p-3 rounded-md border text-left transition-colors',
        active
          ? 'border-[color:var(--c-accent)] bg-[color:var(--c-accent-soft)]'
          : 'border-[color:var(--c-border-2)] hover:bg-[color:var(--c-surface-2)]',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md shrink-0',
          active
            ? 'bg-[color:var(--c-accent)] text-white'
            : 'bg-[color:var(--c-surface-2)] text-[color:var(--c-text-2)]',
        )}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-medium', active ? 'text-[color:var(--c-accent)]' : 'text-[color:var(--c-text)]')}>
          {label}
        </div>
        <div className="text-xs text-[color:var(--c-text-2)] mt-0.5">{desc}</div>
      </div>
    </button>
  );
}
