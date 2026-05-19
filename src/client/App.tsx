import { useState } from 'react';
import { AppStateProvider } from './state/AppState.js';
import { ThemeProvider } from './theme/ThemeProvider.js';
import { ToastProvider } from './ui/index.js';
import { Navigation } from './components/Common/Navigation.js';
import { Dashboard } from './components/Dashboard/Dashboard.js';
import { JobsPage } from './components/Jobs/JobsPage.js';
import { ReposPage } from './components/Repos/ReposPage.js';
import { SchedulesPage } from './components/Schedules/SchedulesPage.js';
import { SettingsPanel } from './components/Settings/SettingsPanel.js';

export type AppTab = 'dashboard' | 'jobs' | 'repos' | 'schedules' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--c-bg)] text-[color:var(--c-text)]">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-5 py-6">
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'jobs'      && <JobsPage />}
        {activeTab === 'repos'     && <ReposPage />}
        {activeTab === 'schedules' && <SchedulesPage />}
        {activeTab === 'settings'  && <SettingsPanel />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppStateProvider>
          <AppContent />
        </AppStateProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
