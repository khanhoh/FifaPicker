const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const { getAllSeasons } = require('./excelParser');
const { searchPlayers, getHandshakeToken } = require('./fifaService');
const { getSeasonMetadataMaps, getFallbackPresentation, seasonTagToAssetCode } = require('./seasonMetadata');
const { RoomManager } = require('./roomManager');

const SERVER_STARTED_AT = new Date().toISOString();
const SERVER_MODE = 'fixed-teams-room-v2';
const SERVER_INSTANCE_ID = `${process.pid}-${Date.now().toString(36)}`;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/logos', express.static(path.join(__dirname, '../client/public/logos')));

const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) app.use(express.static(clientDistPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
const roomManager = new RoomManager();

getHandshakeToken();

function sendApiError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'fifa-picker-server',
    runtime: {
      instanceId: SERVER_INSTANCE_ID,
      processId: process.pid,
      startedAt: SERVER_STARTED_AT,
      mode: SERVER_MODE,
      roomCount: roomManager.rooms.size
    }
  });
});

app.post('/api/rooms', (req, res) => {
  try {
    const result = roomManager.createRoom({ refereeName: req.body?.refereeName });
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return sendApiError(res, 500, error.message || 'Không thể tạo room.');
  }
});

app.get('/api/rooms/:roomCode', (req, res) => {
  const room = roomManager.getRoom(req.params.roomCode);
  if (!room) return sendApiError(res, 404, 'Không tìm thấy room.');
  return res.json({ success: true, room: roomManager.getPublicRoom(room) });
});

app.post('/api/rooms/:roomCode/join', (req, res) => {
  const result = roomManager.joinRoom({
    roomCode: req.params.roomCode,
    captainName: req.body?.captainName
  });
  if (!result.valid) return sendApiError(res, 400, result.error);
  return res.status(201).json({ success: true, room: result.room, session: result.session });
});

app.post('/api/rooms/:roomCode/watch', (req, res) => {
  const result = roomManager.watchRoom({
    roomCode: req.params.roomCode,
    spectatorName: req.body?.spectatorName
  });
  if (!result.valid) return sendApiError(res, 400, result.error);
  return res.status(201).json({ success: true, room: result.room, session: result.session });
});

app.post('/api/rooms/:roomCode/resume', (req, res) => {
  const result = roomManager.resumeRoom({
    roomCode: req.params.roomCode,
    token: req.body?.token
  });
  if (!result.valid) return sendApiError(res, 401, result.error);
  return res.json({ success: true, room: result.room, session: result.session });
});

app.get('/api/seasons', async (req, res) => {
  const metadata = await getSeasonMetadataMaps();
  const seasons = getAllSeasons().map((season) => {
    const official = metadata.byAssetCode.get(seasonTagToAssetCode(season.id)) || getFallbackPresentation(season.id);
    return {
      ...season,
      name: official.className,
      seasonId: official.seasonId,
      seasonLogoUrl: official.seasonImg,
      cardBackgroundUrl: official.cardBackgroundUrl
    };
  });
  res.json({ success: true, data: seasons });
});

