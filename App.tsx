import React from 'react';
import { HomePage } from './components/HomePage';
import { SandboxView } from './components/SandboxView';
import { CalculatorView } from './components/CalculatorView';
import { SolverView } from './components/SolverView';
import { Navbar } from './components/Navbar';
import { useAppState, AppStateProvider } from './state/AppState';
import { DataProvider } from './src/context/DataContext';
import { SettingsPage } from './pages/SettingsPage';
import { UpdatesPage } from './pages/UpdatesPage';
import { AboutPage } from './pages/AboutPage';
import { TutorialPage } from './pages/TutorialPage';
import { BugReportPage } from './pages/BugReportPage';

const RoutedApp: React.FC = () => {
  const { mode, setMode, setSelectedGame } = useAppState();
  React.useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.to) setMode(e.detail.to);
    };
    window.addEventListener('neoanno:navigate', handler);
    return () => window.removeEventListener('neoanno:navigate', handler);
  }, [setMode]);
  return (
    <div className="min-h-screen bg-[#0b0f19]">
      <Navbar />
      {mode === 'home' && <HomePage onSelectGame={(g) => { setSelectedGame(g); setMode('sandbox'); }} onNavigate={(page) => setMode(page as any)} />}
      {mode === 'sandbox' && <SandboxView />}
      {mode === 'calculator' && <CalculatorView />}
      {mode === 'solver' && <SolverView />}
      {mode === 'settings' && <SettingsPage />}
      {mode === 'updates' && <UpdatesPage />}
      {mode === 'about' && <AboutPage />}
      {mode === 'tutorial' && <TutorialPage />}
      {mode === 'bug' && <BugReportPage />}
    </div>
  );
};

function App() {
  return (
    <DataProvider>
      <AppStateProvider>
        <RoutedApp />
      </AppStateProvider>
    </DataProvider>
  );
}

export default App;
