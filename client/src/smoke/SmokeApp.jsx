import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, FlaskConical } from 'lucide-react';
import { DraftPreviewProvider } from '../context/DraftContext';
import Header from '../components/Header';
import BroadcastBoard from '../components/BroadcastBoard';
import PlayerSearchPicker from '../components/PlayerSearchPicker';
import MatchBanView from '../components/MatchBanView';
import RoomLobby from '../components/RoomLobby';
import RulesModal from '../components/RulesModal';
import { getFormationSlots } from '../data/formations';
import {
  createSmokeBanState,
  createSmokeDraftState,
  createSmokeLobby,
  createSmokeSession
} from './smokeFixtures';

const SCREENS = [
  { value: 'lobby', label: 'Lobby đủ 4 đội' },
  { value: 'broadcast', label: 'Bảng tổng quan' },
  { value: 'picker', label: 'Pick cầu thủ' },
  { value: 'ban-select', label: 'Chọn cặp đấu Ban' },
  { value: 'ban', label: 'Ban cầu thủ' },
  { value: 'lineup', label: 'Xếp đội hình' }
];

const ROLES = [
  { value: 'referee', label: 'Trọng tài' },
  { value: 'team', label: 'Captain' },
  { value: 'spectator', label: 'Khán giả' }
];

function readInitialParams() {
  const params = new URLSearchParams(window.location.search);
  const requestedScreen = params.get('view');
  const requestedRole = params.get('role');
  const requestedTeam = Number(params.get('team'));
  return {
    screen: SCREENS.some(item => item.value === requestedScreen) ? requestedScreen : 'picker',
    role: ROLES.some(item => item.value === requestedRole) ? requestedRole : 'team',
    teamId: [1, 2, 3, 4].includes(requestedTeam) ? requestedTeam : 1
  };
}

function createBanStateForScreen(screen, pair = { teamAId: 1, teamBId: 2 }) {
  if (screen === 'ban-select') return createSmokeBanState('selecting', pair.teamAId, pair.teamBId);
  if (screen === 'lineup') return createSmokeBanState('lineup', pair.teamAId, pair.teamBId);
  if (screen === 'ban') return createSmokeBanState('banning', pair.teamAId, pair.teamBId);
  return { status: 'idle' };
}

function getSmokeTeamKey(banState, teamId) {
  if (Number(teamId) === Number(banState.teamAId)) return 'teamA';
  if (Number(teamId) === Number(banState.teamBId)) return 'teamB';
  return null;
}

function withLineupStats(lineup) {
  const selected = Object.values(lineup.slots || {}).filter(Boolean);
  return {
    ...lineup,
    salary: selected.reduce((sum, player) => sum + (Number(player.salary) || 0), 0),
    playerCount: selected.length
  };
}

