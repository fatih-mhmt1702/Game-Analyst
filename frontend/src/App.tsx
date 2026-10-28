import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(true);

  // Check backend health periodically
  useEffect(() => {
    const check = async () => {
      const isHealthy = await api.checkHealth();
      setBackendHealthy(isHealthy);
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
    setIsMobileMenuOpen(false);
  };

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation with mobile drawer support */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        lang={lang}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="main-content">
        {/* Top Navbar */}
        <Navbar
          lang={lang}
          onToggleLang={handleToggleLang}
          onOpenWizard={() => setIsWizardOpen(true)}
          backendHealthy={backendHealthy}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
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

        {/* Mobile Bottom Navigation Bar (touch screens < 768px) */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          lang={lang}
        />
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
