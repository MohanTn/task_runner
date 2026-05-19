import { useCallback, useState, type FormEvent } from 'react';
import type { Repo } from '../../types/repos.js';
import type { CliConfig } from '../../types/cli-configs.js';
import { Banner, Button, Field, Input, Modal, Select } from '../../ui/index.js';

interface Props {
  repo?: Repo;
  prefillPath?: string;
  cliConfigs: CliConfig[];
  onSave: (data: { name: string; path: string; ai_type: string }) => Promise<void>;
  onCancel: () => void;
}

export function RepoEditor({ repo, prefillPath, cliConfigs, onSave, onCancel }: Props) {
  const [name, setName] = useState(repo?.name ?? '');
  const [path, setPath] = useState(repo?.path ?? prefillPath ?? '');
  const [aiType, setAiType] = useState(repo?.ai_type ?? cliConfigs[0]?.cli_name ?? 'claude');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !path.trim()) { setError('Name and path are required'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), path: path.trim(), ai_type: aiType });
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to save repo');
    }
  }, [name, path, aiType, onSave]);

  const handleName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value), []);
  const handlePath = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value), []);
  const handleAi = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setAiType(e.target.value), []);

  return (
    <Modal
      title={repo ? 'Edit repo' : 'Add repo'}
      subtitle="A repo binds a project path to an AI CLI."
      onClose={onCancel}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : repo ? 'Save' : 'Add'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <Banner tone="error">{error}</Banner>}
        <Field label="Name">
          <Input value={name} onChange={handleName} placeholder="my-project" mono autoFocus />
        </Field>
        <Field label="Path" hint="Absolute path on the host (Windows or WSL).">
          <Input value={path} onChange={handlePath} placeholder="/home/user/project" mono />
        </Field>
        <Field label="AI / CLI type">
          <Select value={aiType} onChange={handleAi}>
            {cliConfigs.map((c) => (
              <option key={c.cli_name} value={c.cli_name}>{c.cli_name}</option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