function SmokeToolbar({ screen, setScreen, role, setRole, teamId, setTeamId }) {
  return (
    <div className="relative z-[120] border-b border-cyan-500/30 bg-[#07111d] px-3 py-2 text-white shadow-[0_0_24px_rgba(34,211,238,0.16)] sm:px-4">
      <div className="mx-auto flex max-w-[1900px] flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-950/50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-300">
          <FlaskConical className="h-4 w-4" /> Smoke preview
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5">
          <span className="text-[10px] font-black uppercase text-slate-500">Màn hình</span>
          <select value={screen} onChange={event => setScreen(event.target.value)} className="bg-transparent text-xs font-black text-white outline-none">
            {SCREENS.map(item => <option key={item.value} value={item.value} className="bg-slate-900">{item.label}</option>)}
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5">
          <span className="text-[10px] font-black uppercase text-slate-500">Vai trò</span>
          <select value={role} onChange={event => setRole(event.target.value)} className="bg-transparent text-xs font-black text-white outline-none">
            {ROLES.map(item => <option key={item.value} value={item.value} className="bg-slate-900">{item.label}</option>)}
          </select>
        </label>

        {role === 'team' && (
          <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5">
            <span className="text-[10px] font-black uppercase text-slate-500">Đội</span>
            <select value={teamId} onChange={event => setTeamId(Number(event.target.value))} className="bg-transparent text-xs font-black text-white outline-none">
              <option value={1} className="bg-slate-900">AMT</option>
              <option value={2} className="bg-slate-900">NK</option>
              <option value={3} className="bg-slate-900">FFB</option>
              <option value={4} className="bg-slate-900">TAG</option>
            </select>
          </label>
        )}

        <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-slate-500">
          <Eye className="h-3.5 w-3.5" /> Chỉ xem · Không tạo room/socket
          <a href="/" className="ml-2 flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-300 transition hover:border-neon-green hover:text-neon-green">
            <ArrowLeft className="h-3.5 w-3.5" /> App thật
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SmokeApp() {
  const initial = useMemo(readInitialParams, []);
  const [screen, setScreen] = useState(initial.screen);
  const [role, setRole] = useState(initial.role);
  const [teamId, setTeamId] = useState(initial.teamId);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [banPair, setBanPair] = useState({ teamAId: 1, teamBId: 2 });
  const [banState, setBanState] = useState(() => createBanStateForScreen(initial.screen, { teamAId: 1, teamBId: 2 }));

  const completedDraft = ['ban-select', 'ban', 'lineup'].includes(screen);
  const session = useMemo(() => createSmokeSession(role, teamId), [role, teamId]);
  const lobbyState = useMemo(() => createSmokeLobby(screen === 'lobby' ? 'waiting' : completedDraft ? 'completed' : 'drafting'), [screen, completedDraft]);
  const draftState = useMemo(() => createSmokeDraftState(completedDraft), [completedDraft]);
  useEffect(() => {
    const params = new URLSearchParams({ view: screen, role, team: String(teamId) });
    window.history.replaceState(null, '', `/smoke?${params.toString()}`);
  }, [screen, role, teamId]);

  useEffect(() => {
    setBanState(createBanStateForScreen(screen, banPair));
  }, [screen, banPair]);

  const actions = useMemo(() => ({
    startDraft: () => setScreen('picker'),
    pauseDraft: () => {},
    resumeDraft: () => {},
    resetDraft: () => setScreen('picker'),
    manualNextTurn: () => {},
    swapTeam: targetTeamId => setTeamId(Number(targetTeamId)),
    randomizeTeams: () => {},
    destroyRoom: () => {},
    removePlayer: () => {},
    leaveRoom: () => {},
    pickPlayer: () => {},
    openBanStage: () => setScreen('ban-select'),
    setupBanPhase: ({ teamAId, teamBId }) => {
      setBanPair({ teamAId: Number(teamAId), teamBId: Number(teamBId) });
      setScreen('ban');
    },
    toggleBanPlayer: () => {},
    restartBanSelection: () => setScreen('ban-select'),
    setLineupFormation: (formationId) => setBanState(current => {
      const teamKey = getSmokeTeamKey(current, teamId);
      const currentLineup = teamKey ? current.lineups?.[teamKey] : null;
      if (!currentLineup || currentLineup.locked) return current;

      const selectedPlayers = Object.values(currentLineup.slots || {}).filter(Boolean);
      const nextSlots = Object.fromEntries(getFormationSlots(formationId).map(slot => [slot.id, null]));
      const newFormationSlots = getFormationSlots(formationId);
      const goalkeeper = selectedPlayers.find(player => String(player.pos).toUpperCase() === 'GK');
      const outfieldPlayers = selectedPlayers.filter(player => player !== goalkeeper);
      const goalkeeperSlot = newFormationSlots.find(slot => slot.position === 'GK');
      if (goalkeeper && goalkeeperSlot) nextSlots[goalkeeperSlot.id] = goalkeeper;
      newFormationSlots.filter(slot => slot.position !== 'GK').forEach((slot, index) => {
        nextSlots[slot.id] = outfieldPlayers[index] || null;
      });

      return {
        ...current,
        lineups: {
          ...current.lineups,
          [teamKey]: withLineupStats({ ...currentLineup, formation: formationId, slots: nextSlots })
        }
      };
    }),
    setLineupPlayer: (slotId, playerId) => setBanState(current => {
      const teamKey = getSmokeTeamKey(current, teamId);
      const currentLineup = teamKey ? current.lineups?.[teamKey] : null;
      const team = teamKey === 'teamA' ? current.teamA : teamKey === 'teamB' ? current.teamB : null;
      if (!currentLineup || !team || currentLineup.locked) return current;
      const roster = [...(team.startingXI || []), ...(team.subs || [])];
      const player = playerId == null ? null : roster.find(item => String(item.id) === String(playerId));
      if (playerId != null && !player) return current;
      const nextSlots = { ...currentLineup.slots };
      if (player) {
        Object.keys(nextSlots).forEach(existingSlotId => {
          if (String(nextSlots[existingSlotId]?.id) === String(player.id)) nextSlots[existingSlotId] = null;
        });
      }
      nextSlots[slotId] = player;
      return {
        ...current,
        lineups: { ...current.lineups, [teamKey]: withLineupStats({ ...currentLineup, slots: nextSlots }) }
      };
    }),
    moveLineupPlayer: (sourceSlotId, targetSlotId) => setBanState(current => {
      const teamKey = getSmokeTeamKey(current, teamId);
      const currentLineup = teamKey ? current.lineups?.[teamKey] : null;
      if (!currentLineup || currentLineup.locked || !currentLineup.slots?.[sourceSlotId]) return current;
      const nextSlots = {
        ...currentLineup.slots,
        [sourceSlotId]: currentLineup.slots[targetSlotId] || null,
        [targetSlotId]: currentLineup.slots[sourceSlotId]
      };
      return {
        ...current,
        lineups: { ...current.lineups, [teamKey]: withLineupStats({ ...currentLineup, slots: nextSlots }) }
      };
    }),
    clearLineup: () => setBanState(current => {
      const teamKey = getSmokeTeamKey(current, teamId);
      const currentLineup = teamKey ? current.lineups?.[teamKey] : null;
      if (!currentLineup || currentLineup.locked) return current;
      const slots = Object.fromEntries(getFormationSlots(currentLineup.formation).map(slot => [slot.id, null]));
      return {
        ...current,
        lineups: { ...current.lineups, [teamKey]: withLineupStats({ ...currentLineup, slots }) }
      };
    }),
    lockLineup: () => setBanState(current => {
      const teamKey = getSmokeTeamKey(current, teamId);
      const currentLineup = teamKey ? current.lineups?.[teamKey] : null;
      if (!currentLineup || currentLineup.playerCount !== 11) return current;
      return {
        ...current,
        lineups: { ...current.lineups, [teamKey]: { ...currentLineup, locked: true } }
      };
    })
  }), [teamId]);

  const contextValue = useMemo(() => ({
    session,
    lobbyState,
    draftState,
    banState,
    currentUser: session,
    connectionStatus: 'connected',
    backendInfo: { mode: 'smoke-preview' },
    errorMsg: '',
    successMsg: '',
    ...actions
  }), [session, lobbyState, draftState, banState, actions]);

  const currentView = screen === 'broadcast' ? 'broadcast' : screen === 'picker' ? 'picker' : 'ban';
  const setCurrentView = value => {
    if (value === 'ban') setScreen(screen === 'lineup' ? 'lineup' : 'ban');
    else setScreen(value);
  };

  return (
    <DraftPreviewProvider value={contextValue}>
      <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans">
        <SmokeToolbar screen={screen} setScreen={setScreen} role={role} setRole={setRole} teamId={teamId} setTeamId={setTeamId} />

        {screen === 'lobby' ? (
          <RoomLobby />
        ) : (
          <div className="flex min-h-[calc(100vh-49px)] flex-col">
            <Header onOpenRules={() => setIsRulesOpen(true)} currentView={currentView} setCurrentView={setCurrentView} />
            <main className="flex flex-1 flex-col overflow-hidden">
              {screen === 'broadcast' ? <BroadcastBoard /> : screen === 'picker' ? <PlayerSearchPicker /> : <MatchBanView />}
            </main>
          </div>
        )}

        <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
        <div className="pointer-events-none fixed bottom-3 right-3 z-[110] rounded-full border border-cyan-400/40 bg-cyan-950/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-300 shadow-lg backdrop-blur">
          Smoke preview · Local state
        </div>
      </div>
    </DraftPreviewProvider>
  );
}
