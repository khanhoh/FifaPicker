import { FORMATIONS, getFormationSlots } from '../data/formations';
import smokeRosterSnapshot from './smokeRosters.generated.json';

const TEAM_DEFINITIONS = [
  { id: 1, code: 'AMT', name: 'AMITA FCO', logoUrl: '/logos/AMT.png', color: '#ffffff' },
  { id: 2, code: 'NK', name: 'NK FC ONLINE', logoUrl: '/logos/NK.png', color: '#ef4444' },
  { id: 3, code: 'FFB', name: 'FOR FUN BROTHER', logoUrl: '/logos/FFB.png', color: '#ea580c' },
  { id: 4, code: 'TAG', name: 'TAG TEAM', logoUrl: '/logos/TAG.png', color: '#f97316' }
];

function emptyRoundPicks() {
  return {
    '1R': [null], '2R': [null], '3R': [null], '4R': [null, null],
    '5R': [null, null], '6R': [null, null], '7R': [null, null], '8R': [null, null, null],
    '-1R': [null, null], '-2R': [null, null], '-3R': [null, null, null],
    '-4R': [null, null], '-5R': [null, null, null], '-6R': []
  };
}

function populateRoundPicks(players) {
  const picks = emptyRoundPicks();
  const assignments = [
    ['1R', [0]], ['2R', [1]], ['3R', [2]], ['4R', [3, 4]],
    ['5R', [5, 6]], ['6R', [7, 8]], ['7R', [9, 10]],
    ['-1R', [11, 12]], ['-2R', [13, 14]], ['-3R', [15, 16, 17]],
    ['-4R', [18, 19]], ['-5R', [20, 21, 22]]
  ];
  assignments.forEach(([round, indexes]) => {
    picks[round] = indexes.map(index => players[index]);
  });
  return picks;
}

function createTeam(definition) {
  const roster = smokeRosterSnapshot.teams[definition.code];
  if (!roster) throw new Error(`Thiếu smoke roster cho đội ${definition.code}`);
  const startingXI = roster.startingXI.map((player) => ({ ...player }));
  const subs = roster.substitutes.map((player) => ({ ...player }));
  const players = [...startingXI, ...subs];
  return {
    ...definition,
    captainName: `${definition.code} Captain`,
    occupied: true,
    connected: true,
    startingXI,
    subs,
    roundPicks: populateRoundPicks(players),
    totalSalaryMain: startingXI.reduce((sum, player) => sum + player.salary, 0),
    gkCount: 2,
    mainGkCount: 1,
    subGkCount: 1
  };
}

export const SMOKE_TEAMS = TEAM_DEFINITIONS.map(createTeam);

export function createSmokeSession(role = 'team', teamId = 1) {
  const team = SMOKE_TEAMS.find(item => item.id === Number(teamId)) || SMOKE_TEAMS[0];
  if (role === 'referee') {
    return { token: 'smoke-preview', roomCode: 'SMOKE', role, participantId: 'smoke-referee', teamId: null, name: 'Smoke Referee' };
  }
  if (role === 'spectator') {
    return { token: 'smoke-preview', roomCode: 'SMOKE', role, participantId: 'smoke-spectator', teamId: null, name: 'Smoke Spectator' };
  }
  return {
    token: 'smoke-preview',
    roomCode: 'SMOKE',
    role: 'team',
    participantId: `smoke-team-${team.id}`,
    teamId: team.id,
    name: team.captainName,
    teamName: team.name,
    teamCode: team.code,
    logoUrl: team.logoUrl,
    color: team.color
  };
}

export function createSmokeLobby(status = 'waiting') {
  return {
    code: 'SMOKE',
    status,
    createdAt: Date.now(),
    referee: { name: 'Smoke Referee', connected: true },
    players: SMOKE_TEAMS.map(team => ({
      id: `smoke-team-${team.id}`,
      teamId: team.id,
      code: team.code,
      name: team.name,
      teamName: team.name,
      captainName: team.captainName,
      logoUrl: team.logoUrl,
      color: team.color,
      connected: true
    })),
    connectedPlayers: 4,
    spectatorCount: 1,
    canStart: true
  };
}

