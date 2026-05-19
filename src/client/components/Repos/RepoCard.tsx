import { useCallback } from 'react';
import { Edit2, FolderGit2, Plus, Trash2 } from 'lucide-react';
import type { Repo } from '../../types/repos.js';
import { Badge, Card, IconButton, cn } from '../../ui/index.js';

interface RepoGroup {
  path: string;
  repos: Repo[];
}

interface Props {
  group: RepoGroup;
  onEdit: (repo: Repo) => void;
  onDelete: (repo: Repo) => void;
  onAddAi: (path: string) => void;
}

const AI_TONES: Record<string, 'brand' | 'success' | 'warning' | 'info' | 'neutral'> = {
  claude: 'brand',
  copilot: 'success',
  bash: 'warning',
  python3: 'info',
};

function getAiTone(name: string): 'brand' | 'success' | 'warning' | 'info' | 'neutral' {
  return AI_TONES[name] ?? 'neutral';
}

export function RepoCard({ group, onEdit, onDelete, onAddAi }: Props) {
  const handleAddAi = useCallback(() => onAddAi(group.path), [onAddAi, group.path]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 border-b border-[color:var(--c-border)]">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--c-surface-2)] text-[color:var(--c-text-2)] shrink-0">
          <FolderGit2 size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[color:var(--c-text)] truncate">
            {group.repos[0]?.name ?? '—'}
          </div>
          <code className="font-mono text-xs text-[color:var(--c-text-3)] truncate block">
            {group.path}
          </code>
        </div>
        <IconButton label="Add another AI to this path" tone="brand" size="sm" onClick={handleAddAi}>
          <Plus size={14} />
        </IconButton>
      </div>
      <ul className="divide-y divide-[color:var(--c-border)]">
        {group.repos.map((repo) => (
          <AiRow key={repo.id} repo={repo} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>
    </Card>
  );
}

function AiRow({ repo, onEdit, onDelete }: { repo: Repo; onEdit: (r: Repo) => void; onDelete: (r: Repo) => void }) {
  const handleEdit = useCallback(() => onEdit(repo), [repo, onEdit]);
  const handleDelete = useCallback(() => onDelete(repo), [repo, onDelete]);
  return (
    <li className="flex items-center gap-2 px-4 py-2">
      <Badge tone={getAiTone(repo.ai_type)} variant="soft" className={cn('font-mono')}>{repo.ai_type}</Badge>
      <span className="text-xs text-[color:var(--c-text-3)] truncate flex-1">{repo.name}</span>
      <IconButton label="Edit" size="sm" onClick={handleEdit}>
        <Edit2 size={13} />
      </IconButton>
      <IconButton label="Delete" tone="danger" size="sm" onClick={handleDelete}>
        <Trash2 size={13} />
      </IconButton>
    </li>
  );
}

export function groupReposByPath(repos: Repo[]): RepoGroup[] {
  const map = new Map<string, Repo[]>();
  for (const r of repos) {
    const list = map.get(r.path) ?? [];
    list.push(r);
    map.set(r.path, list);
  }
  return [...map.entries()]
    .map(([path, repos]) => ({ path, repos: [...repos].sort((a, b) => a.ai_type.localeCompare(b.ai_type)) }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
