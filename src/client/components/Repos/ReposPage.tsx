import { useCallback, useMemo, useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { useAppState } from '../../state/AppState.js';
import { repoApi } from '../../api/repos.api.js';
import {
  Banner,
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  useToast,
} from '../../ui/index.js';
import type { Repo } from '../../types/repos.js';
import { RepoCard, groupReposByPath } from './RepoCard.js';
import { RepoEditor } from './RepoEditor.js';

interface EditorState {
  repo?: Repo;
  prefillPath?: string;
}

export function ReposPage() {
  const { repos, cliConfigs, refreshAll } = useAppState();
  const toast = useToast();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Repo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => groupReposByPath(repos), [repos]);

  const openNew = useCallback(() => setEditor({}), []);
  const closeEditor = useCallback(() => setEditor(null), []);
  const handleEdit = useCallback((repo: Repo) => setEditor({ repo }), []);
  const handleAddAi = useCallback((path: string) => setEditor({ prefillPath: path }), []);
  const requestDelete = useCallback((repo: Repo) => setConfirmDelete(repo), []);
  const cancelDelete = useCallback(() => setConfirmDelete(null), []);
  const dismissError = useCallback(() => setError(null), []);

  const handleSave = useCallback(async (data: { name: string; path: string; ai_type: string }) => {
    try {
      if (editor?.repo) {
        const wasAiChange = editor.repo.ai_type !== data.ai_type;
        await repoApi.update(editor.repo.id, data);
        if (wasAiChange) {
          toast.success(`AI type updated`, `${data.name} → ${data.ai_type}`);
        } else {
          toast.success(`Repository '${data.name}' updated`);
        }
      } else {
        await repoApi.create(data);
        const sharedPath = repos.some((r) => r.path === data.path);
        if (sharedPath) {
          toast.success(`AI type '${data.ai_type}' added to '${data.name}'`);
        } else {
          toast.success(`Repository '${data.name}' added`);
        }
      }
      setEditor(null);
      await refreshAll();
    } catch (err) {
      toast.error('Failed to save repo', err instanceof Error ? err.message : undefined);
    }
  }, [editor, refreshAll, repos, toast]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    const isLastForPath = repos.filter((r) => r.path === target.path).length <= 1;
    try {
      await repoApi.remove(target.id);
      setConfirmDelete(null);
      if (isLastForPath) {
        toast.success(`Repository '${target.name}' deleted`);
      } else {
        toast.success(`AI type '${target.ai_type}' removed from '${target.name}'`);
      }
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      toast.error('Failed to delete', err instanceof Error ? err.message : undefined);
      setConfirmDelete(null);
    }
  }, [confirmDelete, refreshAll, repos, toast]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Repos"
        description="Each path can have multiple AI/CLI bindings. Jobs reference one repo."
        actions={
          <Button variant="primary" size="md" leftIcon={<FolderPlus size={14} />} onClick={openNew}>
            Add repo
          </Button>
        }
      />

      {error && <Banner tone="error" onDismiss={dismissError}>{error}</Banner>}

      {groups.length === 0 ? (
        <Card padded className="text-center py-12">
          <FolderPlus size={28} className="mx-auto text-[color:var(--c-text-3)] mb-3" />
          <p className="text-sm text-[color:var(--c-text-2)] mb-4">
            No repos yet. Add one to start configuring jobs.
          </p>
          <Button variant="primary" onClick={openNew}>Add your first repo</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((g) => (
            <RepoCard
              key={g.path}
              group={g}
              onEdit={handleEdit}
              onDelete={requestDelete}
              onAddAi={handleAddAi}
            />
          ))}
        </div>
      )}

      {editor && (
        <RepoEditor
          repo={editor.repo}
          prefillPath={editor.prefillPath}
          cliConfigs={cliConfigs}
          onSave={handleSave}
          onCancel={closeEditor}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete repo binding"
          message={`Delete "${confirmDelete.name}" (${confirmDelete.ai_type})? Jobs referencing it will lose their binding.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
