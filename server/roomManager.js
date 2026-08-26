const crypto = require('crypto');
const { DraftRoom, createEmptyTeam } = require('./draftEngine');
const { MatchBanRoom } = require('./banEngine');

const ROOM_SIZE = 4;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TEAM_OPTIONS = Object.freeze([
  Object.freeze({ id: 1, code: 'AMT', name: 'AMITA FCO', logoUrl: '/logos/AMT.png', color: '#ffffff' }),
  Object.freeze({ id: 2, code: 'NK', name: 'NK FC ONLINE', logoUrl: '/logos/NK.png', color: '#ef4444' }),
  Object.freeze({ id: 3, code: 'FFB', name: 'FOR FUN BROTHER', logoUrl: '/logos/FFB.png', color: '#ea580c' }),
  Object.freeze({ id: 4, code: 'TAG', name: 'TA Global', logoUrl: '/logos/TAG.png', color: '#f97316' })
]);

function cleanText(value, maxLength, fallback = '') {
  const cleaned = String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return cleaned || fallback;
}

function normalizeRoomCode(value) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6);
}

function getTeamOption(teamId) {
  return TEAM_OPTIONS.find((team) => team.id === Number(teamId)) || null;
}

function shuffled(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = crypto.randomInt(0, index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.sessions = new Map();
  }

  generateRoomCode() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      let code = '';
      for (let index = 0; index < 6; index += 1) {
        code += ROOM_CODE_ALPHABET[crypto.randomInt(0, ROOM_CODE_ALPHABET.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Không thể tạo mã room duy nhất. Vui lòng thử lại.');
  }

  createSession(roomCode, role, ownerId) {
    const token = crypto.randomBytes(32).toString('base64url');
    this.sessions.set(token, { roomCode, role, ownerId });
    return token;
  }

  createRoom({ refereeName }) {
    const code = this.generateRoomCode();
    const refereeId = crypto.randomUUID();
    const token = this.createSession(code, 'referee', refereeId);
    const draftRoom = new DraftRoom(code);
    const room = {
      code,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      referee: {
        id: refereeId,
        name: cleanText(refereeName, 32, 'Trọng tài'),
        token,
        connected: false,
        socketId: null
      },
      participants: [],
      spectators: new Map(),
      draftRoom,
      banRoom: new MatchBanRoom(draftRoom)
    };
    this.syncDraftTeams(room);
    this.rooms.set(code, room);

    return {
      room: this.getPublicRoom(room),
      session: this.getSessionPayload(token)
    };
  }

  joinRoom({ roomCode, captainName }) {
    const room = this.getRoom(roomCode);
    if (!room) return { valid: false, error: 'Không tìm thấy room.' };
    if (room.draftRoom.status !== 'waiting') {
      return { valid: false, error: 'Room đã bắt đầu, không thể thêm đội mới.' };
    }
    if (room.participants.length >= ROOM_SIZE) {
      return { valid: false, error: 'Room đã đủ 4 đội.' };
    }

    const usedSlots = new Set(room.participants.map((participant) => participant.teamId));
    const availableSlots = TEAM_OPTIONS.filter((team) => !usedSlots.has(team.id));
    const teamId = availableSlots[crypto.randomInt(0, availableSlots.length)].id;
    const playerId = crypto.randomUUID();
    const token = this.createSession(room.code, 'team', playerId);

    room.participants.push({
      id: playerId,
      token,
      teamId,
      captainName: cleanText(captainName, 32, `Người chơi ${room.participants.length + 1}`),
      connected: false,
      socketId: null
    });
    room.lastActiveAt = Date.now();
    this.syncDraftTeams(room);

    return {
      valid: true,
      room: this.getPublicRoom(room),
      session: this.getSessionPayload(token)
    };
  }

  watchRoom({ roomCode, spectatorName }) {
    const room = this.getRoom(roomCode);
    if (!room) return { valid: false, error: 'Không tìm thấy room.' };

    const spectatorId = crypto.randomUUID();
    const token = this.createSession(room.code, 'spectator', spectatorId);
    room.spectators.set(spectatorId, {
      id: spectatorId,
      token,
      name: cleanText(spectatorName, 32, 'Khán giả'),
      connected: false,
      socketId: null
    });
    room.lastActiveAt = Date.now();

    return {
      valid: true,
      room: this.getPublicRoom(room),
      session: this.getSessionPayload(token)
    };
  }

  resumeRoom({ roomCode, token }) {
    const room = this.getRoom(roomCode);
    if (!room) return { valid: false, error: 'Không tìm thấy room.' };

    const context = this.getAuthContext(token);
    if (!context || context.room.code !== room.code) {
      return { valid: false, error: 'Phiên cũ không còn hợp lệ cho room này.' };
    }

    room.lastActiveAt = Date.now();
    return {
      valid: true,
      room: this.getPublicRoom(room),
      session: this.getSessionPayload(token)
    };
  }

  getRoom(roomCode) {
    return this.rooms.get(normalizeRoomCode(roomCode)) || null;
  }

  getAuthContext(token) {
    const session = this.sessions.get(String(token || ''));
    if (!session) return null;
    const room = this.rooms.get(session.roomCode);
    if (!room) return null;

    if (session.role === 'referee' && room.referee.id === session.ownerId) {
      return { token, room, role: 'referee', owner: room.referee, teamId: null };
    }
    if (session.role === 'team') {
      const participant = room.participants.find((item) => item.id === session.ownerId);
      if (!participant) return null;
      return { token, room, role: 'team', owner: participant, teamId: participant.teamId };
    }
    if (session.role === 'spectator') {
      const spectator = room.spectators.get(session.ownerId);
      if (!spectator) return null;
      return { token, room, role: 'spectator', owner: spectator, teamId: null };
    }
    return null;
  }

  getSessionPayload(token) {
    const context = this.getAuthContext(token);
    if (!context) return null;
    const { room, role, owner, teamId } = context;
    const team = role === 'team' ? getTeamOption(teamId) : null;
    return {
      token,
      roomCode: room.code,
      role,
      participantId: owner.id,
      teamId,
      name: role === 'team' ? owner.captainName : owner.name,
      teamName: team?.name || null,
      teamCode: team?.code || null,
      logoUrl: team?.logoUrl || null,
      color: team?.color || null
    };
  }

  connect(token, socketId) {
    const context = this.getAuthContext(token);
    if (!context) return null;
    const previousSocketId = context.owner.socketId;
    context.owner.connected = true;
    context.owner.socketId = socketId;
    context.room.lastActiveAt = Date.now();
    if (context.role === 'team') {
      context.room.draftRoom.setTeamConnection(context.teamId, true);
    }
    return { ...context, previousSocketId };
  }

  disconnect(token, socketId) {
    const context = this.getAuthContext(token);
    if (!context || context.owner.socketId !== socketId) return null;
    context.owner.connected = false;
    context.owner.socketId = null;
    context.room.lastActiveAt = Date.now();
    if (context.role === 'team') {
      context.room.draftRoom.setTeamConnection(context.teamId, false);
    }
    return context;
  }

  swapParticipant(room, participantId, targetTeamId) {
    if (room.draftRoom.status !== 'waiting') {
      return { valid: false, error: 'Không thể đổi đội sau khi Draft đã bắt đầu.' };
    }
    const participant = room.participants.find((item) => item.id === participantId);
    const targetId = Number(targetTeamId);
    if (!participant) return { valid: false, error: 'Không tìm thấy người chơi trong room.' };
    if (!getTeamOption(targetId)) return { valid: false, error: 'Vị trí đội không hợp lệ.' };
    if (participant.teamId === targetId) return { valid: true };

    const previousTeamId = participant.teamId;
    const targetParticipant = room.participants.find((item) => item.teamId === targetId);
    participant.teamId = targetId;
    if (targetParticipant) targetParticipant.teamId = previousTeamId;
    room.lastActiveAt = Date.now();
    this.syncDraftTeams(room);
    return { valid: true };
  }

  randomizeParticipants(room) {
    if (room.draftRoom.status !== 'waiting') {
      return { valid: false, error: 'Không thể random vị trí sau khi Draft đã bắt đầu.' };
    }
    const randomizedTeamIds = shuffled(TEAM_OPTIONS.map((team) => team.id));
    room.participants.forEach((participant, index) => {
      participant.teamId = randomizedTeamIds[index];
    });
    room.lastActiveAt = Date.now();
    this.syncDraftTeams(room);
    return { valid: true };
  }

  removeParticipant(room, playerId) {
    if (room.draftRoom.status !== 'waiting') {
      return { valid: false, error: 'Không thể rời hoặc xóa đội sau khi Draft đã bắt đầu.' };
    }
    const index = room.participants.findIndex((participant) => participant.id === playerId);
    if (index < 0) return { valid: false, error: 'Không tìm thấy đội trong room.' };
    const [participant] = room.participants.splice(index, 1);
    this.sessions.delete(participant.token);
    room.lastActiveAt = Date.now();
    this.syncDraftTeams(room);
    return { valid: true, participant };
  }

  syncDraftTeams(room) {
    const teams = TEAM_OPTIONS.map((teamOption) => {
      const participant = room.participants.find((item) => item.teamId === teamOption.id);
      return {
        ...createEmptyTeam(teamOption.id),
        ...teamOption,
        captainName: participant?.captainName || '',
        occupied: Boolean(participant),
        connected: Boolean(participant?.connected)
      };
    });
    room.draftRoom.setTeams(teams);
  }

  canStart(room) {
    return room.draftRoom.status === 'waiting'
      && room.participants.length === ROOM_SIZE
      && room.participants.every((participant) => participant.connected);
  }

  getPublicRoom(room) {
    const participantsBySlot = new Map(room.participants.map((participant) => [participant.teamId, participant]));
    return {
      code: room.code,
      status: room.draftRoom.status,
      createdAt: room.createdAt,
      referee: {
        name: room.referee.name,
        connected: room.referee.connected
      },
      players: TEAM_OPTIONS.map((team) => {
        const participant = participantsBySlot.get(team.id);
        return {
          ...team,
          id: participant?.id || null,
          teamId: team.id,
          teamName: team.name,
          captainName: participant?.captainName || null,
          connected: Boolean(participant?.connected)
        };
      }),
      connectedPlayers: room.participants.filter((participant) => participant.connected).length,
      spectatorCount: Array.from(room.spectators.values()).filter((spectator) => spectator.connected).length,
      canStart: this.canStart(room)
    };
  }

  destroyRoom(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return false;
    if (room.draftRoom.timerInterval) clearInterval(room.draftRoom.timerInterval);
    room.banRoom.dispose();
    this.sessions.delete(room.referee.token);
    room.participants.forEach((participant) => this.sessions.delete(participant.token));
    room.spectators.forEach((spectator) => this.sessions.delete(spectator.token));
    this.rooms.delete(room.code);
    return true;
  }

  cleanup(now = Date.now()) {
    for (const room of this.rooms.values()) {
      const idleFor = now - room.lastActiveAt;
      const shouldDeleteWaitingRoom = ['waiting', 'ready'].includes(room.draftRoom.status) && idleFor > 2 * 60 * 60 * 1000;
      const shouldDeleteFinishedRoom = room.draftRoom.status === 'completed' && idleFor > 6 * 60 * 60 * 1000;
      if (shouldDeleteWaitingRoom || shouldDeleteFinishedRoom) this.destroyRoom(room.code);
    }
  }
}

module.exports = {
  RoomManager,
  ROOM_SIZE,
  TEAM_OPTIONS,
  normalizeRoomCode,
  getTeamOption
};
