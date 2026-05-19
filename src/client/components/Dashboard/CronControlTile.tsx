import { Activity, Pause, Play } from 'lucide-react';
import { Badge, Button, Card } from '../../ui/index.js';

interface Props {
  running: boolean;
  onToggle: () => void;
}

export function CronControlTile({ running, onToggle }: Props) {
  return (
    <Card padded className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[color:var(--c-text-2)]">
          <Activity size={14} /> Cron Scheduler
        </span>
        <Badge tone={running ? 'success' : 'neutral'} dot>
          {running ? 'Running' : 'Stopped'}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={running ? 'danger' : 'success'}
          size="md"
          leftIcon={running ? <Pause size={14} /> : <Play size={14} />}
          onClick={onToggle}
        >
          {running ? 'Stop' : 'Start'}
        </Button>
        <span className="text-xs text-[color:var(--c-text-3)] truncate">
          {running ? 'Jobs fire on their own schedules' : 'Scheduler paused — manual only'}
        </span>
      </div>
    </Card>
  );
}
