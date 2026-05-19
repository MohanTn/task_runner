import {
  LayoutDashboard,
  ListChecks,
  FolderGit2,
  CalendarClock,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Activity,
  Zap,
} from 'lucide-react';
import type { AppTab } from '../../App.js';
import { useAppState } from '../../state/AppState.js';
import { useTheme } from '../../theme/ThemeProvider.js';
import { cn } from '../../ui/index.js';

const TABS: { id: AppTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs',      label: 'Jobs',      icon: ListChecks },
  { id: 'repos',     label: 'Repos',     icon: FolderGit2 },
  { id: 'schedules', label: 'Schedules', icon: CalendarClock },
  { id: 'settings',  label: 'Settings',  icon: SettingsIcon },
];

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function Navigation({ activeTab, onTabChange }: Props) {
  const { settings } = useAppState();
  const { theme, toggleTheme } = useTheme();
  const cronOn = settings?.cron_enabled === true;

  return (
    <header className="h-14 sticky top-0 z-30 flex items-center gap-6 px-5 border-b border-[color:var(--c-border)] bg-[color:var(--c-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--c-surface)]/80">
      <div className="flex items-center gap-2 select-none">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[color:var(--c-accent)] to-indigo-500 text-white">
          <Zap size={15} strokeWidth={2.5} />
        </span>
        <span className="font-semibold text-[color:var(--c-text)] tracking-tight">Task Runner</span>
      </div>

      <nav className="flex items-center gap-0.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-[color:var(--c-accent-soft)] text-[color:var(--c-accent)]'
                  : 'text-[color:var(--c-text-2)] hover:text-[color:var(--c-text)] hover:bg-[color:var(--c-surface-2)]',
              )}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div
          className={cn(
            'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium',
            cronOn
              ? 'bg-[color:var(--c-success-soft)] text-[color:var(--c-success)]'
              : 'bg-[color:var(--c-surface-2)] text-[color:var(--c-text-2)]',
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            {cronOn && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--c-success)] opacity-75 animate-ping" />
            )}
            <span className={cn(
              'relative inline-flex h-1.5 w-1.5 rounded-full',
              cronOn ? 'bg-[color:var(--c-success)]' : 'bg-[color:var(--c-text-3)]',
            )} />
          </span>
          <Activity size={12} className="opacity-70" />
          Scheduler {cronOn ? 'Running' : 'Stopped'}
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[color:var(--c-text-2)] hover:text-[color:var(--c-text)] hover:bg-[color:var(--c-surface-2)] transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
