const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const { getAllSeasons } = require('./excelParser');
const { searchPlayers, getHandshakeToken } = require('./fifaService');
const { DraftRoom } = require('./draftEngine');

const app = express();
app.use(cors());
app.use(express.json());

// Serve public assets (team logos)
app.use('/logos', express.static(path.join(__dirname, '../client/public/logos')));

// Serve built frontend if exists (Production mode)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Singleton Draft Room for main session
const room = new DraftRoom('main_room');

// Preload handshake token on startup
getHandshakeToken();

// Credentials config
const ACCOUNTS = {
  referee: { role: 'referee', name: 'Trọng Tài / Admin', pass: '123456' },
  team_1: { role: 'team', teamId: 1, name: 'AMITA FCO', pass: '1111' },
  team_2: { role: 'team', teamId: 2, name: 'NK FC ONLINE', pass: '2222' },
  team_3: { role: 'team', teamId: 3, name: 'FOR FUN BROTHER', pass: '3333' },
  team_4: { role: 'team', teamId: 4, name: 'TAG TEAM', pass: '4444' }
};

// REST API Endpoints
app.post('/api/login', (req, res) => {
  const { accountKey, password } = req.body;
  const acc = ACCOUNTS[accountKey];
  if (!acc) {
    return res.status(400).json({ success: false, message: 'Tài khoản không tồn tại!' });
  }
  if (acc.pass !== password && password !== 'admin') {
    return res.status(401).json({ success: false, message: 'Mật khẩu / Mã PIN không chính xác!' });
  }
  return res.json({
    success: true,
    user: {
      accountKey,
      role: acc.role,
      teamId: acc.teamId || null,
      name: acc.name
    }
  });
});

app.get('/api/seasons', (req, res) => {
  res.json({ success: true, data: getAllSeasons() });
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/draft/state', (req, res) => {
  res.json({ success: true, data: room.getState() });
});

app.post('/api/draft/start', (req, res) => {
  room.startDraft(io);
  res.json({ success: true, message: 'Draft started' });
});

app.post('/api/draft/reset', (req, res) => {
  room.reset();
  room.broadcastState(io);
  res.json({ success: true, message: 'Draft reset' });
});

// Fallback to React SPA for any other route in production
if (fs.existsSync(clientDistPath)) {
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Socket.io Realtime Events
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // 1. Join room
  socket.on('join_room', ({ teamId, role }) => {
    socket.join(room.roomId);
    if (teamId) {
      const team = room.teams.find(t => t.id === parseInt(teamId, 10));
      if (team) {
        team.socketId = socket.id;
        console.log(`👤 Assigned socket ${socket.id} to ${team.name}`);
      }
    }
    socket.emit('draft_state_update', room.getState());
  });

  // 2. Start draft (Referee only)
  socket.on('start_draft', ({ userRole }) => {
    if (userRole !== 'referee') {
      return socket.emit('action_error', { message: 'Chỉ Trọng tài mới có quyền bắt đầu phiên Draft!' });
    }
    console.log('▶️ Draft started by Referee');
    room.startDraft(io);
  });

  // 3. Pause draft (Referee only)
  socket.on('pause_draft', ({ userRole }) => {
    if (userRole !== 'referee') {
      return socket.emit('action_error', { message: 'Chỉ Trọng tài mới có quyền tạm dừng!' });
    }
    console.log('⏸️ Draft paused by Referee');
    room.pauseDraft(io);
  });

  // 4. Resume draft (Referee only)
  socket.on('resume_draft', ({ userRole }) => {
    if (userRole !== 'referee') {
      return socket.emit('action_error', { message: 'Chỉ Trọng tài mới có quyền tiếp tục!' });
    }
    console.log('▶️ Draft resumed by Referee');
    room.resumeDraft(io);
  });

  // 5. Reset draft (Referee only)
  socket.on('reset_draft', ({ userRole }) => {
    if (userRole !== 'referee') {
      return socket.emit('action_error', { message: 'Chỉ Trọng tài mới có quyền đặt lại Draft!' });
    }
    console.log('🔄 Draft reset by Referee');
    room.reset();
    room.broadcastState(io);
  });

  // 6. Manual skip / next turn (Referee only)
  socket.on('manual_next_turn', ({ userRole }) => {
    if (userRole !== 'referee') {
      return socket.emit('action_error', { message: 'Chỉ Trọng tài mới có quyền chuyển lượt!' });
    }
    console.log('⏭️ Manual next turn by Referee');
    room.nextTurn(io);
  });

  // 7. Pick player (Captains)
  socket.on('pick_player', ({ player, teamId }) => {
    console.log(`🎯 Pick attempt by team ${teamId}: ${player?.name} (${player?.season})`);
    const result = room.executePick(player, teamId, io);
    if (!result.valid) {
      socket.emit('pick_rejected', { message: result.error });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FIFA Draft Server running at http://0.0.0.0:${PORT}`);
});
