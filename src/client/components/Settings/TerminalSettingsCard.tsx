import { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';
import type { Settings } from '../../types/settings.js';
import { settingsApi } from '../../api/settings.api.js';
import { Card, CardHeader, Field, Input, cn, useToast } from '../../ui/index.js';

interface Props {
  settings: Settings | null;
  onSaved: () => Promise<void>;
}

const MODE_LABEL: Record<'wt' | 'powershell', string> = {
  wt: 'Windows Terminal',
  powershell: 'PowerShell',
};

export function TerminalSettingsCard({ settings, onSaved }: Props) {
  const toast = useToast();
  const [wtPath, setWtPath] = useState(settings?.wt_exe_path ?? 'wt.exe');
  const [psPath, setPsPath] = useState(settings?.powershell_exe_path ?? 'powershell.exe');
  const lastSavedWt = useRef(settings?.wt_exe_path ?? 'wt.exe');
  const lastSavedPs = useRef(settings?.powershell_exe_path ?? 'powershell.exe');
  const mode = settings?.terminal_mode ?? 'wt';

  useEffect(() => {
    if (settings?.wt_exe_path !== undefined) {
      const v = settings.wt_exe_path as string;
      setWtPath(v);
      lastSavedWt.current = v;
    }
    if (settings?.powershell_exe_path !== undefined) {
      const v = settings.powershell_exe_path as string;
      setPsPath(v);
      lastSavedPs.current = v;
    }
  }, [settings]);

  const updateMode = useCallback(async (next: 'wt' | 'powershell') => {
    if (next === mode) return;
    try {
      await settingsApi.update({ terminal_mode: next });
      toast.success(`Default terminal changed to ${MODE_LABEL[next]}`);
      await onSaved();
    } catch (err) {
      toast.error('Failed to change terminal', err instanceof Error ? err.message : undefined);
    }
  }, [mode, onSaved, toast]);

  const handleWtBlur = useCallback(async () => {
    const next = wtPath.trim();
    if (!next || next === lastSavedWt.current) return;
    try {
      await settingsApi.update({ wt_exe_path: next });
      lastSavedWt.current = next;
      toast.success('Settings saved', 'Windows Terminal path updated');
      await onSaved();
    } catch (err) {
      toast.error('Error: Invalid path for wt.exe', err instanceof Error ? err.message : undefined);
    }
  }, [wtPath, onSaved, toast]);

  const handlePsBlur = useCallback(async () => {
    const next = psPath.trim();
    if (!next || next === lastSavedPs.current) return;
    try {
      await settingsApi.update({ powershell_exe_path: next });
      lastSavedPs.current = next;
      toast.success('Settings saved', 'PowerShell path updated');
      await onSaved();
    } catch (err) {
      toast.error('Error: Invalid path for powershell.exe', err instanceof Error ? err.message : undefined);
    }
  }, [psPath, onSaved, toast]);

  const handleWtChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setWtPath(e.target.value), []);
  const handlePsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPsPath(e.target.value), []);
  const handlePickWt = useCallback(() => updateMode('wt'), [updateMode]);
  const handlePickPs = useCallback(() => updateMode('powershell'), [updateMode]);

  return (
    <Card>
      <CardHeader
        icon={<Terminal size={14} />}
        title="Terminal launcher"
        subtitle="Pick the primary terminal — the other is the automatic fallback"
      />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <ModeTile
            active={mode === 'wt'}
            title="Windows Terminal"
            subtitle="wt.exe (tried first)"
            onClick={handlePickWt}
          />
          <ModeTile
            active={mode === 'powershell'}
            title="PowerShell"
            subtitle="powershell.exe (tried first)"
            onClick={handlePickPs}
          />
        </div>

        <Field label="Windows Terminal path" hint="Full path if not on PATH (e.g. C:\\…\\wt.exe). Saved on blur.">
          <Input value={wtPath} onChange={handleWtChange} onBlur={handleWtBlur} mono placeholder="wt.exe" />
        </Field>

        <Field label="PowerShell path" hint="Saved on blur.">
          <Input value={psPath} onChange={handlePsChange} onBlur={handlePsBlur} mono placeholder="powershell.exe" />
        </Field>
      </div>
    </Card>
  );
}

function ModeTile({ active, title, subtitle, onClick }: { active: boolean; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-3 rounded-md border text-left transition-colors',
        active
          ? 'border-[color:var(--c-accent)] bg-[color:var(--c-accent-soft)]'
          : 'border-[color:var(--c-border-2)] hover:bg-[color:var(--c-surface-2)]',
      )}
    >
      <div className={cn('text-sm font-medium', active ? 'text-[color:var(--c-accent)]' : 'text-[color:var(--c-text)]')}>
        {title}
      </div>
      <div className="text-xs text-[color:var(--c-text-2)] mt-0.5">{subtitle}</div>
    </button>
  );
}
