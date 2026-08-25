const test = require('node:test');
const assert = require('node:assert/strict');
const { MatchBanRoom, getFormationSlots, FORMATIONS } = require('./banEngine');

function makePlayer(prefix, number, pos, salary = 20) {
  return {
    id: `${prefix}-${number}`,
    name: `${prefix} Player ${number}`,
    pos,
    salary,
    ovr: 120,
    avatarUrl: ''
  };
}

function makeRoster(prefix) {
  return [
    makePlayer(prefix, 1, 'GK', 15),
    makePlayer(prefix, 2, 'GK', 16),
    makePlayer(prefix, 3, 'ST'),
    makePlayer(prefix, 4, 'LW'),
    makePlayer(prefix, 5, 'RW'),
    makePlayer(prefix, 6, 'CF'),
    makePlayer(prefix, 7, 'CAM'),
    makePlayer(prefix, 8, 'CM'),
    makePlayer(prefix, 9, 'CDM'),
    makePlayer(prefix, 10, 'LM'),
    makePlayer(prefix, 11, 'RM'),
    makePlayer(prefix, 12, 'CB'),
    makePlayer(prefix, 13, 'LB'),
    makePlayer(prefix, 14, 'RB'),
    makePlayer(prefix, 15, 'LWB'),
    makePlayer(prefix, 16, 'RWB'),
    ...Array.from({ length: 7 }, (_, index) => makePlayer(prefix, 17 + index, index < 3 ? 'CM' : 'CB'))
  ];
}

function makeDraftRoom(status = 'completed') {
  const rosters = ['A', 'B', 'C', 'D'].map(makeRoster);
  return {
    roomId: 'ban-test',
    status,
    teams: rosters.map((roster, index) => ({
      id: index + 1,
      code: String.fromCharCode(65 + index),
      name: `Team ${String.fromCharCode(65 + index)}`,
      startingXI: roster.slice(0, 11),
      subs: roster.slice(11)
    })),
    rosters
  };
}

function makeRoom() {
  const draftRoom = makeDraftRoom();
  const room = new MatchBanRoom(draftRoom);
  assert.equal(room.openSelection().valid, true);
  assert.equal(room.setup({ teamAId: 1, teamBId: 2 }).valid, true);
  return { room, rosterA: draftRoom.rosters[0], rosterB: draftRoom.rosters[1] };
}

function finishBans(room, rosterA, rosterB) {
  const teamAChoices = [rosterB[2], rosterB[6], rosterB[11], rosterB[3], rosterB[7]];
  const teamBChoices = [rosterA[2], rosterA[6], rosterA[11], rosterA[3], rosterA[7]];
  for (let index = 0; index < 5; index += 1) {
    assert.equal(room.banPlayer(teamAChoices[index], 1).valid, true);
    assert.equal(room.banPlayer(teamBChoices[index], 2).valid, true);
  }
  assert.equal(room.status, 'lineup');
}

function fillLineup(room, teamId, roster, bannedPlayers) {
  const bannedIds = new Set(bannedPlayers.map(player => String(player.id)));
  const slots = getFormationSlots('4231');
  const gk = roster.find(player => player.pos === 'GK' && !bannedIds.has(String(player.id)));
  const outfield = roster.filter(player => player.pos !== 'GK' && !bannedIds.has(String(player.id))).slice(0, 10);
  const gkSlot = slots.find(slot => slot.position === 'GK');
  assert.equal(room.setLineupPlayer(teamId, gkSlot.id, gk.id).valid, true);
  slots.filter(slot => slot.position !== 'GK').forEach((slot, index) => {
    assert.equal(room.setLineupPlayer(teamId, slot.id, outfield[index].id).valid, true);
  });
}

