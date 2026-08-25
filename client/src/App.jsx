import React, { useState } from 'react';
import { DraftProvider, useDraft } from './context/DraftContext';
import Header from './components/Header';
import BroadcastBoard from './components/BroadcastBoard';
import PlayerSearchPicker from './components/PlayerSearchPicker';
import MatchBanView from './components/MatchBanView';
import RulesModal from './components/RulesModal';
import RoomGateway from './components/RoomGateway';
import RoomLobby from './components/RoomLobby';

function MainApp() {
  const { session, lobbyState } = useDraft();
  const [currentView, setCurrentView] = useState('broadcast'); // 'broadcast' | 'picker' | 'ban'
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  if (!session) return <RoomGateway />;

  if (!lobbyState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050811] text-neon-green">
        <div className="text-center">
          <div className="font-digital text-3xl font-black animate-pulse">CONNECTING</div>
          <div className="mt-2 text-xs font-bold tracking-widest text-slate-500">ROOM {session.roomCode}</div>
        </div>
      </div>
    );
  }

  if (lobbyState.status === 'waiting') return <RoomLobby />;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans">
      {/* Top Header Navigation */}
      <Header
        onOpenRules={() => setIsRulesOpen(true)}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'broadcast' ? (
          <BroadcastBoard />
        ) : currentView === 'picker' ? (
          <PlayerSearchPicker />
        ) : (
          <MatchBanView />
        )}
      </main>

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
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
