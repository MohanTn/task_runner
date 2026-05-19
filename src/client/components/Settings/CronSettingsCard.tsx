import { Activity, Pause, Play } from 'lucide-react';
import { Badge, Button, Card, CardHeader } from '../../ui/index.js';

interface Props {
  running: boolean;
  onToggle: () => void;
}

export function CronSettingsCard({ running, onToggle }: Props) {
  return (
    <Card>
      <CardHeader
        icon={<Activity size={14} />}
        title="Cron scheduler"
        subtitle="Master switch for all schedules"
        actions={
          <Badge tone={running ? 'success' : 'neutral'} dot>
            {running ? 'Running' : 'Stopped'}
          </Badge>
        }
      />
      <div className="p-4 space-y-3">
        <Button
          variant={running ? 'danger' : 'success'}
          size="md"
          leftIcon={running ? <Pause size={14} /> : <Play size={14} />}
          onClick={onToggle}
        >
          {running ? 'Stop scheduler' : 'Start scheduler'}
        </Button>
        <p className="text-xs text-[color:var(--c-text-2)] leading-relaxed">
          Each job fires on its own schedule — configure schedules in the <strong>Schedules</strong> tab.
          Stopping the scheduler keeps jobs intact; only the automatic triggers pause.
        </p>
      </div>
    </Card>
  );
}
