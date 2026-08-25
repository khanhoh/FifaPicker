const test = require('node:test');
const assert = require('node:assert/strict');
const { MatchBanRoom, getFormationSlots } = require('./banEngine');

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

function makeRoom() {
  const rosterA = makeRoster('A');
  const rosterB = makeRoster('B');
  const draftRoom = {
    teams: [
      { id: 1, name: 'Team A', startingXI: rosterA.slice(0, 11), subs: rosterA.slice(11) },
      { id: 2, name: 'Team B', startingXI: rosterB.slice(0, 11), subs: rosterB.slice(11) },
      { id: 3, name: 'Team C', startingXI: [], subs: [] },
      { id: 4, name: 'Team D', startingXI: [], subs: [] }
    ]
  };
  const room = new MatchBanRoom(draftRoom);
  assert.equal(room.setup({ teamAId: 1, teamBId: 2, seriesType: 'BO5', gameNumber: 1 }).valid, true);
  return { room, rosterA, rosterB };
}

function finishBans(room, rosterA, rosterB) {
  // Team A cấm roster B; Team B cấm roster A. Mỗi bên: 2 FW, 2 MF, 1 DF.
  [rosterB[2], rosterB[3], rosterB[6], rosterB[7], rosterB[11]].forEach(player => {
    assert.equal(room.toggleBanPlayer(player, 1).valid, true);
  });
  [rosterA[2], rosterA[3], rosterA[6], rosterA[7], rosterA[11]].forEach(player => {
    assert.equal(room.toggleBanPlayer(player, 2).valid, true);
  });
  assert.equal(room.lockTeamBans(1).valid, true);
  assert.equal(room.lockTeamBans(2).valid, true);
  assert.equal(room.status, 'locked');
}

function fillLineup(room, teamId, roster, bannedPlayers) {
  const bannedIds = new Set(bannedPlayers.map(player => String(player.id)));
  const slots = getFormationSlots('4231');
  const gk = roster.find(player => player.pos === 'GK');
  const outfield = roster.filter(player => player.pos !== 'GK' && !bannedIds.has(String(player.id))).slice(0, 10);
  const gkSlot = slots.find(slot => slot.position === 'GK');
  assert.equal(room.setLineupPlayer(teamId, gkSlot.id, gk.id).valid, true);
  slots.filter(slot => slot.position !== 'GK').forEach((slot, index) => {
    assert.equal(room.setLineupPlayer(teamId, slot.id, outfield[index].id).valid, true);
  });
}

test('lineup phase only starts after both teams lock exactly five bans', () => {
  const { room, rosterA, rosterB } = makeRoom();
  assert.equal(room.setLineupFormation(1, '433').valid, false);
  finishBans(room, rosterA, rosterB);
  assert.equal(room.getState().lineups.teamA.playerCount, 0);
  assert.equal(room.getState().lineupSalaryCap, 305);
});

test('server rejects forged bans, banned lineup players and invalid goalkeeper slots', () => {
  const { room, rosterA, rosterB } = makeRoom();
  assert.equal(room.toggleBanPlayer(makePlayer('FORGED', 1, 'ST'), 1).valid, false);
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

test('next game is blocked until both valid elevens are locked', () => {
  const { room, rosterA, rosterB } = makeRoom();
  finishBans(room, rosterA, rosterB);
  assert.equal(room.nextGame().valid, false);

  fillLineup(room, 1, rosterA, room.currentBans.teamB);
  assert.equal(room.lockLineup(1).valid, true);
  assert.equal(room.nextGame().valid, false);

  fillLineup(room, 2, rosterB, room.currentBans.teamA);
  const finalLock = room.lockLineup(2);
  assert.equal(finalLock.valid, true);
  assert.equal(finalLock.allLocked, true);
  assert.equal(room.getState().allLineupsLocked, true);
  assert.equal(room.nextGame().valid, true);
  assert.equal(room.currentGame, 2);
  assert.equal(room.status, 'banning');
});
