import { useCallback } from 'react';
import { useAppState } from '../../state/AppState.js';
import { settingsApi } from '../../api/settings.api.js';
import { PageHeader, useToast } from '../../ui/index.js';
import { CronSettingsCard } from './CronSettingsCard.js';
import { TerminalSettingsCard } from './TerminalSettingsCard.js';
import { CliConfigsCard } from './CliConfigsCard.js';

export function SettingsPanel() {
  const { settings, cliConfigs, refreshAll, refreshSettings } = useAppState();
  const toast = useToast();
  const cronOn = settings?.cron_enabled === true;

  const handleCronToggle = useCallback(async () => {
    try {
      if (cronOn) {
        await settingsApi.cronStop();
        toast.success('Cron scheduler stopped');
      } else {
        await settingsApi.cronStart();
        toast.success('Cron scheduler started');
      }
      await refreshSettings();
    } catch (err) {
      toast.error('Scheduler toggle failed', err instanceof Error ? err.message : undefined);
    }
  }, [cronOn, refreshSettings, toast]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Scheduler, terminal launcher, and CLI command templates."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CronSettingsCard running={cronOn} onToggle={handleCronToggle} />
        <TerminalSettingsCard settings={settings} onSaved={refreshSettings} />
        <CliConfigsCard cliConfigs={cliConfigs} onChanged={refreshAll} />
      </div>
    </div>
  );
}