test('every supported formation contains exactly eleven players and one goalkeeper', () => {
  Object.keys(FORMATIONS).forEach(formationId => {
    const slots = getFormationSlots(formationId);
    assert.equal(slots.length, 11, `${formationId} must contain exactly 11 slots`);
    assert.equal(slots.filter(slot => slot.position === 'GK').length, 1, `${formationId} must contain exactly one GK`);
  });

  const formation4231 = getFormationSlots('4231');
  assert.equal(formation4231.filter(slot => slot.position === 'CDM').length, 2, '4231 must use two CDMs');
  const formation4213 = getFormationSlots('4213');
  assert.equal(formation4213.filter(slot => slot.position === 'CAM').length, 1, '4213 must include its CAM line');
  ['5212', '523', '532', '541'].forEach(formationId => {
    const defenders = getFormationSlots(formationId).filter(slot => ['LWB', 'LCB', 'CB', 'RCB', 'RWB'].includes(slot.position));
    assert.equal(defenders.length, 5, `${formationId} must keep all five defenders on the back line`);
  });
});

test('ban selection cannot open before all four teams complete draft', () => {
  const room = new MatchBanRoom(makeDraftRoom('drafting'));
  assert.equal(room.openSelection().valid, false);
  assert.equal(room.status, 'idle');
});

test('an active ban stage cannot be reset by opening pair selection again', () => {
  const { room } = makeRoom();
  assert.equal(room.openSelection().valid, false);
  assert.equal(room.status, 'banning');
});

test('ban turns alternate immediately and lineup stays inaccessible until both teams ban five', () => {
  const { room, rosterA, rosterB } = makeRoom();
  assert.equal(room.currentTurnKey, 'teamA');
  assert.equal(room.banPlayer(rosterA[2], 2).valid, false, 'team B cannot act on team A turn');
  assert.equal(room.setLineupFormation(1, '433').valid, false);

  assert.equal(room.banPlayer(rosterB[2], 1).valid, true);
  assert.equal(room.currentTurnKey, 'teamB');
  assert.equal(room.banPlayer(rosterA[2], 2).valid, true);
  assert.equal(room.currentTurnKey, 'teamA');
});

test('server rejects forged players, goalkeepers, duplicate irreversible bans and a third player in one line', () => {
  const { room, rosterA, rosterB } = makeRoom();
  assert.equal(room.banPlayer(makePlayer('FORGED', 1, 'ST'), 1).valid, false);
  assert.equal(room.banPlayer(rosterB[0], 1).valid, false);

  assert.equal(room.banPlayer(rosterB[2], 1).valid, true);
  assert.equal(room.banPlayer(rosterA[2], 2).valid, true);
  assert.equal(room.banPlayer(rosterB[3], 1).valid, true);
  assert.equal(room.banPlayer(rosterA[3], 2).valid, true);
  assert.equal(room.banPlayer(rosterB[4], 1).valid, false, 'third forward must be rejected');
  assert.equal(room.banPlayer(rosterB[2], 1).valid, false, 'a confirmed ban cannot be toggled off');
});

test('server rejects banned lineup players and invalid goalkeeper slots', () => {
  const { room, rosterA, rosterB } = makeRoom();
  finishBans(room, rosterA, rosterB);
  const slots = getFormationSlots('4231');
  const gkSlot = slots.find(slot => slot.position === 'GK');
  const stSlot = slots.find(slot => slot.position === 'ST');
  assert.equal(room.setLineupPlayer(1, stSlot.id, rosterA[2].id).valid, false, 'banned player must be unavailable');
  assert.equal(room.setLineupPlayer(1, stSlot.id, rosterA[0].id).valid, false, 'GK cannot play outfield');
  assert.equal(room.setLineupPlayer(1, gkSlot.id, rosterA[4].id).valid, false, 'outfield player cannot fill GK');
});

test('moving a player keeps it unique and formation changes preserve selected players', () => {
  const { room, rosterA, rosterB } = makeRoom();
  finishBans(room, rosterA, rosterB);
  const slots = getFormationSlots('4231').filter(slot => slot.position !== 'GK');
  assert.equal(room.setLineupPlayer(1, slots[0].id, rosterA[4].id).valid, true);
  assert.equal(room.setLineupPlayer(1, slots[1].id, rosterA[4].id).valid, true);
  assert.equal(room.getState().lineups.teamA.playerCount, 1);
  assert.equal(room.setLineupFormation(1, '433').valid, true);
  assert.equal(room.getState().lineups.teamA.playerCount, 1);
});

