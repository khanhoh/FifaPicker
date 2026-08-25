import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const DraftContext = createContext(null);

export function DraftProvider({ children }) {
  const socketRef = useRef(null);
  const [draftState, setDraftState] = useState(null);
  const [banState, setBanState] = useState(null);

  // User state: role: 'referee' | 'team' | 'spectator', teamId: 1..4, name
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fifa_draft_user');
      return saved ? JSON.parse(saved) : { accountKey: 'referee', role: 'referee', teamId: null, name: 'Trọng Tài / Admin' };
    } catch {
      return { accountKey: 'referee', role: 'referee', teamId: null, name: 'Trọng Tài / Admin' };
    }
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const socketUrl = window.location.port === '3000' ? 'http://localhost:5000' : window.location.origin;
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.emit('join_room', {
      teamId: currentUser.teamId,
      role: currentUser.role
    });

    socket.on('draft_state_update', (state) => {
      setDraftState(state);
    });

    socket.on('ban_state_update', (state) => {
      setBanState(state);
    });

    socket.on('timer_tick', ({ timeLeft }) => {
      setDraftState((prev) => (prev ? { ...prev, timeLeft } : prev));
    });

    socket.on('player_picked_event', ({ pick, team }) => {
      setSuccessMsg(`Đội ${team.name} vừa chọn ${pick.name} (${pick.pos} ${pick.ovr} - Mùa ${pick.season?.toUpperCase()})`);
      setTimeout(() => setSuccessMsg(''), 4000);
    });

    socket.on('pick_rejected', ({ message }) => {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 4000);
    });

    socket.on('action_error', ({ message }) => {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 4000);
    });

    socket.on('draft_completed', ({ message }) => {
      setSuccessMsg(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  const loginUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('fifa_draft_user', JSON.stringify(user));
  };

  const logoutUser = () => {
    const guest = { accountKey: 'spectator', role: 'spectator', teamId: null, name: 'Khán Giả' };
    setCurrentUser(guest);
    localStorage.setItem('fifa_draft_user', JSON.stringify(guest));
  };

  const pickPlayer = (player) => {
    if (!socketRef.current) return;
    if (currentUser.role !== 'team') {
      setErrorMsg('Chỉ Captain của đội mới có quyền Pick cầu thủ!');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    socketRef.current.emit('pick_player', { player, teamId: currentUser.teamId });
  };

  // Referee Draft Controls
  const startDraft = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('start_draft', { userRole: currentUser.role });
  };

  const pauseDraft = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('pause_draft', { userRole: currentUser.role });
  };

  const resumeDraft = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('resume_draft', { userRole: currentUser.role });
  };

  const resetDraft = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('reset_draft', { userRole: currentUser.role });
  };

  const manualNextTurn = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('manual_next_turn', { userRole: currentUser.role });
  };

  // --- MATCH BAN PHASE ACTIONS ---
  const setupBanPhase = ({ teamAId, teamBId, seriesType, gameNumber }) => {
    if (!socketRef.current) return;
    socketRef.current.emit('setup_ban_phase', {
      teamAId,
      teamBId,
      seriesType,
      gameNumber,
      userRole: currentUser.role
    });
  };

  const toggleBanPlayer = (player) => {
    if (!socketRef.current) return;
    if (currentUser.role !== 'team') {
      setErrorMsg('Chỉ Đội trưởng (Captain) mới có quyền chọn cấm cầu thủ!');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    socketRef.current.emit('toggle_ban_player', { player, teamId: currentUser.teamId });
  };

  const lockTeamBans = () => {
    if (!socketRef.current) return;
    if (currentUser.role !== 'team') {
      setErrorMsg('Chỉ Đội trưởng (Captain) mới có quyền khóa cấm cầu thủ!');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    socketRef.current.emit('lock_team_bans', { teamId: currentUser.teamId });
  };

  const nextGameBan = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('next_game_ban', { userRole: currentUser.role });
  };

  const resetBanPhase = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('reset_ban_phase', { userRole: currentUser.role });
  };

  return (
    <DraftContext.Provider
      value={{
        draftState,
        banState,
        currentUser,
        loginUser,
        logoutUser,
        pickPlayer,
        startDraft,
        pauseDraft,
        resumeDraft,
        resetDraft,
        manualNextTurn,
        setupBanPhase,
        toggleBanPlayer,
        lockTeamBans,
        nextGameBan,
        resetBanPhase,
        errorMsg,
        successMsg
      }}
    >
      {children}
    </DraftContext.Provider>
  );
}

export function useDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('useDraft must be used within DraftProvider');
  return context;
}