app.get('/api/players', async (req, res) => {
  try {
    const {
      class: cardClass,
      pos,
      playername,
      minOvr,
      maxOvr,
      minSalary,
      maxSalary
    } = req.query;

    const players = await searchPlayers({
      cardClass,
      pos,
      playername,
      minOvr,
      maxOvr,
      minSalary,
      maxSalary
    });
    res.json({ success: true, count: players.length, data: players });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

if (fs.existsSync(clientDistPath)) {
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) return next();
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

function emitSessionUpdates(room) {
  const owners = [room.referee, ...room.participants, ...room.spectators.values()];
  owners.forEach((owner) => {
    if (!owner.socketId) return;
    const session = roomManager.getSessionPayload(owner.token);
    if (session) io.to(owner.socketId).emit('session_update', session);
  });
}

function broadcastLobby(room) {
  io.to(room.code).emit('room_lobby_update', roomManager.getPublicRoom(room));
  emitSessionUpdates(room);
}

function broadcastBanState(room) {
  const owners = [room.referee, ...room.participants, ...room.spectators.values()];
  owners.forEach((owner) => {
    if (!owner.socketId) return;
    const context = roomManager.getAuthContext(owner.token);
    if (!context) return;
    io.to(owner.socketId).emit(
      'ban_state_update',
      room.banRoom.getStateForViewer(context.role, context.teamId)
    );
  });
}

function broadcastAllState(room) {
  broadcastLobby(room);
  room.draftRoom.broadcastState(io);
  broadcastBanState(room);
}

function getSocketContext(socket) {
  const context = roomManager.getAuthContext(socket.data.token);
  if (!context) socket.emit('session_revoked', { message: 'Phiên tham gia room không còn hợp lệ.' });
  return context;
}

function requireRole(socket, role, message) {
  const context = getSocketContext(socket);
  if (!context) return null;
  if (context.role !== role) {
    socket.emit('action_error', { message });
    return null;
  }
  return context;
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!roomManager.getAuthContext(token)) return next(new Error('INVALID_ROOM_SESSION'));
  socket.data.token = token;
  return next();
});

io.on('connection', (socket) => {
  const connected = roomManager.connect(socket.data.token, socket.id);
  if (!connected) {
    socket.disconnect(true);
    return;
  }

  const { room, role, owner, teamId, previousSocketId } = connected;
  if (previousSocketId && previousSocketId !== socket.id) {
    const previousSocket = io.sockets.sockets.get(previousSocketId);
    if (previousSocket) {
      previousSocket.emit('session_replaced', { message: 'Phiên này đã được mở ở một kết nối khác.' });
      previousSocket.disconnect(true);
    }
  }

  socket.join(room.code);
  socket.emit('session_update', roomManager.getSessionPayload(socket.data.token));
  socket.emit('room_lobby_update', roomManager.getPublicRoom(room));
  socket.emit('draft_state_update', room.draftRoom.getState());
  socket.emit('ban_state_update', room.banRoom.getStateForViewer(role, teamId));
  broadcastLobby(room);
  console.log(`🔌 ${role} connected to room ${room.code}: ${owner.id}`);

  socket.on('start_draft', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền bắt đầu Draft!');
    if (!context) return;
    if (!roomManager.canStart(context.room)) {
      socket.emit('action_error', { message: 'Cần đủ 4 đội đang online trước khi bắt đầu.' });
      return;
    }
    const result = context.room.draftRoom.prepareDraft(io);
    if (!result.valid) {
      socket.emit('action_error', { message: result.error });
      return;
    }
    broadcastLobby(context.room);
  });

  socket.on('confirm_draft_start', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền xác nhận bắt đầu Draft!');
    if (!context) return;
    const result = context.room.draftRoom.startDraft(io);
    if (!result.valid) {
      socket.emit('action_error', { message: result.error });
      return;
    }
    broadcastLobby(context.room);
  });

  socket.on('pause_draft', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền tạm dừng!');
    if (!context) return;
    context.room.draftRoom.pauseDraft(io);
    broadcastLobby(context.room);
  });

  socket.on('resume_draft', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền tiếp tục!');
    if (!context) return;
    context.room.draftRoom.resumeDraft(io);
    broadcastLobby(context.room);
  });

  socket.on('reset_draft', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền đặt lại Draft!');
    if (!context) return;
    context.room.draftRoom.reset();
    context.room.banRoom.reset();
    broadcastAllState(context.room);
  });

  socket.on('manual_next_turn', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền chuyển lượt!');
    if (!context) return;
    const result = context.room.draftRoom.nextTurn(io);
    if (!result.valid) socket.emit('action_error', { message: result.error });
  });

  socket.on('pick_player', ({ player } = {}) => {
    const context = requireRole(socket, 'team', 'Chỉ Captain của đội mới có quyền Pick cầu thủ!');
    if (!context) return;
    const result = context.room.draftRoom.executePick(player, context.teamId, io);
    if (!result.valid) {
      socket.emit('pick_rejected', {
        message: result.error,
        playerName: String(player?.name || '').trim()
      });
    }
  });

  socket.on('swap_team', ({ targetTeamId } = {}) => {
    const context = requireRole(socket, 'team', 'Chỉ người chơi mới có thể tự đổi đội!');
    if (!context) return;
    const result = roomManager.swapParticipant(context.room, context.owner.id, targetTeamId);
    if (!result.valid) {
      socket.emit('action_error', { message: result.error });
      return;
    }
    broadcastAllState(context.room);
  });

  socket.on('randomize_teams', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền random vị trí!');
    if (!context) return;
    const result = roomManager.randomizeParticipants(context.room);
    if (!result.valid) {
      socket.emit('action_error', { message: result.error });
      return;
    }
    broadcastAllState(context.room);
  });

  socket.on('destroy_room', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền hủy room!');
    if (!context) return;
    const roomCode = context.room.code;
    io.to(roomCode).emit('session_revoked', { message: `Room ${roomCode} đã bị Trọng tài hủy.` });
    roomManager.destroyRoom(roomCode);
    io.in(roomCode).disconnectSockets(true);
    console.log(`🗑️ Room ${roomCode} destroyed by referee`);
  });

  socket.on('remove_player', ({ playerId } = {}) => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền xóa đội khỏi Lobby!');
    if (!context) return;
    const player = context.room.participants.find((participant) => participant.id === playerId);
    const result = roomManager.removeParticipant(context.room, playerId);
    if (!result.valid) {
      socket.emit('action_error', { message: result.error });
      return;
    }
    if (player?.socketId) {
      io.to(player.socketId).emit('session_revoked', { message: 'Trọng tài đã xóa đội khỏi room.' });
      io.sockets.sockets.get(player.socketId)?.disconnect(true);
    }
    broadcastAllState(context.room);
  });

  socket.on('leave_room', () => {
    const context = getSocketContext(socket);
    if (!context) return;
    // Thoát room chỉ làm user offline. Participant, session và toàn bộ state
    // vẫn được giữ để cùng token có thể vào lại và tiếp tục.
    socket.emit('room_exit_ready', { roomCode: context.room.code });
    socket.disconnect(true);
  });

  socket.on('setup_ban_phase', ({ teamAId, teamBId } = {}) => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền thiết lập phiên Cấm cầu thủ!');
    if (!context) return;
    const { banRoom } = context.room;
    const result = banRoom.setup({ teamAId, teamBId }, io);
    if (!result.valid) {
      socket.emit('action_error', { message: result.error });
      return;
    }
    broadcastBanState(context.room);
  });

  socket.on('open_ban_stage', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền mở giai đoạn Ban!');
    if (!context) return;
    const result = context.room.banRoom.openSelection();
    if (!result.valid) {
      socket.emit('action_error', { message: result.error });
      return;
    }
    broadcastBanState(context.room);
  });

  socket.on('toggle_ban_player', ({ player } = {}) => {
    const context = requireRole(socket, 'team', 'Chỉ Captain mới có quyền chọn cầu thủ cấm!');
    if (!context) return;
    const result = context.room.banRoom.banPlayer(player, context.teamId, io);
    if (!result.valid) socket.emit('action_error', { message: result.error });
    else broadcastBanState(context.room);
  });

  socket.on('restart_ban_selection', () => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền Ban lại!');
    if (!context) return;
    const result = context.room.banRoom.restartBanSelection();
    if (!result.valid) {
      socket.emit('action_error', { message: result.error });
      return;
    }
    broadcastBanState(context.room);
  });

  socket.on('request_lineup_end', () => {
    const context = requireRole(socket, 'team', 'Chỉ Captain mới có thể xin kết thúc lineup!');
    if (!context) return;
    const result = context.room.banRoom.requestLineupEnd(context.teamId);
    if (!result.valid) socket.emit('action_error', { message: result.error });
    else broadcastBanState(context.room);
  });

  socket.on('resolve_lineup_end', ({ teamId, action } = {}) => {
    const context = requireRole(socket, 'referee', 'Chỉ Trọng tài mới có quyền xử lý yêu cầu kết thúc lineup!');
    if (!context) return;
    const result = context.room.banRoom.resolveLineupEndRequest(teamId, action);
    if (!result.valid) socket.emit('action_error', { message: result.error });
    else broadcastBanState(context.room);
  });

  socket.on('set_lineup_formation', ({ formationId } = {}) => {
    const context = requireRole(socket, 'team', 'Chỉ Captain mới có quyền đổi sơ đồ!');
    if (!context) return;
    const result = context.room.banRoom.setLineupFormation(context.teamId, formationId);
    if (!result.valid) socket.emit('action_error', { message: result.error });
    else broadcastBanState(context.room);
  });

  socket.on('set_lineup_player', ({ slotId, playerId } = {}) => {
    const context = requireRole(socket, 'team', 'Chỉ Captain mới có quyền xếp đội hình!');
    if (!context) return;
    const result = context.room.banRoom.setLineupPlayer(context.teamId, slotId, playerId);
    if (!result.valid) socket.emit('action_error', { message: result.error });
    else broadcastBanState(context.room);
  });

  socket.on('move_lineup_player', ({ sourceSlotId, targetSlotId } = {}) => {
    const context = requireRole(socket, 'team', 'Chỉ Captain mới có quyền đổi vị trí cầu thủ!');
    if (!context) return;
    const result = context.room.banRoom.moveLineupPlayer(context.teamId, sourceSlotId, targetSlotId);
    if (!result.valid) socket.emit('action_error', { message: result.error });
    else broadcastBanState(context.room);
  });

  socket.on('clear_lineup', () => {
    const context = requireRole(socket, 'team', 'Chỉ Captain mới có quyền xóa đội hình!');
    if (!context) return;
    const result = context.room.banRoom.clearLineup(context.teamId);
    if (!result.valid) socket.emit('action_error', { message: result.error });
    else broadcastBanState(context.room);
  });

  socket.on('lock_lineup', () => {
    const context = requireRole(socket, 'team', 'Chỉ Captain mới có quyền khóa đội hình!');
    if (!context) return;
    const result = context.room.banRoom.lockLineup(context.teamId);
    if (!result.valid) socket.emit('action_error', { message: result.error });
    else broadcastBanState(context.room);
  });

  socket.on('disconnect', () => {
    const context = roomManager.disconnect(socket.data.token, socket.id);
    if (!context) return;
    console.log(`❌ ${context.role} disconnected from room ${context.room.code}`);
    broadcastLobby(context.room);
    context.room.draftRoom.broadcastState(io);
  });
});

const cleanupInterval = setInterval(() => roomManager.cleanup(), 15 * 60 * 1000);
cleanupInterval.unref();

const PORT = process.env.PORT || 5000;
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} đang được một backend khác sử dụng.`);
    console.error(`   Kiểm tra process: ss -ltnp 'sport = :${PORT}'`);
    process.exitCode = 1;
    return;
  }
  console.error('❌ FIFA Draft Server failed to start:', error);
  process.exitCode = 1;
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FIFA Draft Server running at http://0.0.0.0:${PORT}`);
  console.log(`🧭 Backend ${SERVER_MODE} | PID ${process.pid} | Instance ${SERVER_INSTANCE_ID}`);
});

module.exports = { app, server, io, roomManager };
