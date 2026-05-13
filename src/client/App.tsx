import { AppStateProvider } from './state/AppState.js';
import { Navigation } from './components/Common/Navigation.js';
import { MissionControl } from './components/Cockpit/MissionControl.js';
import styles from './App.module.css';

function AppContent() {
  return (
    <div className={styles.app}>
      <Navigation />
      <MissionControl />
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
