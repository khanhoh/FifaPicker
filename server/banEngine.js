// Match Ban + Lineup Engine - quản lý luật cấm và xếp đội hình từng game.

const LINEUP_SALARY_CAP = 305;
const DEFAULT_FORMATION = '4231';

// Mỗi phần tử là một tuyến từ trên xuống dưới; slot id được tạo ổn định để
// client và server có thể đồng bộ đội hình qua Socket.io.
const FORMATIONS = {
  '343': [['LW', 'ST', 'RW'], ['LM', 'CM', 'CM', 'RM'], ['LCB', 'CB', 'RCB'], ['GK']],
  '3412': [['ST', 'ST'], ['CAM'], ['LM', 'CM', 'CM', 'RM'], ['LCB', 'CB', 'RCB'], ['GK']],
  '352': [['ST', 'ST'], ['CAM'], ['LM', 'CDM', 'CDM', 'RM'], ['LCB', 'CB', 'RCB'], ['GK']],
  '41212': [['ST', 'ST'], ['CAM'], ['LM', 'RM'], ['CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4123': [['LW', 'ST', 'RW'], ['CM', 'CM'], ['CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4141': [['ST'], ['LM', 'CM', 'CM', 'RM'], ['CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4213': [['LW', 'ST', 'RW'], ['CDM', 'CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4231': [['ST'], ['LAM', 'CAM', 'RAM'], ['LDM', 'RDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4222': [['ST', 'ST'], ['LAM', 'RAM'], ['LDM', 'RDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '424': [['LW', 'ST', 'ST', 'RW'], ['CM', 'CM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4312': [['ST', 'ST'], ['CAM'], ['LCM', 'CM', 'RCM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '433': [['LW', 'ST', 'RW'], ['LCM', 'CM', 'RCM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4411': [['ST'], ['CF'], ['LM', 'CM', 'CM', 'RM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '442': [['ST', 'ST'], ['LM', 'CM', 'CM', 'RM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '451': [['ST'], ['LAM', 'CAM', 'RAM'], ['LCM', 'RCM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '5212': [['ST', 'ST'], ['CAM'], ['LWB', 'CM', 'RWB'], ['LCB', 'CB', 'RCB'], ['GK']],
  '523': [['LW', 'ST', 'RW'], ['LWB', 'CM', 'RWB'], ['LCB', 'CB', 'RCB'], ['GK']],
  '532': [['ST', 'ST'], ['LCM', 'CM', 'RCM'], ['LWB', 'LCB', 'CB', 'RCB', 'RWB'], ['GK']],
  '541': [['ST'], ['LM', 'LCM', 'RCM', 'RM'], ['LWB', 'LCB', 'CB', 'RCB', 'RWB'], ['GK']]
};

function getFormationSlots(formationId) {
  const rows = FORMATIONS[formationId] || FORMATIONS[DEFAULT_FORMATION];
  return rows.flatMap((row, rowIndex) => row.map((position, columnIndex) => ({
    id: `${position}-${rowIndex}-${columnIndex}`,
    position
  })));
}

function getPositionCategory(pos) {
  const p = String(pos || '').toUpperCase();
  if (['ST', 'CF', 'LW', 'RW'].includes(p)) return 'FW';
  if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(p)) return 'MF';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'DF';
  if (p === 'GK') return 'GK';
  return 'OTHER';
}

function samePlayerId(a, b) {
  return String(a) === String(b);
}

class MatchBanRoom {
  constructor(draftRoom) {
    this.draftRoom = draftRoom;
    this.reset();
  }

  createEmptyLineup(formationId = DEFAULT_FORMATION) {
    const safeFormation = FORMATIONS[formationId] ? formationId : DEFAULT_FORMATION;
    return {
      formation: safeFormation,
      slots: Object.fromEntries(getFormationSlots(safeFormation).map(slot => [slot.id, null])),
      locked: false
    };
  }

  resetLineups() {
    this.lineups = {
      teamA: this.createEmptyLineup(),
      teamB: this.createEmptyLineup()
    };
  }

  reset() {
    this.status = 'idle'; // 'idle' | 'banning' | 'locked'
    this.seriesType = 'BO5';
    this.teamAId = 1;
    this.teamBId = 2;
    this.currentGame = 1;
    this.currentBans = { teamA: [], teamB: [] };
    this.lockedStatus = { teamA: false, teamB: false };
    this.gameHistory = {};
    this.resetLineups();
  }

  setup({ teamAId, teamBId, seriesType, gameNumber }) {
    const parsedTeamAId = parseInt(teamAId, 10);
    const parsedTeamBId = parseInt(teamBId, 10);
    const hasTeamA = this.draftRoom.teams.some(team => team.id === parsedTeamAId);
    const hasTeamB = this.draftRoom.teams.some(team => team.id === parsedTeamBId);

    if (!hasTeamA || !hasTeamB || parsedTeamAId === parsedTeamBId) {
      return { valid: false, error: 'Cần chọn đúng 2 đội khác nhau để bắt đầu!' };
    }

    this.teamAId = parsedTeamAId;
    this.teamBId = parsedTeamBId;
    this.seriesType = ['BO3', 'BO5', 'BO7'].includes(seriesType) ? seriesType : 'BO5';
    this.currentGame = Math.max(1, parseInt(gameNumber, 10) || 1);
    this.status = 'banning';
    this.currentBans = { teamA: [], teamB: [] };
    this.lockedStatus = { teamA: false, teamB: false };
    this.gameHistory = {};
    this.resetLineups();
    return { valid: true };
  }

  getTeamKey(teamId) {
    const parsedId = parseInt(teamId, 10);
    if (parsedId === this.teamAId) return 'teamA';
    if (parsedId === this.teamBId) return 'teamB';
    return null;
  }

  getTeamByKey(teamKey) {
    const teamId = teamKey === 'teamA' ? this.teamAId : this.teamBId;
    return this.draftRoom.teams.find(team => team.id === teamId) || null;
  }

  getRosterByKey(teamKey) {
    const team = this.getTeamByKey(teamKey);
    return team ? [...(team.startingXI || []), ...(team.subs || [])] : [];
  }

  getBansAgainstTeam(teamKey) {
    return teamKey === 'teamA' ? this.currentBans.teamB : this.currentBans.teamA;
  }

  getMaxBanLimitPerPlayer() {
    if (this.seriesType === 'BO7') return 3;
    return 2;
  }

  getBanCountInSeries(playerId) {
    let count = 0;
    for (const g in this.gameHistory) {
      const hist = this.gameHistory[g];
      if (hist.teamABans?.some(p => samePlayerId(p.id, playerId))) count++;
      if (hist.teamBBans?.some(p => samePlayerId(p.id, playerId))) count++;
    }
    return count;
  }

  isBannedInPreviousGame(playerId) {
    if (this.currentGame <= 1) return false;
    const prevGameHist = this.gameHistory[this.currentGame - 1];
    if (!prevGameHist) return false;
    return Boolean(
      prevGameHist.teamABans?.some(p => samePlayerId(p.id, playerId)) ||
      prevGameHist.teamBBans?.some(p => samePlayerId(p.id, playerId))
    );
  }

  validateBanSelection(player, banningTeamId) {
    const teamKey = this.getTeamKey(banningTeamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (this.status !== 'banning') return { valid: false, error: 'Giai đoạn cấm cầu thủ đã kết thúc!' };
    if (this.lockedStatus[teamKey]) return { valid: false, error: 'Đội bạn đã khóa danh sách cấm!' };

    const opponentKey = teamKey === 'teamA' ? 'teamB' : 'teamA';
    const rosterPlayer = this.getRosterByKey(opponentKey).find(p => samePlayerId(p.id, player?.id));
    if (!rosterPlayer) return { valid: false, error: 'Cầu thủ không thuộc danh sách đối phương!' };

    const posCat = getPositionCategory(rosterPlayer.pos);
    if (posCat === 'GK') return { valid: false, error: 'QUY TẮC: Không được phép cấm Thủ môn (GK)!' };
    if (this.isBannedInPreviousGame(rosterPlayer.id)) {
      return { valid: false, error: `QUY TẮC: Cầu thủ "${rosterPlayer.name}" đã bị cấm ở Game ${this.currentGame - 1}. Không được cấm trùng trong 2 trận liên tiếp!` };
    }

    const currentBanCount = this.getBanCountInSeries(rosterPlayer.id);
    const maxLimit = this.getMaxBanLimitPerPlayer();
    if (currentBanCount >= maxLimit) {
      return { valid: false, error: `QUY TẮC: Cầu thủ "${rosterPlayer.name}" đã bị cấm ${currentBanCount}/${maxLimit} lần trong loạt trận ${this.seriesType}!` };
    }

    const selectedList = this.currentBans[teamKey];
    if (selectedList.some(p => samePlayerId(p.id, rosterPlayer.id))) return { valid: false, error: 'Cầu thủ đã được chọn trong danh sách cấm!' };
    if (selectedList.length >= 5) return { valid: false, error: 'Đã chọn tối đa 5 cầu thủ cấm!' };

    const categoryCount = selectedList.filter(p => getPositionCategory(p.pos) === posCat).length;
    if (categoryCount >= 2) {
      const catName = posCat === 'FW' ? 'Tiền đạo' : posCat === 'MF' ? 'Tiền vệ' : 'Hậu vệ';
      return { valid: false, error: `QUY TẮC: Mỗi vị trí chỉ được cấm tối đa 2 cầu thủ! (Đã chọn 2 ${catName})` };
    }
    return { valid: true, player: rosterPlayer };
  }

  toggleBanPlayer(player, banningTeamId) {
    const teamKey = this.getTeamKey(banningTeamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    const list = this.currentBans[teamKey];
    const existingIdx = list.findIndex(p => samePlayerId(p.id, player?.id));
    if (existingIdx >= 0 && this.status === 'banning' && !this.lockedStatus[teamKey]) {
      const [removed] = list.splice(existingIdx, 1);
      return { valid: true, action: 'removed', player: removed };
    }

    const check = this.validateBanSelection(player, banningTeamId);
    if (!check.valid) return check;
    list.push(check.player);
    return { valid: true, action: 'added', player: check.player };
  }

  lockTeamBans(banningTeamId) {
    const teamKey = this.getTeamKey(banningTeamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (this.status !== 'banning') return { valid: false, error: 'Giai đoạn cấm cầu thủ đã kết thúc!' };
    const list = this.currentBans[teamKey];
    if (list.length !== 5) return { valid: false, error: `Cần chọn đủ đúng 5 cầu thủ cấm trước khi khóa! (Hiện tại: ${list.length}/5)` };

    this.lockedStatus[teamKey] = true;
    if (this.lockedStatus.teamA && this.lockedStatus.teamB) {
      this.status = 'locked';
      this.resetLineups();
      this.gameHistory[this.currentGame] = {
        game: this.currentGame,
        teamABans: [...this.currentBans.teamA],
        teamBBans: [...this.currentBans.teamB],
        timestamp: Date.now()
      };
    }
    return { valid: true, allLocked: this.status === 'locked' };
  }

  getLineupSalary(lineup) {
    return Object.values(lineup.slots).reduce((sum, player) => sum + (parseInt(player?.salary, 10) || 0), 0);
  }

  setLineupFormation(teamId, formationId) {
    const teamKey = this.getTeamKey(teamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (this.status !== 'locked') return { valid: false, error: 'Chỉ được xếp đội hình sau khi hai đội đã khóa cấm!' };
    if (!FORMATIONS[formationId]) return { valid: false, error: 'Sơ đồ đội hình không hợp lệ!' };

    const current = this.lineups[teamKey];
    if (current.locked) return { valid: false, error: 'Đội hình đã khóa và không thể chỉnh sửa!' };

    const selectedPlayers = Object.values(current.slots).filter(Boolean);
    const next = this.createEmptyLineup(formationId);
    const newSlots = getFormationSlots(formationId);
    const gkPlayer = selectedPlayers.find(player => getPositionCategory(player.pos) === 'GK');
    const remainingPlayers = selectedPlayers.filter(player => !samePlayerId(player.id, gkPlayer?.id));
    const gkSlot = newSlots.find(slot => slot.position === 'GK');
    if (gkPlayer && gkSlot) next.slots[gkSlot.id] = gkPlayer;

    const outfieldSlots = newSlots.filter(slot => slot.position !== 'GK');
    remainingPlayers.slice(0, outfieldSlots.length).forEach((player, index) => {
      next.slots[outfieldSlots[index].id] = player;
    });
    this.lineups[teamKey] = next;
    return { valid: true };
  }

  setLineupPlayer(teamId, slotId, playerId) {
    const teamKey = this.getTeamKey(teamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (this.status !== 'locked') return { valid: false, error: 'Chỉ được xếp đội hình sau khi hai đội đã khóa cấm!' };

    const lineup = this.lineups[teamKey];
    if (lineup.locked) return { valid: false, error: 'Đội hình đã khóa và không thể chỉnh sửa!' };
    const slot = getFormationSlots(lineup.formation).find(item => item.id === slotId);
    if (!slot) return { valid: false, error: 'Vị trí đội hình không hợp lệ!' };

    if (playerId === null || playerId === undefined || playerId === '') {
      lineup.slots[slotId] = null;
      return { valid: true };
    }

    const player = this.getRosterByKey(teamKey).find(item => samePlayerId(item.id, playerId));
    if (!player) return { valid: false, error: 'Cầu thủ không thuộc danh sách đã draft của đội!' };
    if (this.getBansAgainstTeam(teamKey).some(item => samePlayerId(item.id, player.id))) {
      return { valid: false, error: `Cầu thủ "${player.name}" đã bị đối phương cấm ở game này!` };
    }

    const playerIsGK = getPositionCategory(player.pos) === 'GK';
    const slotIsGK = slot.position === 'GK';
    if (slotIsGK !== playerIsGK) {
      return { valid: false, error: slotIsGK ? 'Ô GK bắt buộc phải chọn Thủ môn!' : 'Thủ môn chỉ được xếp vào ô GK!' };
    }

    const nextSlots = { ...lineup.slots };
    for (const existingSlotId of Object.keys(nextSlots)) {
      if (nextSlots[existingSlotId] && samePlayerId(nextSlots[existingSlotId].id, player.id)) nextSlots[existingSlotId] = null;
    }
    nextSlots[slotId] = player;
    const nextSalary = this.getLineupSalary({ slots: nextSlots });
    if (nextSalary > LINEUP_SALARY_CAP) {
      return { valid: false, error: `Vượt quỹ lương đội hình ${LINEUP_SALARY_CAP}! (Đội hình mới: ${nextSalary}/${LINEUP_SALARY_CAP})` };
    }

    lineup.slots = nextSlots;
    return { valid: true };
  }

  moveLineupPlayer(teamId, sourceSlotId, targetSlotId) {
    const teamKey = this.getTeamKey(teamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (this.status !== 'locked') return { valid: false, error: 'Chỉ được xếp đội hình sau khi hai đội đã khóa cấm!' };

    const lineup = this.lineups[teamKey];
    if (lineup.locked) return { valid: false, error: 'Đội hình đã khóa và không thể chỉnh sửa!' };
    if (sourceSlotId === targetSlotId) return { valid: true };

    const formationSlots = getFormationSlots(lineup.formation);
    const sourceSlot = formationSlots.find(item => item.id === sourceSlotId);
    const targetSlot = formationSlots.find(item => item.id === targetSlotId);
    if (!sourceSlot || !targetSlot) return { valid: false, error: 'Vị trí đội hình không hợp lệ!' };

    const sourcePlayer = lineup.slots[sourceSlotId];
    const targetPlayer = lineup.slots[targetSlotId];
    if (!sourcePlayer) return { valid: false, error: 'Không có cầu thủ tại vị trí cần di chuyển!' };

    const sourcePlayerIsGK = getPositionCategory(sourcePlayer.pos) === 'GK';
    const targetSlotIsGK = targetSlot.position === 'GK';
    if (sourcePlayerIsGK !== targetSlotIsGK) {
      return { valid: false, error: targetSlotIsGK ? 'Ô GK bắt buộc phải chọn Thủ môn!' : 'Thủ môn chỉ được xếp vào ô GK!' };
    }
    if (targetPlayer) {
      const targetPlayerIsGK = getPositionCategory(targetPlayer.pos) === 'GK';
      const sourceSlotIsGK = sourceSlot.position === 'GK';
      if (targetPlayerIsGK !== sourceSlotIsGK) {
        return { valid: false, error: sourceSlotIsGK ? 'Ô GK bắt buộc phải chọn Thủ môn!' : 'Thủ môn chỉ được xếp vào ô GK!' };
      }
    }

    lineup.slots = {
      ...lineup.slots,
      [sourceSlotId]: targetPlayer || null,
      [targetSlotId]: sourcePlayer
    };
    return { valid: true };
  }

  clearLineup(teamId) {
    const teamKey = this.getTeamKey(teamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (this.status !== 'locked') return { valid: false, error: 'Chưa tới giai đoạn xếp đội hình!' };
    if (this.lineups[teamKey].locked) return { valid: false, error: 'Đội hình đã khóa và không thể chỉnh sửa!' };
    this.lineups[teamKey] = this.createEmptyLineup(this.lineups[teamKey].formation);
    return { valid: true };
  }

  lockLineup(teamId) {
    const teamKey = this.getTeamKey(teamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (this.status !== 'locked') return { valid: false, error: 'Chưa tới giai đoạn xếp đội hình!' };

    const lineup = this.lineups[teamKey];
    if (lineup.locked) return { valid: false, error: 'Đội hình đã được khóa!' };
    const players = Object.values(lineup.slots).filter(Boolean);
    if (players.length !== 11) return { valid: false, error: `Cần xếp đủ đúng 11 cầu thủ! (Hiện tại: ${players.length}/11)` };

    const gkSlot = getFormationSlots(lineup.formation).find(slot => slot.position === 'GK');
    if (!gkSlot || getPositionCategory(lineup.slots[gkSlot.id]?.pos) !== 'GK') {
      return { valid: false, error: 'Đội hình bắt buộc phải có 1 Thủ môn tại vị trí GK!' };
    }
    const salary = this.getLineupSalary(lineup);
    if (salary > LINEUP_SALARY_CAP) return { valid: false, error: `Quỹ lương đội hình vượt ${LINEUP_SALARY_CAP}!` };

    lineup.locked = true;
    if (this.lineups.teamA.locked && this.lineups.teamB.locked) {
      this.gameHistory[this.currentGame] = {
        ...this.gameHistory[this.currentGame],
        lineups: JSON.parse(JSON.stringify(this.lineups)),
        lineupLockedAt: Date.now()
      };
    }
    return { valid: true, allLocked: this.lineups.teamA.locked && this.lineups.teamB.locked };
  }

  nextGame() {
    if (this.status !== 'locked' || !this.lineups.teamA.locked || !this.lineups.teamB.locked) {
      return { valid: false, error: 'Hai đội phải xếp đủ và khóa đội hình trước khi chuyển sang game tiếp theo!' };
    }
    this.currentGame += 1;
    this.currentBans = { teamA: [], teamB: [] };
    this.lockedStatus = { teamA: false, teamB: false };
    this.status = 'banning';
    this.resetLineups();
    return { valid: true };
  }

  getState() {
    const teamA = this.getTeamByKey('teamA') || this.draftRoom.teams[0];
    const teamB = this.getTeamByKey('teamB') || this.draftRoom.teams[1];
    const lineups = {
      teamA: { ...this.lineups.teamA, salary: this.getLineupSalary(this.lineups.teamA), playerCount: Object.values(this.lineups.teamA.slots).filter(Boolean).length },
      teamB: { ...this.lineups.teamB, salary: this.getLineupSalary(this.lineups.teamB), playerCount: Object.values(this.lineups.teamB.slots).filter(Boolean).length }
    };

    return {
      status: this.status,
      seriesType: this.seriesType,
      teamAId: this.teamAId,
      teamBId: this.teamBId,
      teamA,
      teamB,
      currentGame: this.currentGame,
      currentBans: this.currentBans,
      lockedStatus: this.lockedStatus,
      gameHistory: this.gameHistory,
      maxBanLimit: this.getMaxBanLimitPerPlayer(),
      lineups,
      lineupSalaryCap: LINEUP_SALARY_CAP,
      formations: Object.keys(FORMATIONS),
      allLineupsLocked: lineups.teamA.locked && lineups.teamB.locked
    };
  }
}

module.exports = {
  MatchBanRoom,
  getPositionCategory,
  getFormationSlots,
  FORMATIONS,
  LINEUP_SALARY_CAP
};
