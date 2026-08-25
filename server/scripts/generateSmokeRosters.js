const fs = require('fs');
const path = require('path');

const API_BASE = process.env.FIFA_PICKER_API || 'http://127.0.0.1:5000';
const OUTPUT_PATH = path.resolve(__dirname, '../../client/src/smoke/smokeRosters.generated.json');
const TEAM_CODES = ['AMT', 'NK', 'FFB', 'TAG'];
const POSITION_QUERIES = [
  'gk',
  'cb,lb,rb,lwb,rwb',
  'cam,cm,cdm,lm,rm',
  'st,cf,lw,rw'
];
const MAIN_SLOTS = [
  ['GK', 29],
  ['LB', 26],
  ['CB', 27],
  ['CB', 28],
  ['RB', 29],
  ['CDM', 26],
  ['CM', 28],
  ['CAM', 29],
  ['LW', 26],
  ['RW', 28],
  ['ST', 29]
];
const SUBSTITUTE_SLOTS = ['GK', 'LWB', 'RWB', 'CB', 'CDM', 'CM', 'LM', 'RM', 'CF', 'LW', 'RW', 'ST'];
const PLAYER_FIELDS = [
  'id', 'name', 'pos', 'baseOvr', 'bonusOvr', 'ovr', 'maxPlus', 'salary',
  'season', 'seasonId', 'seasonName', 'seasonLogoUrl', 'cardBackgroundUrl',
  'clubName', 'teamId', 'avatarUrl', 'clubCrestUrl', 'preferredFoot',
  'nationId', 'nationUrl', 'weakFoot', 'skill', 'trait', 'traitId', 'traitIconUrl'
];

function normalizeIdentity(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const payload = await response.json();
  if (!payload.success) throw new Error(payload.error || `API request failed: ${url}`);
  return payload.data || [];
}

function compactPlayer(player) {
  return Object.fromEntries(PLAYER_FIELDS.map((field) => [field, player[field] ?? null]));
}

async function buildPlayerPools() {
  const seasons = await getJson(`${API_BASE}/api/seasons`);
  const classGroups = [];
  for (let index = 0; index < seasons.length; index += 8) {
    classGroups.push(seasons.slice(index, index + 8).map((season) => season.id));
  }

  const cards = [];
  for (const positions of POSITION_QUERIES) {
    for (const classes of classGroups) {
      const params = new URLSearchParams({
        class: classes.join(','),
        pos: positions
      });
      cards.push(...await getJson(`${API_BASE}/api/players?${params.toString()}`));
    }
  }

  const pools = {};
  for (const position of [...new Set([...MAIN_SLOTS.map(([pos]) => pos), ...SUBSTITUTE_SLOTS])]) {
    const seenCardIds = new Set();
    pools[position] = cards
      .filter((player) => player.pos === position && !seenCardIds.has(player.id) && seenCardIds.add(player.id))
      .sort((a, b) => b.ovr - a.ovr || a.salary - b.salary || a.name.localeCompare(b.name, 'vi'));
  }
  return pools;
}

function buildRosters(pools) {
  const usedIdentities = new Set();

  const pickPlayer = (position, salaryLimit = Number.POSITIVE_INFINITY) => {
    const available = pools[position].filter((player) => !usedIdentities.has(normalizeIdentity(player.name)));
    const selected = available.find((player) => player.salary <= salaryLimit) || available[0];
    if (!selected) throw new Error(`Không đủ cầu thủ thật cho vị trí ${position}`);
    usedIdentities.add(normalizeIdentity(selected.name));
    return compactPlayer(selected);
  };

  const teams = Object.fromEntries(TEAM_CODES.map((teamCode) => {
    const startingXI = MAIN_SLOTS.map(([position, salaryLimit]) => pickPlayer(position, salaryLimit));
    const substitutes = SUBSTITUTE_SLOTS.map((position) => pickPlayer(position));
    return [teamCode, { startingXI, substitutes }];
  }));

  for (const [teamCode, roster] of Object.entries(teams)) {
    const salary = roster.startingXI.reduce((total, player) => total + player.salary, 0);
    if (roster.startingXI.length !== 11 || roster.substitutes.length !== 12) {
      throw new Error(`${teamCode} không đủ 11 chính + 12 dự bị`);
    }
    if (roster.startingXI.filter((player) => player.pos === 'GK').length !== 1
      || roster.substitutes.filter((player) => player.pos === 'GK').length !== 1) {
      throw new Error(`${teamCode} không đủ 1 GK chính + 1 GK dự bị`);
    }
    if (salary > 305) throw new Error(`${teamCode} vượt quỹ lương: ${salary}/305`);
  }
  if (usedIdentities.size !== 92) throw new Error(`Cầu thủ không độc quyền: chỉ có ${usedIdentities.size}/92 tên`);

  return teams;
}

async function main() {
  const pools = await buildPlayerPools();
  const teams = buildRosters(pools);
  const snapshot = {
    source: 'FIFAaddict via FifaPicker API',
    generatedAt: new Date().toISOString(),
    teams
  };
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  for (const teamCode of TEAM_CODES) {
    const roster = teams[teamCode];
    const salary = roster.startingXI.reduce((total, player) => total + player.salary, 0);
    console.log(`${teamCode}: 11 chính + 12 dự bị, lương ${salary}/305`);
  }
  console.log(`Đã ghi snapshot 92 cầu thủ thật: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