export function createSmokeDraftState(completed = false) {
  const currentRound = completed
    ? null
    : { roundNum: 4, label: '4R', phase: 'MAIN', picksPerTurn: 2, timeLimit: 60, direction: 'REVERSE' };
  const allPlayers = SMOKE_TEAMS.flatMap(team => [...team.startingXI, ...team.subs]);
  const pickedIdentities = SMOKE_TEAMS.flatMap((team) => (
    [...team.startingXI, ...team.subs].map((player) => [
      player.name.toLowerCase(),
      { teamName: team.name, season: player.season }
    ])
  ));
  return {
    status: completed ? 'completed' : 'drafting',
    currentRound,
    currentTeam: completed ? null : SMOKE_TEAMS[0],
    currentRoundIdx: completed ? 14 : 3,
    currentTeamTurnIdx: 0,
    picksInCurrentTurn: 0,
    neededPicks: completed ? 0 : 2,
    turnPickTarget: completed ? 0 : 2,
    turnRoundPickOffset: 0,
    timeLeft: completed ? 0 : 47,
    phaseProgress: {
      MAIN: SMOKE_TEAMS.map(team => ({ teamId: team.id, count: team.startingXI.length, gkCount: 1 })),
      SUB: SMOKE_TEAMS.map(team => ({ teamId: team.id, count: team.subs.length, gkCount: 1 }))
    },
    teams: SMOKE_TEAMS,
    pickedIds: allPlayers.map(player => player.id),
    pickedIdentities,
    history: allPlayers
  };
}

function createLineup(team, bannedPlayers, playerCount = 7) {
  const formation = '4231';
  const slots = Object.fromEntries(getFormationSlots(formation).map(slot => [slot.id, null]));
  const bannedIds = new Set(bannedPlayers.map(player => String(player.id)));
  const available = [...team.startingXI, ...team.subs].filter(player => !bannedIds.has(String(player.id)));
  const goalkeeper = available.find(player => player.pos === 'GK');
  const outfield = available.filter(player => player.pos !== 'GK').slice(0, Math.max(0, playerCount - 1));
  const formationSlots = getFormationSlots(formation);
  const goalkeeperSlot = formationSlots.find(slot => slot.position === 'GK');
  if (goalkeeper && goalkeeperSlot) slots[goalkeeperSlot.id] = goalkeeper;
  formationSlots.filter(slot => slot.position !== 'GK').forEach((slot, index) => {
    slots[slot.id] = outfield[index] || null;
  });
  const selected = Object.values(slots).filter(Boolean);
  return {
    formation,
    slots,
    locked: false,
    salary: selected.reduce((sum, player) => sum + player.salary, 0),
    playerCount: selected.length
  };
}

export function createSmokeBanState(stage = 'banning', teamAId = 1, teamBId = 2) {
  const requestedTeamA = SMOKE_TEAMS.find((team) => Number(team.id) === Number(teamAId));
  const requestedTeamB = SMOKE_TEAMS.find((team) => Number(team.id) === Number(teamBId));
  const teamA = requestedTeamA || SMOKE_TEAMS[0];
  const teamB = requestedTeamB && requestedTeamB.id !== teamA.id
    ? requestedTeamB
    : SMOKE_TEAMS.find((team) => team.id !== teamA.id);
  const teamABans = [teamB.startingXI[8], teamB.startingXI[9], teamB.startingXI[6], teamB.startingXI[7], teamB.startingXI[2]];
  const teamBBans = [teamA.startingXI[8], teamA.startingXI[9], teamA.startingXI[6], teamA.startingXI[7], teamA.startingXI[2]];
  const isSelecting = stage === 'selecting';
  const isLineup = stage === 'lineup';
  const currentBans = isSelecting
    ? { teamA: [], teamB: [] }
    : isLineup
      ? { teamA: teamABans, teamB: teamBBans }
      : { teamA: teamABans.slice(0, 2), teamB: teamBBans.slice(0, 1) };
  const lineups = {
    teamA: createLineup(teamA, currentBans.teamB),
    teamB: createLineup(teamB, currentBans.teamA)
  };
  return {
    status: stage,
    teamAId: isSelecting ? null : teamA.id,
    teamBId: isSelecting ? null : teamB.id,
    teamA,
    teamB,
    currentGame: 1,
    currentBans,
    currentTurnKey: stage === 'banning' ? 'teamA' : null,
    currentTurnTeamId: stage === 'banning' ? teamA.id : null,
    timeLeft: stage === 'banning' ? 24 : 0,
    gameHistory: {},
    banLimitPerTeam: 5,
    banTurnSeconds: 30,
    lineups,
    lineupSalaryCap: 305,
    formations: Object.keys(FORMATIONS),
    allLineupsLocked: false
  };
}
