const test = require('node:test');
const assert = require('node:assert/strict');
const { RoomManager, TEAM_OPTIONS } = require('./roomManager');

function createFullRoom(manager) {
  const created = manager.createRoom({ refereeName: 'Referee' });
  const sessions = [];
  for (let index = 1; index <= 4; index += 1) {
    const joined = manager.joinRoom({
      roomCode: created.room.code,
      captainName: `Captain ${index}`
    });
    assert.equal(joined.valid, true);
    sessions.push(joined.session);
  }
  return { created, sessions, room: manager.getRoom(created.room.code) };
}

test('room codes are unique and a fifth team cannot take a slot', () => {
  const manager = new RoomManager();
  const first = createFullRoom(manager);
  const second = manager.createRoom({ refereeName: 'Other Referee' });

  assert.notEqual(first.created.room.code, second.room.code);
  const fifth = manager.joinRoom({ roomCode: first.room.code, captainName: 'Captain 5' });
  assert.equal(fifth.valid, false);
  assert.match(fifth.error, /đủ 4 đội/i);
});

test('start gate opens only after all four team sessions are connected', () => {
  const manager = new RoomManager();
  const { sessions, room } = createFullRoom(manager);

  assert.equal(manager.canStart(room), false);
  sessions.slice(0, 3).forEach((session, index) => manager.connect(session.token, `socket-${index}`));
  assert.equal(manager.canStart(room), false);
  manager.connect(sessions[3].token, 'socket-4');
  assert.equal(manager.canStart(room), true);
});

test('the four fixed team options keep their metadata and are assigned once each', () => {
  const manager = new RoomManager();
  const { sessions, room } = createFullRoom(manager);

  assert.deepEqual(room.participants.map((participant) => participant.teamId).sort(), [1, 2, 3, 4]);
  assert.deepEqual(room.draftRoom.teams.map((team) => team.code), TEAM_OPTIONS.map((team) => team.code));
  assert.deepEqual(room.draftRoom.teams.map((team) => team.logoUrl), TEAM_OPTIONS.map((team) => team.logoUrl));
  sessions.forEach((session) => {
    const team = TEAM_OPTIONS.find((option) => option.id === session.teamId);
    assert.equal(session.teamName, team.name);
    assert.equal(session.logoUrl, team.logoUrl);
  });
});

test('server session owns the role and follows a direct player swap', () => {
  const manager = new RoomManager();
  const { created, sessions, room } = createFullRoom(manager);
  const first = room.participants[0];
  const second = room.participants[1];
  const firstTeamId = first.teamId;
  const secondTeamId = second.teamId;

  assert.equal(manager.getAuthContext(created.session.token).role, 'referee');
  assert.equal(manager.getAuthContext(sessions[0].token).role, 'team');
  assert.equal(manager.swapParticipant(room, first.id, secondTeamId).valid, true);
  assert.equal(first.teamId, secondTeamId);
  assert.equal(second.teamId, firstTeamId);
  assert.equal(manager.getSessionPayload(first.token).teamId, secondTeamId);
  assert.equal(manager.getSessionPayload(first.token).teamCode, TEAM_OPTIONS[secondTeamId - 1].code);
});

test('referee randomize keeps every participant in one unique fixed team slot', () => {
  const manager = new RoomManager();
  const { room } = createFullRoom(manager);

  assert.equal(manager.randomizeParticipants(room).valid, true);
  assert.deepEqual(room.participants.map((participant) => participant.teamId).sort(), [1, 2, 3, 4]);
  assert.deepEqual(room.draftRoom.teams.map((team) => team.code), ['AMT', 'NK', 'FFB', 'TAG']);
});

test('swap and randomize are locked after the draft starts', () => {
  const manager = new RoomManager();
  const { room } = createFullRoom(manager);
  const fakeIo = { to: () => ({ emit: () => {} }) };
  const participant = room.participants[0];
  const targetTeamId = room.participants[1].teamId;
  room.draftRoom.prepareDraft(fakeIo);
  room.draftRoom.startDraft(fakeIo);

  assert.equal(manager.swapParticipant(room, participant.id, targetTeamId).valid, false);
  assert.equal(manager.randomizeParticipants(room).valid, false);
  clearInterval(room.draftRoom.timerInterval);
});

test('disconnect during a running draft keeps the timer and turn alive', () => {
  const manager = new RoomManager();
  const { created, sessions, room } = createFullRoom(manager);
  manager.connect(created.session.token, 'referee-socket');
  sessions.forEach((session, index) => manager.connect(session.token, `socket-${index}`));
  const fakeIo = { to: () => ({ emit: () => {} }) };

  room.draftRoom.prepareDraft(fakeIo);
  room.draftRoom.startDraft(fakeIo);
  const currentTeamId = room.draftRoom.getCurrentTeam().id;
  manager.disconnect(sessions[0].token, 'socket-0');
  manager.disconnect(created.session.token, 'referee-socket');

  assert.equal(room.draftRoom.status, 'drafting');
  assert.equal(room.referee.connected, false);
  assert.equal(room.draftRoom.getCurrentTeam().id, currentTeamId);
  assert.ok(room.draftRoom.timerInterval);
  clearInterval(room.draftRoom.timerInterval);
});

