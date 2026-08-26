import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, FlaskConical } from 'lucide-react';
import { DraftPreviewProvider } from '../context/DraftContext';
import Header from '../components/Header';
import BroadcastBoard from '../components/BroadcastBoard';
import PlayerSearchPicker from '../components/PlayerSearchPicker';
import MatchBanView from '../components/MatchBanView';
import RoomLobby from '../components/RoomLobby';
import RulesModal from '../components/RulesModal';
import DraftReadyModal from '../components/DraftReadyModal';
import PickErrorModal from '../components/PickErrorModal';
import { getFormationSlots } from '../data/formations';
import {
  createSmokeBanState,
  createSmokeDraftState,
  createSmokeLobby,
  createSmokeSession
} from './smokeFixtures';

const SCREENS = [
  { value: 'lobby', label: 'Lobby đủ 4 đội' },
  { value: 'ready', label: 'Modal chờ bắt đầu' },
  { value: 'broadcast', label: 'Bảng tổng quan' },
  { value: 'sub-round-5', label: 'Round -5R · Team 1' },
  { value: 'picker', label: 'Pick cầu thủ' },
  { value: 'pick-error', label: 'Modal lỗi luật Pick' },
  { value: 'ban-select', label: 'Chọn cặp đấu Ban' },
  { value: 'ban', label: 'Ban cầu thủ' },
  { value: 'lineup', label: 'Lineup · chưa khóa' },
  { value: 'lineup-complete', label: 'Lineup · đã khóa' }
];

const ROLES = [
  { value: 'referee', label: 'Trọng tài' },
  { value: 'team', label: 'Captain' },
  { value: 'spectator', label: 'Khán giả' }
];

const TEST_CASES = [
  { value: 'ready-referee', label: 'D01 · Ref xác nhận bắt đầu', screen: 'ready', role: 'referee', teamId: 1 },
  { value: 'ready-picker', label: 'D02 · Picker chờ + đội/slot', screen: 'ready', role: 'team', teamId: 3 },
  { value: 'ready-spectator', label: 'D03 · Khán giả chờ', screen: 'ready', role: 'spectator', teamId: 1 },
  { value: 'pick-rule-error', label: 'D04 · Modal lỗi luật Pick', screen: 'pick-error', role: 'team', teamId: 1, pickErrorCase: 'salary' },
  { value: 'draft-player-names', label: 'D05 · Tên người chơi bảng Draft', screen: 'broadcast', role: 'spectator', teamId: 1 },
  { value: 'sub-round-order', label: 'D06 · -5R bắt đầu Team 1', screen: 'sub-round-5', role: 'spectator', teamId: 1 },
  { value: 'pick-filters', label: 'P01 · Pick filters/lương', screen: 'picker', role: 'team', teamId: 1 },
  { value: 'ban-names', label: 'B01 · Tên người chơi tại Ban', screen: 'ban', role: 'spectator', teamId: 1 },
  { value: 'lineup-ref-force', label: 'L01 · Ref end lineup sớm', screen: 'lineup', role: 'referee', teamId: 1 },
  { value: 'lineup-outside', label: 'L02 · Đội ngoài cặp read-only', screen: 'lineup', role: 'team', teamId: 3 },
  { value: 'lineup-spectator', label: 'L03 · Khán giả read-only', screen: 'lineup', role: 'spectator', teamId: 1 },
  { value: 'lineup-complete', label: 'L04 · Hai lineup đã khóa', screen: 'lineup-complete', role: 'referee', teamId: 1 }
];

const PICK_ERROR_CASES = [
  { value: 'salary', label: 'Vượt lương 305', playerName: 'Cristiano Ronaldo', message: 'Vượt quá giới hạn lương 305! (Hiện tại: 294 + 18 = 312/305)' },
  { value: 'main-gk', label: 'GK chính thứ hai', playerName: 'Thibaut Courtois', message: 'Đội hình chính chỉ được có đúng 1 Thủ môn (GK)!' },
  { value: 'main-last-gk', label: 'Slot chính cuối thiếu GK', playerName: 'Kevin De Bruyne', message: 'Lượt cuối đội hình chính bắt buộc phải chọn Thủ môn (GK)!' },
  { value: 'sub-gk', label: 'GK dự bị thứ hai', playerName: 'Gianluigi Donnarumma', message: 'Danh sách dự bị chỉ được có đúng 1 Thủ môn (GK)!' },
  { value: 'sub-last-gk', label: 'Slot dự bị cuối thiếu GK', playerName: 'Jude Bellingham', message: 'Lượt cuối danh sách dự bị bắt buộc phải chọn Thủ môn (GK)!' }
];

