import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const DraftContext = createContext(null);
const SESSION_STORAGE_KEY = 'fifa_draft_room_session';

function loadStoredSession() {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Yêu cầu không thành công.');
  }
  return data;
}

export function DraftProvider({ children }) {
  const socketRef = useRef(null);
  const errorTimerRef = useRef(null);
  const successTimerRef = useRef(null);
  const [session, setSession] = useState(loadStoredSession);
  const [lobbyState, setLobbyState] = useState(null);
  const [draftState, setDraftState] = useState(null);
  const [banState, setBanState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(session ? 'connecting' : 'idle');
  const [errorNotice, setErrorNotice] = useState({ message: '', roomCode: null });
  const [successNotice, setSuccessNotice] = useState({ message: '', roomCode: null });
  const [backendInfo, setBackendInfo] = useState(null);

  const persistSession = (nextSession) => {
    setSession(nextSession);
    if (nextSession) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      localStorage.removeItem('fifa_draft_user');
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  const resetRoomState = () => {
    setLobbyState(null);
    setDraftState(null);
    setBanState(null);
  };

  const clearError = () => {
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = null;
    setErrorNotice({ message: '', roomCode: null });
  };

  const clearSuccess = () => {
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    successTimerRef.current = null;
    setSuccessNotice({ message: '', roomCode: null });
  };

  const clearNotices = () => {
    clearError();
    clearSuccess();
  };

  const showError = (message, timeout = 4000, roomCode = session?.roomCode || null) => {
    clearError();
    const nextNotice = { message: message || 'Có lỗi xảy ra.', roomCode };
    setErrorNotice(nextNotice);
    if (timeout) {
      errorTimerRef.current = window.setTimeout(() => {
        setErrorNotice((current) => current === nextNotice ? { message: '', roomCode: null } : current);
        errorTimerRef.current = null;
      }, timeout);
    }
  };

  const showSuccess = (message, timeout = 4000, roomCode = session?.roomCode || null) => {
    clearSuccess();
    const nextNotice = { message, roomCode };
    setSuccessNotice(nextNotice);
    if (timeout) {
      successTimerRef.current = window.setTimeout(() => {
        setSuccessNotice((current) => current === nextNotice ? { message: '', roomCode: null } : current);
        successTimerRef.current = null;
      }, timeout);
    }
  };

  useEffect(() => () => {
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
  }, []);

  useEffect(() => {
    let active = true;
    requestJson('/api/health')
      .then((data) => { if (active) setBackendInfo(data.runtime); })
      .catch(() => { if (active) setBackendInfo(null); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session?.token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnectionStatus('idle');
      return undefined;
    }

    const socketUrl = window.location.port === '3000' ? 'http://localhost:5000' : window.location.origin;
    const socket = io(socketUrl, {
      auth: { token: session.token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000
    });
    socketRef.current = socket;
    setConnectionStatus('connecting');

    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', (reason) => {
      setConnectionStatus(reason === 'io server disconnect' ? 'disconnected' : 'reconnecting');
    });
    socket.on('connect_error', (error) => {
      if (error.message === 'INVALID_ROOM_SESSION') {
        persistSession(null);
        resetRoomState();
        showError('Room không còn tồn tại hoặc phiên tham gia đã hết hạn.', 0, session.roomCode);
      } else {
        setConnectionStatus('reconnecting');
      }
    });

    socket.on('session_update', (nextSession) => persistSession(nextSession));
    socket.on('room_lobby_update', setLobbyState);
    socket.on('draft_state_update', setDraftState);
    socket.on('ban_state_update', setBanState);
    socket.on('timer_tick', ({ timeLeft }) => {
      setDraftState((previous) => previous ? { ...previous, timeLeft } : previous);
    });
    socket.on('player_picked_event', ({ pick, team }) => {
      showSuccess(`Đội ${team.name} vừa chọn ${pick.name} (${pick.pos} ${pick.ovr} - Mùa ${pick.season?.toUpperCase()})`);
    });
    socket.on('pick_rejected', ({ message }) => showError(message));
    socket.on('action_error', ({ message }) => showError(message));
    socket.on('draft_completed', ({ message }) => showSuccess(message, 0));
    socket.on('session_revoked', ({ message }) => {
      persistSession(null);
      resetRoomState();
      showError(message || 'Phiên tham gia room đã bị thu hồi.', 0, session.roomCode);
    });
    socket.on('session_replaced', ({ message }) => {
      persistSession(null);
      resetRoomState();
      showError(message || 'Phiên đã được mở trên thiết bị khác.', 0, session.roomCode);
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [session?.token]);

  const createRoom = async ({ refereeName }) => {
    clearNotices();
    const data = await requestJson('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ refereeName })
    });
    setLobbyState(data.room);
    persistSession(data.session);
    return data;
  };

  const joinRoom = async ({ roomCode, captainName }) => {
    clearNotices();
    const normalizedCode = String(roomCode || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
    const data = await requestJson(`/api/rooms/${normalizedCode}/join`, {
      method: 'POST',
      body: JSON.stringify({ captainName })
    });
    setLobbyState(data.room);
    persistSession(data.session);
    return data;
  };

  const watchRoom = async ({ roomCode, spectatorName }) => {
    clearNotices();
    const normalizedCode = String(roomCode || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
    const data = await requestJson(`/api/rooms/${normalizedCode}/watch`, {
      method: 'POST',
      body: JSON.stringify({ spectatorName })
    });
    setLobbyState(data.room);
    persistSession(data.session);
    return data;
  };

  const emit = (eventName, payload) => {
    if (!socketRef.current?.connected) {
      showError('Đang mất kết nối tới room. Vui lòng chờ kết nối lại.');
      return false;
    }
    socketRef.current.emit(eventName, payload);
    return true;
  };

  const clearLocalSession = () => {
    socketRef.current?.disconnect();
    persistSession(null);
    resetRoomState();
    clearNotices();
  };

  const leaveRoom = () => {
    if (session?.role === 'team' || session?.role === 'spectator') {
      emit('leave_room');
      return;
    }
    clearLocalSession();
  };

  const currentUser = useMemo(() => session || {
    role: 'guest',
    teamId: null,
    name: 'Khách'
  }, [session]);

  const value = {
    session,
    lobbyState,
    draftState,
    banState,
    currentUser,
    connectionStatus,
    createRoom,
    joinRoom,
    watchRoom,
    clearLocalSession,
    leaveRoom,
    startDraft: () => emit('start_draft'),
    pauseDraft: () => emit('pause_draft'),
    resumeDraft: () => emit('resume_draft'),
    resetDraft: () => emit('reset_draft'),
    manualNextTurn: () => emit('manual_next_turn'),
    swapTeam: (targetTeamId) => emit('swap_team', { targetTeamId }),
    randomizeTeams: () => emit('randomize_teams'),
    destroyRoom: () => emit('destroy_room'),
    removePlayer: (playerId) => emit('remove_player', { playerId }),
    pickPlayer: (player) => emit('pick_player', { player }),
    setupBanPhase: (payload) => emit('setup_ban_phase', payload),
    toggleBanPlayer: (player) => emit('toggle_ban_player', { player }),
    lockTeamBans: () => emit('lock_team_bans'),
    nextGameBan: () => emit('next_game_ban'),
    resetBanPhase: () => emit('reset_ban_phase'),
    setLineupFormation: (formationId) => emit('set_lineup_formation', { formationId }),
    setLineupPlayer: (slotId, playerId) => emit('set_lineup_player', { slotId, playerId }),
    moveLineupPlayer: (sourceSlotId, targetSlotId) => emit('move_lineup_player', { sourceSlotId, targetSlotId }),
    clearLineup: () => emit('clear_lineup'),
    lockLineup: () => emit('lock_lineup'),
    backendInfo,
    errorMsg: errorNotice.message && (!session?.roomCode || !errorNotice.roomCode || errorNotice.roomCode === session.roomCode)
      ? errorNotice.message
      : '',
    successMsg: successNotice.message && (!session?.roomCode || !successNotice.roomCode || successNotice.roomCode === session.roomCode)
      ? successNotice.message
      : ''
  };

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('useDraft must be used within DraftProvider');
  return context;
}