test('a disconnected player keeps the reserved slot after draft start', () => {
  const manager = new RoomManager();
  const { sessions, room } = createFullRoom(manager);
  sessions.forEach((session, index) => manager.connect(session.token, `socket-${index}`));
  const fakeIo = { to: () => ({ emit: () => {} }) };
  room.draftRoom.prepareDraft(fakeIo);
  room.draftRoom.startDraft(fakeIo);

  const reservedTeamId = room.participants[1].teamId;
  manager.disconnect(sessions[1].token, 'socket-1');
  const removal = manager.removeParticipant(room, room.participants[1].id);

  assert.equal(removal.valid, false);
  assert.equal(room.participants.length, 4);
  assert.equal(manager.getSessionPayload(sessions[1].token).teamId, reservedTeamId);
  clearInterval(room.draftRoom.timerInterval);
});

test('an exited player can resume the same session, team slot and draft data', () => {
  const manager = new RoomManager();
  const { sessions, room } = createFullRoom(manager);
  sessions.forEach((session, index) => manager.connect(session.token, `socket-${index}`));
  const fakeIo = { to: () => ({ emit: () => {} }) };
  room.draftRoom.prepareDraft(fakeIo);
  room.draftRoom.startDraft(fakeIo);

  const session = sessions[1];
  const team = room.draftRoom.teams.find((item) => item.id === session.teamId);
  team.startingXI.push({ id: 'saved-player', name: 'Saved Player', pos: 'ST', salary: 20 });
  manager.disconnect(session.token, 'socket-1');

  const resumed = manager.resumeRoom({ roomCode: room.code, token: session.token });
  assert.equal(resumed.valid, true);
  assert.equal(resumed.session.token, session.token);
  assert.equal(resumed.session.teamId, session.teamId);
  assert.equal(room.participants.length, 4);
  assert.equal(team.startingXI[0].id, 'saved-player');
  assert.equal(room.draftRoom.status, 'drafting');
  assert.equal(team.connected, false);

  manager.connect(resumed.session.token, 'socket-returned');
  assert.equal(team.connected, true);
  clearInterval(room.draftRoom.timerInterval);
});

test('resume rejects an invalid token or a token from another room', () => {
  const manager = new RoomManager();
  const first = createFullRoom(manager);
  const second = createFullRoom(manager);

  assert.equal(manager.resumeRoom({ roomCode: first.room.code, token: 'invalid-token' }).valid, false);
  assert.equal(manager.resumeRoom({ roomCode: first.room.code, token: second.sessions[0].token }).valid, false);
});

test('draft state is isolated between rooms', () => {
  const manager = new RoomManager();
  const first = createFullRoom(manager);
  const second = createFullRoom(manager);
  const fakeIo = { to: () => ({ emit: () => {} }) };

  first.room.draftRoom.prepareDraft(fakeIo);
  first.room.draftRoom.startDraft(fakeIo);

  assert.equal(first.room.draftRoom.status, 'drafting');
  assert.equal(second.room.draftRoom.status, 'waiting');
  assert.notEqual(first.room.draftRoom.teams, second.room.draftRoom.teams);
  clearInterval(first.room.draftRoom.timerInterval);
});

test('destroying a room revokes every session and removes the room', () => {
  const manager = new RoomManager();
  const { created, sessions, room } = createFullRoom(manager);
  const spectator = manager.watchRoom({ roomCode: room.code, spectatorName: 'Viewer' });
  const tokens = [created.session.token, ...sessions.map((session) => session.token), spectator.session.token];

  assert.equal(manager.destroyRoom(room.code), true);
  assert.equal(manager.getRoom(room.code), null);
  tokens.forEach((token) => assert.equal(manager.getAuthContext(token), null));
});

test('destroying one room preserves other rooms and their sessions', () => {
  const manager = new RoomManager();
  const first = createFullRoom(manager);
  const second = createFullRoom(manager);

  assert.equal(manager.destroyRoom(first.room.code), true);
  assert.equal(manager.getRoom(first.room.code), null);
  assert.equal(manager.getRoom(second.room.code), second.room);
  assert.equal(manager.getAuthContext(second.created.session.token).room.code, second.room.code);
  second.sessions.forEach((session) => {
    assert.equal(manager.getAuthContext(session.token).room.code, second.room.code);
  });
});
