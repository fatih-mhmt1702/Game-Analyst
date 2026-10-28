import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { SetupWizardModal } from './components/SetupWizardModal';

import { OverviewPage } from './pages/OverviewPage';
import { Top10Page } from './pages/Top10Page';
import { GameDetailPage } from './pages/GameDetailPage';
import { IndustryFeedbackPage } from './pages/IndustryFeedbackPage';
import { ChartsPage } from './pages/ChartsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { DataManagementPage } from './pages/DataManagementPage';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(true);

  // Check backend health periodically
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/health');
        setBackendHealthy(res.ok);
      } catch {
        setBackendHealthy(false);
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'tr' ? 'en' : 'tr'));
  };

  const handleInspectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setCurrentTab('game_detail');
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lang={lang}
      />

      <div className="main-content">
        {/* Top Navbar */}
        <Navbar
          lang={lang}
          onToggleLang={handleToggleLang}
          onOpenWizard={() => setIsWizardOpen(true)}
          backendHealthy={backendHealthy}
        />

        {/* Dynamic Page Views */}
        {currentTab === 'overview' && <OverviewPage lang={lang} />}
        {currentTab === 'top10' && <Top10Page lang={lang} onInspectGame={handleInspectGame} />}
        {currentTab === 'game_detail' && (
          <GameDetailPage
            gameId={selectedGameId}
            onSelectGame={setSelectedGameId}
            lang={lang}
          />
        )}
        {currentTab === 'industry' && <IndustryFeedbackPage lang={lang} />}
        {currentTab === 'charts' && <ChartsPage lang={lang} />}
        {currentTab === 'recommendations' && <RecommendationsPage lang={lang} />}
        {currentTab === 'data_mgmt' && <DataManagementPage lang={lang} />}
      </div>

      {/* Setup Wizard Modal */}
      <SetupWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        lang={lang}
      />
    </div>
  );
}

export default App;
