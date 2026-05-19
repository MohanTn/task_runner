import { useCallback, useState } from 'react';
import { Code2, Edit2, Plus, Trash2 } from 'lucide-react';
import type { CliConfig } from '../../types/cli-configs.js';
import { cliConfigApi } from '../../api/cli-configs.api.js';
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyRow,
  IconButton,
  Input,
  TH,
  THead,
  Table,
  useToast,
} from '../../ui/index.js';

interface Props {
  cliConfigs: CliConfig[];
  onChanged: () => Promise<void> | void;
}

interface EditState {
  cliName: string;
  template: string;
  saving: boolean;
  isNew: boolean;
}

export function CliConfigsCard({ cliConfigs, onChanged }: Props) {
  const toast = useToast();
  const [edit, setEdit] = useState<EditState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CliConfig | null>(null);

  const startEdit = useCallback(
    (cfg: CliConfig) => setEdit({ cliName: cfg.cli_name, template: cfg.command_template, saving: false, isNew: false }),
    [],
  );
  const startAdd = useCallback(
    () => setEdit({ cliName: '', template: '', saving: false, isNew: true }),
    [],
  );
  const cancel = useCallback(() => setEdit(null), []);

  const handleSave = useCallback(async () => {
    if (!edit) return;
    if (!edit.cliName.trim() || !edit.template.trim()) return;
    setEdit({ ...edit, saving: true });
    try {
      if (edit.isNew) {
        await cliConfigApi.create({ cli_name: edit.cliName.trim(), command_template: edit.template.trim() });
        toast.success(`CLI '${edit.cliName.trim()}' added`);
      } else {
        await cliConfigApi.update(edit.cliName, { command_template: edit.template.trim() });
        toast.success('Command template updated', edit.cliName);
      }
      setEdit(null);
      await onChanged();
    } catch (err) {
      toast.error('Failed to save CLI config', err instanceof Error ? err.message : undefined);
      setEdit({ ...edit, saving: false });
    }
  }, [edit, onChanged, toast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    try {
      await cliConfigApi.remove(target.cli_name);
      setConfirmDelete(null);
      toast.success(`CLI '${target.cli_name}' deleted`);
      await onChanged();
    } catch (err) {
      toast.error('Failed to delete CLI', err instanceof Error ? err.message : undefined);
      setConfirmDelete(null);
    }
  }, [confirmDelete, onChanged, toast]);

  const onNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setEdit((s) => (s ? { ...s, cliName: e.target.value } : s)),
    [],
  );
  const onTemplateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setEdit((s) => (s ? { ...s, template: e.target.value } : s)),
    [],
  );
  const cancelDelete = useCallback(() => setConfirmDelete(null), []);

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        icon={<Code2 size={14} />}
        title="CLI command templates"
        subtitle="Prefix prepended to every job prompt — referenced by repo AI type"
        actions={
          !edit && (
            <Button variant="primary" size="sm" leftIcon={<Plus size={12} />} onClick={startAdd}>
              Add CLI
            </Button>
          )
        }
      />
      <Table>
        <THead>
          <tr>
            <TH className="w-44">CLI name</TH>
            <TH>Command template</TH>
            <TH className="text-right w-24">Actions</TH>
          </tr>
        </THead>
        <tbody>
          {cliConfigs.map((cfg) => {
            const isEditing = edit?.cliName === cfg.cli_name && !edit.isNew;
            return isEditing && edit ? (
              <tr key={cfg.cli_name} className="bg-[color:var(--c-surface-2)]">
                <td className="px-3 py-2 font-mono text-xs text-[color:var(--c-text-2)]">{cfg.cli_name}</td>
                <td className="px-3 py-2">
                  <Input value={edit.template} onChange={onTemplateChange} mono autoFocus />
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="primary" onClick={handleSave} disabled={edit.saving}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
                  </div>
                </td>
              </tr>
            ) : (
              <CliRow key={cfg.cli_name} cfg={cfg} onEdit={startEdit} onDelete={setConfirmDelete} />
            );
          })}
          {edit?.isNew && (
            <tr className="bg-[color:var(--c-surface-2)]">
              <td className="px-3 py-2">
                <Input value={edit.cliName} onChange={onNameChange} mono placeholder="python3" autoFocus />
              </td>
              <td className="px-3 py-2">
                <Input value={edit.template} onChange={onTemplateChange} mono placeholder="python3 /path/to/script.py" />
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="primary" onClick={handleSave} disabled={edit.saving || !edit.cliName.trim() || !edit.template.trim()}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
                </div>
              </td>
            </tr>
          )}
          {cliConfigs.length === 0 && !edit && (
            <EmptyRow colSpan={3}>No CLI configs yet.</EmptyRow>
          )}
        </tbody>
      </Table>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete CLI"
          message={`Delete CLI "${confirmDelete.cli_name}"? Repos using it will break.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </Card>
  );
}

function CliRow({ cfg, onEdit, onDelete }: { cfg: CliConfig; onEdit: (c: CliConfig) => void; onDelete: (c: CliConfig) => void }) {
  const handleEdit = useCallback(() => onEdit(cfg), [cfg, onEdit]);
  const handleDelete = useCallback(() => onDelete(cfg), [cfg, onDelete]);
  return (
    <tr className="border-b border-[color:var(--c-border)] last:border-0 hover:bg-[color:var(--c-surface-2)]">
      <td className="px-3 py-2 font-mono text-xs text-[color:var(--c-text)] font-semibold">{cfg.cli_name}</td>
      <td className="px-3 py-2">
        <code className="font-mono text-xs text-[color:var(--c-text-2)]">{cfg.command_template}</code>
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-0.5">
          <IconButton label="Edit" size="sm" onClick={handleEdit}><Edit2 size={13} /></IconButton>
          <IconButton label="Delete" tone="danger" size="sm" onClick={handleDelete}><Trash2 size={13} /></IconButton>
        </div>
      </td>
    </tr>
  );
}
