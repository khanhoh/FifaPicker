import React, { useState } from 'react';
import { DraftProvider } from './context/DraftContext';
import Header from './components/Header';
import BroadcastBoard from './components/BroadcastBoard';
import PlayerSearchPicker from './components/PlayerSearchPicker';
import RulesModal from './components/RulesModal';
import LoginModal from './components/LoginModal';

function MainApp() {
  const [currentView, setCurrentView] = useState('broadcast'); // 'broadcast' | 'picker'
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans">
      {/* Top Header Navigation */}
      <Header
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'broadcast' ? (
          <BroadcastBoard />
        ) : (
          <PlayerSearchPicker />
        )}
      </main>

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <DraftProvider>
      <MainApp />
    </DraftProvider>
  );
}