function readInitialParams() {
  const params = new URLSearchParams(window.location.search);
  const requestedScreen = params.get('view');
  const requestedRole = params.get('role');
  const requestedTeam = Number(params.get('team'));
  const requestedPickError = params.get('error');
  return {
    screen: SCREENS.some(item => item.value === requestedScreen) ? requestedScreen : 'picker',
    role: ROLES.some(item => item.value === requestedRole) ? requestedRole : 'team',
    teamId: [1, 2, 3, 4].includes(requestedTeam) ? requestedTeam : 1,
    pickErrorCase: PICK_ERROR_CASES.some(item => item.value === requestedPickError) ? requestedPickError : 'salary'
  };
}

function createBanStateForScreen(screen, pair = { teamAId: 1, teamBId: 2 }) {
  if (screen === 'ban-select') return createSmokeBanState('selecting', pair.teamAId, pair.teamBId);
  if (screen === 'lineup') return createSmokeBanState('lineup', pair.teamAId, pair.teamBId);
  if (screen === 'lineup-complete') return createSmokeBanState('lineup_complete', pair.teamAId, pair.teamBId);
  if (screen === 'ban') return createSmokeBanState('banning', pair.teamAId, pair.teamBId);
  return { status: 'idle' };
}

function createDraftStateForScreen(screen, completedDraft, status) {
  const state = createSmokeDraftState(completedDraft, status);
  if (screen !== 'sub-round-5') return state;
  const teams = state.teams.map(team => ({
    ...team,
    roundPicks: {
      ...team.roundPicks,
      '-5R': [null, null, null]
    }
  }));
  return {
    ...state,
    currentRound: {
      roundNum: 13,
      label: '-5R',
      subLabel: '2.5',
      phase: 'SUB',
      picksPerTurn: 3,
      timeLimit: 90,
      direction: 'FORWARD'
    },
    currentTeam: teams[0],
    currentRoundIdx: 12,
    currentTeamTurnIdx: 0,
    picksInCurrentTurn: 0,
    neededPicks: 3,
    turnPickTarget: 3,
    turnRoundPickOffset: 0,
    timeLeft: 90,
    teams
  };
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

function SmokeToolbar({
  screen,
  setScreen,
  role,
  setRole,
  teamId,
  setTeamId,
  activeTestCase,
  applyTestCase,
  pickErrorCase,
  setPickErrorCase
}) {
  return (
    <div className="relative z-[120] border-b border-cyan-500/30 bg-[#07111d] px-3 py-2 text-white shadow-[0_0_24px_rgba(34,211,238,0.16)] sm:px-4">
      <div className="mx-auto flex max-w-[1900px] flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-950/50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-300">
          <FlaskConical className="h-4 w-4" /> Smoke preview
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-2.5 py-1.5">
          <span className="text-[10px] font-black uppercase text-cyan-500">Test case</span>
          <select value={activeTestCase} onChange={event => applyTestCase(event.target.value)} className="bg-transparent text-xs font-black text-cyan-100 outline-none">
            <option value="" className="bg-slate-900">Tùy chỉnh</option>
            {TEST_CASES.map(item => <option key={item.value} value={item.value} className="bg-slate-900">{item.label}</option>)}
          </select>
        </label>

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

        {screen === 'pick-error' && (
          <label className="flex items-center gap-2 rounded-xl border border-red-800/80 bg-red-950/50 px-2.5 py-1.5">
            <span className="text-[10px] font-black uppercase text-red-300">Case lỗi</span>
            <select value={pickErrorCase} onChange={event => setPickErrorCase(event.target.value)} className="bg-transparent text-xs font-black text-white outline-none">
              {PICK_ERROR_CASES.map(item => <option key={item.value} value={item.value} className="bg-slate-900">{item.label}</option>)}
            </select>
          </label>
        )}

        {screen === 'sub-round-5' && (
          <div className="rounded-xl border border-emerald-700/70 bg-emerald-950/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-300">
            Expected: AMT → NK → FFB → TAG
          </div>
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
  const [pickErrorCase, setPickErrorCase] = useState(initial.pickErrorCase);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [banPair, setBanPair] = useState({ teamAId: 1, teamBId: 2 });
  const [banState, setBanState] = useState(() => createBanStateForScreen(initial.screen, { teamAId: 1, teamBId: 2 }));

  const completedDraft = ['ban-select', 'ban', 'lineup', 'lineup-complete'].includes(screen);
  const session = useMemo(() => createSmokeSession(role, teamId), [role, teamId]);
  const lobbyStatus = screen === 'lobby' ? 'waiting' : screen === 'ready' ? 'ready' : completedDraft ? 'completed' : 'drafting';
  const lobbyState = useMemo(() => createSmokeLobby(lobbyStatus), [lobbyStatus]);
  const draftState = useMemo(
    () => createDraftStateForScreen(screen, completedDraft, lobbyStatus),
    [screen, completedDraft, lobbyStatus]
  );
  const pickError = screen === 'pick-error'
    ? PICK_ERROR_CASES.find(item => item.value === pickErrorCase) || PICK_ERROR_CASES[0]
    : null;
  useEffect(() => {
    const params = new URLSearchParams({ view: screen, role, team: String(teamId) });
    if (screen === 'pick-error') params.set('error', pickErrorCase);
    window.history.replaceState(null, '', `/smoke?${params.toString()}`);
  }, [screen, role, teamId, pickErrorCase]);

  useEffect(() => {
    setBanState(createBanStateForScreen(screen, banPair));
  }, [screen, banPair]);

  const activeTestCase = TEST_CASES.find(testCase => (
    testCase.screen === screen
    && testCase.role === role
    && (role !== 'team' || testCase.teamId === teamId)
  ))?.value || '';

  const applyTestCase = value => {
    const testCase = TEST_CASES.find(item => item.value === value);
    if (!testCase) return;
    setScreen(testCase.screen);
    setRole(testCase.role);
    setTeamId(testCase.teamId);
    if (testCase.pickErrorCase) setPickErrorCase(testCase.pickErrorCase);
    setBanPair({ teamAId: 1, teamBId: 2 });
  };

  const actions = useMemo(() => ({
    startDraft: () => setScreen('ready'),
    confirmDraftStart: () => setScreen('broadcast'),
    pauseDraft: () => {},
    resumeDraft: () => {},
    resetDraft: () => setScreen('picker'),
    manualNextTurn: () => {},
    swapTeam: targetTeamId => setTeamId(Number(targetTeamId)),
    randomizeTeams: () => {},
    destroyRoom: () => {},
    removePlayer: () => {},
    leaveRoom: () => {},
    exitRoom: () => {},
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
    }),
    dismissPickError: () => setScreen('picker')
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
    pickError,
    ...actions
  }), [session, lobbyState, draftState, banState, pickError, actions]);

  const currentView = ['broadcast', 'ready', 'sub-round-5'].includes(screen)
    ? 'broadcast'
    : ['picker', 'pick-error'].includes(screen) ? 'picker' : 'ban';
  const setCurrentView = value => {
    if (value === 'ban') setScreen(['lineup', 'lineup-complete'].includes(screen) ? screen : 'ban');
    else setScreen(value);
  };

  return (
    <DraftPreviewProvider value={contextValue}>
      <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans">
        <SmokeToolbar
          screen={screen}
          setScreen={setScreen}
          role={role}
          setRole={setRole}
          teamId={teamId}
          setTeamId={setTeamId}
          activeTestCase={activeTestCase}
          applyTestCase={applyTestCase}
          pickErrorCase={pickErrorCase}
          setPickErrorCase={setPickErrorCase}
        />

        {screen === 'lobby' ? (
          <RoomLobby />
        ) : (
          <div className="flex min-h-[calc(100vh-49px)] flex-col">
            <Header onOpenRules={() => setIsRulesOpen(true)} currentView={currentView} setCurrentView={setCurrentView} />
            <main className="flex flex-1 flex-col overflow-hidden">
              {['broadcast', 'ready', 'sub-round-5'].includes(screen)
                ? <BroadcastBoard />
                : ['picker', 'pick-error'].includes(screen) ? <PlayerSearchPicker /> : <MatchBanView />}
            </main>
          </div>
        )}

        <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
        <DraftReadyModal />
        <PickErrorModal />
        <div className="pointer-events-none fixed bottom-3 right-3 z-[110] rounded-full border border-cyan-400/40 bg-cyan-950/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-300 shadow-lg backdrop-blur">
          Smoke preview · Local state
        </div>
      </div>
    </DraftPreviewProvider>
  );
}
