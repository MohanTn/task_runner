import { useState } from 'react';
import { AppStateProvider } from './state/AppState.js';
import { Navigation } from './components/Common/Navigation.js';
import { MissionControl } from './components/Cockpit/MissionControl.js';
import { Dashboard } from './components/Dashboard/Dashboard.js';
import { SettingsPanel } from './components/Settings/SettingsPanel.js';
import styles from './App.module.css';

export type AppTab = 'dashboard' | 'jobs' | 'repos' | 'schedules' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  return (
    <div className={styles.app}>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={styles.view}>
        {activeTab === 'dashboard' && <Dashboard />}
        {(activeTab === 'jobs' || activeTab === 'repos' || activeTab === 'schedules') && (
          <MissionControl activeTab={activeTab} />
        )}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
