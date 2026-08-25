const test = require('node:test');
const assert = require('node:assert/strict');
const { DraftRoom } = require('./draftEngine');

function makePlayer(id, pos = 'ST', salary = 10) {
  return {
    id,
    name: `Player ${id}`,
    pos,
    salary,
    season: 'TEST',
    seasonName: 'Test',
    ovr: 100
  };
}

function makeRoom() {
  const teams = [1, 2, 3, 4].map((id) => ({
    id,
    code: `T${id}`,
    name: `Team ${id}`,
    occupied: true,
    connected: true
  }));
  return new DraftRoom('draft-test', teams);
}

function fillPhase(team, phase, count, gkCount, prefix) {
  const players = Array.from({ length: count }, (_, index) => makePlayer(
    `${prefix}-${index}`,
    index < gkCount ? 'GK' : 'ST'
  ));
  if (phase === 'MAIN') {
    team.startingXI = players;
    team.mainGkCount = gkCount;
  } else {
    team.subs = players;
    team.subGkCount = gkCount;
  }
  team.gkCount = (team.mainGkCount || 0) + (team.subGkCount || 0);
}

function makeIo() {
  const events = [];
  return {
    events,
    to: () => ({ emit: (event, payload) => events.push({ event, payload }) })
  };
}

test('main and substitute phases each allow exactly one goalkeeper', () => {
  const room = makeRoom();
  const team = room.teams[0];
  room.status = 'drafting';
  room.currentRoundIdx = 0;

  fillPhase(team, 'MAIN', 1, 1, 'main-with-gk');
  assert.match(room.validatePick(makePlayer('second-main-gk', 'GK'), 1).error, /đúng 1 Thủ môn/);

  fillPhase(team, 'MAIN', 10, 0, 'main-no-gk');
  assert.match(room.validatePick(makePlayer('last-main-st', 'ST'), 1).error, /bắt buộc.*Thủ môn/);
  assert.equal(room.validatePick(makePlayer('last-main-gk', 'GK'), 1).valid, true);

  room.currentRoundIdx = 8;
  fillPhase(team, 'SUB', 1, 1, 'sub-with-gk');
  assert.match(room.validatePick(makePlayer('second-sub-gk', 'GK'), 1).error, /đúng 1 Thủ môn/);

  fillPhase(team, 'SUB', 11, 0, 'sub-no-gk');
  assert.match(room.validatePick(makePlayer('last-sub-st', 'ST'), 1).error, /bắt buộc.*Thủ môn/);
  assert.equal(room.validatePick(makePlayer('last-sub-gk', 'GK'), 1).valid, true);
});

test('compensation freezes the original missing count instead of shrinking after one pick', () => {
  const room = makeRoom();
  const io = makeIo();
  room.status = 'drafting';
  room.currentRoundIdx = 7;
  room.currentTeamTurnIdx = 0; // 8R is reverse, so Team 4 picks first.
  room.teams.forEach((team, index) => fillPhase(team, 'MAIN', index === 3 ? 9 : 11, 1, `main-${team.id}`));

  room.startTurnTimer(io);
  assert.equal(room.getCurrentTeam().id, 4);
  assert.equal(room.turnPickTarget, 2);
  assert.equal(room.timeLeft, 60);

  assert.equal(room.executePick(makePlayer('comp-main-1'), 4, io).valid, true);
  assert.equal(room.picksInCurrentTurn, 1);
  assert.equal(room.turnPickTarget, 2);
  assert.equal(room.currentRoundIdx, 7);
  assert.equal(room.getCurrentTeam().id, 4);

  assert.equal(room.executePick(makePlayer('comp-main-2'), 4, io).valid, true);
  assert.equal(room.currentRoundIdx, 8, 'only advance to substitutes after every main squad has 11 players');
  clearInterval(room.timerInterval);
});

test('compensation repeats until all teams have 23 players and one goalkeeper per phase', () => {
  const room = makeRoom();
  const io = makeIo();
  room.status = 'drafting';
  room.currentRoundIdx = 13;
  room.currentTeamTurnIdx = 0;
  room.teams.forEach((team) => {
    fillPhase(team, 'MAIN', 11, 1, `main-${team.id}`);
    fillPhase(team, 'SUB', team.id === 1 ? 10 : 12, 1, `sub-${team.id}`);
  });

  room.startTurnTimer(io);
  assert.equal(room.turnPickTarget, 2);
  assert.equal(room.executePick(makePlayer('comp-sub-1'), 1, io).valid, true);
  assert.equal(room.picksInCurrentTurn, 1);

  room.nextTurn(io); // Simulate missing the second pick before time expires.
  assert.equal(room.currentRoundIdx, 13, 'substitute compensation must repeat while a team is incomplete');
  assert.equal(room.getCurrentTeam().id, 1);
  assert.equal(room.turnPickTarget, 1, 'the next compensation turn must match the one remaining slot');

  assert.equal(room.executePick(makePlayer('comp-sub-2'), 1, io).valid, true);
  assert.equal(room.status, 'completed');
  room.teams.forEach((team) => {
    assert.equal(team.startingXI.length, 11);
    assert.equal(team.subs.length, 12);
    assert.equal(team.mainGkCount, 1);
    assert.equal(team.subGkCount, 1);
  });
});