test('drag-style moves swap occupied outfield slots and protect the goalkeeper slot', () => {
  const { room, rosterA, rosterB } = makeRoom();
  finishBans(room, rosterA, rosterB);
  const slots = getFormationSlots('4231');
  const outfieldSlots = slots.filter(slot => slot.position !== 'GK');
  const gkSlot = slots.find(slot => slot.position === 'GK');

  assert.equal(room.setLineupPlayer(1, outfieldSlots[0].id, rosterA[4].id).valid, true);
  assert.equal(room.setLineupPlayer(1, outfieldSlots[1].id, rosterA[5].id).valid, true);
  assert.equal(room.moveLineupPlayer(1, outfieldSlots[0].id, outfieldSlots[1].id).valid, true);
  assert.equal(room.lineups.teamA.slots[outfieldSlots[0].id].id, rosterA[5].id);
  assert.equal(room.lineups.teamA.slots[outfieldSlots[1].id].id, rosterA[4].id);

  assert.equal(room.setLineupPlayer(1, gkSlot.id, rosterA[0].id).valid, true);
  assert.equal(room.moveLineupPlayer(1, gkSlot.id, outfieldSlots[0].id).valid, false);
});

test('salary cap is enforced for every lineup edit', () => {
  const { room, rosterA, rosterB } = makeRoom();
  finishBans(room, rosterA, rosterB);
  const expensive = rosterA[22];
  expensive.salary = 306;
  const outfieldSlot = getFormationSlots('4231').find(slot => slot.position !== 'GK');
  const result = room.setLineupPlayer(1, outfieldSlot.id, expensive.id);
  assert.equal(result.valid, false);
  assert.match(result.error, /305/);
});

test('captains receive only their own lineup while referee and spectator receive both', () => {
  const { room, rosterA, rosterB } = makeRoom();
  finishBans(room, rosterA, rosterB);
  fillLineup(room, 1, rosterA, room.currentBans.teamB);
  fillLineup(room, 2, rosterB, room.currentBans.teamA);
  assert.equal(room.lockLineup(1).valid, true);
  assert.equal(room.lockLineup(2).valid, true);

  const captainAState = room.getStateForViewer('team', 1);
  assert.ok(captainAState.lineups.teamA);
  assert.equal(captainAState.lineups.teamB, undefined);
  assert.ok(captainAState.gameHistory[1].lineups.teamA);
  assert.equal(captainAState.gameHistory[1].lineups.teamB, undefined);

  const captainOutsideMatch = room.getStateForViewer('team', 3);
  assert.deepEqual(captainOutsideMatch.lineups, {});

  const refereeState = room.getStateForViewer('referee', null);
  const spectatorState = room.getStateForViewer('spectator', null);
  assert.ok(refereeState.lineups.teamA && refereeState.lineups.teamB);
  assert.ok(spectatorState.lineups.teamA && spectatorState.lineups.teamB);
});

test('referee can return to pair selection only after both valid elevens are confirmed', () => {
  const { room, rosterA, rosterB } = makeRoom();
  finishBans(room, rosterA, rosterB);
  assert.equal(room.restartBanSelection().valid, false);

  fillLineup(room, 1, rosterA, room.currentBans.teamB);
  assert.equal(room.lockLineup(1).valid, true);
  assert.equal(room.restartBanSelection().valid, false);

  fillLineup(room, 2, rosterB, room.currentBans.teamA);
  assert.equal(room.lockLineup(2).valid, true);
  assert.equal(room.status, 'lineup_complete');
  assert.equal(room.restartBanSelection().valid, true);
  assert.equal(room.currentGame, 2);
  assert.equal(room.status, 'selecting');
});
