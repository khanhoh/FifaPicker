// Match Ban + Lineup Engine - quản lý luật cấm và xếp đội hình từng game.

const LINEUP_SALARY_CAP = 305;
const DEFAULT_FORMATION = '4231';
const BAN_LIMIT_PER_TEAM = 5;
const BAN_TURN_SECONDS = 30;

// Mỗi phần tử là một tuyến từ trên xuống dưới; slot id được tạo ổn định để
// client và server có thể đồng bộ đội hình qua Socket.io.
const FORMATIONS = {
  '343': [['LW', 'ST', 'RW'], ['LM', 'LCM', 'RCM', 'RM'], ['LCB', 'CB', 'RCB'], ['GK']],
  '3412': [['ST', 'ST'], ['CAM'], ['LM', 'LCM', 'RCM', 'RM'], ['LCB', 'CB', 'RCB'], ['GK']],
  '352': [['ST', 'ST'], ['CAM'], ['LM', 'CDM', 'CDM', 'RM'], ['LCB', 'CB', 'RCB'], ['GK']],
  '41212': [['ST', 'ST'], ['CAM'], ['LM', 'RM'], ['CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4123': [['LW', 'ST', 'RW'], ['LCM', 'RCM'], ['CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4141': [['ST'], ['LM', 'LCM', 'RCM', 'RM'], ['CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4213': [['LW', 'ST', 'RW'], ['CAM'], ['CDM', 'CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4231': [['ST'], ['LAM', 'CAM', 'RAM'], ['CDM', 'CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4222': [['ST', 'ST'], ['LAM', 'RAM'], ['CDM', 'CDM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '424': [['LW', 'ST', 'ST', 'RW'], ['LCM', 'RCM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4312': [['ST', 'ST'], ['CAM'], ['LCM', 'CM', 'RCM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '433': [['LW', 'ST', 'RW'], ['LCM', 'CM', 'RCM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '4411': [['ST'], ['CF'], ['LM', 'LCM', 'RCM', 'RM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '442': [['ST', 'ST'], ['LM', 'LCM', 'RCM', 'RM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '451': [['ST'], ['LM', 'LCM', 'CM', 'RCM', 'RM'], ['LB', 'LCB', 'RCB', 'RB'], ['GK']],
  '5212': [['ST', 'ST'], ['CAM'], ['LCM', 'RCM'], ['LWB', 'LCB', 'CB', 'RCB', 'RWB'], ['GK']],
  '523': [['LW', 'ST', 'RW'], ['LCM', 'RCM'], ['LWB', 'LCB', 'CB', 'RCB', 'RWB'], ['GK']],
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
  if (['ST', 'CF', 'LW', 'RW', 'LF', 'RF'].includes(p)) return 'FW';
  if (['CAM', 'CM', 'CDM', 'LM', 'RM', 'LAM', 'RAM', 'LCM', 'RCM', 'LDM', 'RDM'].includes(p)) return 'MF';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'LCB', 'RCB', 'SW'].includes(p)) return 'DF';
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
      locked: false,
      ended: false
    };
  }

  resetLineups() {
    this.lineups = {
      teamA: this.createEmptyLineup(),
      teamB: this.createEmptyLineup()
    };
    this.lineupEndRequests = { teamA: null, teamB: null };
  }

  reset() {
    this.dispose();
    this.status = 'idle'; // idle | selecting | banning | lineup | lineup_complete
    this.teamAId = null;
    this.teamBId = null;
    this.currentGame = 1;
    this.currentBans = { teamA: [], teamB: [] };
    this.currentTurnKey = null;
    this.timeLeft = BAN_TURN_SECONDS;
    this.gameHistory = {};
    this.resetLineups();
  }

  dispose() {
    if (this.banTimerInterval) clearInterval(this.banTimerInterval);
    this.banTimerInterval = null;
  }

  openSelection({ allowRestart = false } = {}) {
    if (this.draftRoom.status !== 'completed') {
      return { valid: false, error: 'Draft phải hoàn tất đủ 23 cầu thủ mỗi đội trước khi mở giai đoạn Ban!' };
    }
    const canOpen = this.status === 'idle'
      || (allowRestart && ['lineup', 'lineup_complete'].includes(this.status));
    if (!canOpen) {
      return { valid: false, error: 'Không thể mở lại màn chọn cặp đấu ở thời điểm hiện tại!' };
    }
    this.dispose();
    this.status = 'selecting';
    this.teamAId = null;
    this.teamBId = null;
    this.currentBans = { teamA: [], teamB: [] };
    this.currentTurnKey = null;
    this.timeLeft = BAN_TURN_SECONDS;
    this.resetLineups();
    return { valid: true };
  }

  setup({ teamAId, teamBId }, io) {
    if (this.draftRoom.status !== 'completed') {
      return { valid: false, error: 'Draft chưa hoàn tất!' };
    }
    if (this.status !== 'selecting') {
      return { valid: false, error: 'Trọng tài chưa mở màn chọn cặp đấu!' };
    }
    const parsedTeamAId = parseInt(teamAId, 10);
    const parsedTeamBId = parseInt(teamBId, 10);
    const hasTeamA = this.draftRoom.teams.some(team => team.id === parsedTeamAId && team.startingXI?.length === 11 && team.subs?.length === 12);
    const hasTeamB = this.draftRoom.teams.some(team => team.id === parsedTeamBId && team.startingXI?.length === 11 && team.subs?.length === 12);

    if (!hasTeamA || !hasTeamB || parsedTeamAId === parsedTeamBId) {
      return { valid: false, error: 'Cần chọn đúng 2 đội khác nhau đã hoàn tất Draft!' };
    }

    this.teamAId = parsedTeamAId;
    this.teamBId = parsedTeamBId;
    this.status = 'banning';
    this.currentBans = { teamA: [], teamB: [] };
    this.currentTurnKey = 'teamA';
    this.timeLeft = BAN_TURN_SECONDS;
    this.resetLineups();
    this.startBanTimer(io);
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

  getCurrentTurnTeamId() {
    if (this.currentTurnKey === 'teamA') return this.teamAId;
    if (this.currentTurnKey === 'teamB') return this.teamBId;
    return null;
  }

  validateBanSelection(player, banningTeamId) {
    const teamKey = this.getTeamKey(banningTeamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (this.status !== 'banning') return { valid: false, error: 'Giai đoạn cấm cầu thủ đã kết thúc!' };
    if (teamKey !== this.currentTurnKey) return { valid: false, error: 'Chưa tới lượt Ban của đội bạn!' };

    const opponentKey = teamKey === 'teamA' ? 'teamB' : 'teamA';
    const rosterPlayer = this.getRosterByKey(opponentKey).find(p => samePlayerId(p.id, player?.id));
    if (!rosterPlayer) return { valid: false, error: 'Cầu thủ không thuộc danh sách đối phương!' };

    const posCat = getPositionCategory(rosterPlayer.pos);
    if (posCat === 'GK') return { valid: false, error: 'QUY TẮC: Không được phép cấm Thủ môn (GK)!' };
    if (!['FW', 'MF', 'DF'].includes(posCat)) return { valid: false, error: 'Không xác định được tuyến của cầu thủ này!' };

    const selectedList = this.currentBans[teamKey];
    if (selectedList.some(p => samePlayerId(p.id, rosterPlayer.id))) return { valid: false, error: 'Cầu thủ đã được chọn trong danh sách cấm!' };
    if (selectedList.length >= BAN_LIMIT_PER_TEAM) return { valid: false, error: 'Đã chọn đủ 5 cầu thủ cấm!' };

    const categoryCount = selectedList.filter(p => getPositionCategory(p.pos) === posCat).length;
    if (categoryCount >= 2) {
      const catName = posCat === 'FW' ? 'Tiền đạo' : posCat === 'MF' ? 'Tiền vệ' : 'Hậu vệ';
      return { valid: false, error: `QUY TẮC: Mỗi vị trí chỉ được cấm tối đa 2 cầu thủ! (Đã chọn 2 ${catName})` };
    }
    return { valid: true, player: rosterPlayer };
  }

  banPlayer(player, banningTeamId, io) {
    const teamKey = this.getTeamKey(banningTeamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    const check = this.validateBanSelection(player, banningTeamId);
    if (!check.valid) return check;
    this.currentBans[teamKey].push(check.player);
    this.advanceBanTurn(io);
    return { valid: true, action: 'added', player: check.player, completed: this.status === 'lineup' };
  }

  toggleBanPlayer(player, banningTeamId, io) {
    return this.banPlayer(player, banningTeamId, io);
  }

  startBanTimer(io, preserveTime = false) {
    this.dispose();
    if (this.status !== 'banning' || !io) return;
    if (!preserveTime) this.timeLeft = BAN_TURN_SECONDS;
    this.banTimerInterval = setInterval(() => {
      if (this.status !== 'banning') return;
      this.timeLeft -= 1;
      io.to(this.draftRoom.roomId).emit('ban_timer_tick', {
        timeLeft: this.timeLeft,
        currentTurnTeamId: this.getCurrentTurnTeamId()
      });
      if (this.timeLeft <= 0) this.advanceBanTurn(io);
    }, 1000);
  }

  advanceBanTurn(io) {
    this.dispose();
    if (this.currentBans.teamA.length === BAN_LIMIT_PER_TEAM && this.currentBans.teamB.length === BAN_LIMIT_PER_TEAM) {
      this.status = 'lineup';
      this.currentTurnKey = null;
      this.timeLeft = 0;
      this.resetLineups();
      this.gameHistory[this.currentGame] = {
        game: this.currentGame,
        teamABans: [...this.currentBans.teamA],
        teamBBans: [...this.currentBans.teamB],
        timestamp: Date.now()
      };
      this.broadcastState(io);
      return;
    }

    const otherKey = this.currentTurnKey === 'teamA' ? 'teamB' : 'teamA';
    this.currentTurnKey = this.currentBans[otherKey].length < BAN_LIMIT_PER_TEAM
      ? otherKey
      : this.currentTurnKey;
    this.timeLeft = BAN_TURN_SECONDS;
    this.startBanTimer(io, true);
    this.broadcastState(io);
  }

  broadcastState(io) {
    // Full ban/lineup state is emitted per authenticated viewer by server.js.
    // This shared event intentionally contains only turn metadata so one
    // Captain can never receive the opposing lineup through a room broadcast.
    if (io) {
      io.to(this.draftRoom.roomId).emit('ban_timer_tick', {
        timeLeft: this.timeLeft,
        currentTurnTeamId: this.getCurrentTurnTeamId()
      });
    }
  }

  getLineupSalary(lineup) {
    return Object.values(lineup.slots).reduce((sum, player) => sum + (parseInt(player?.salary, 10) || 0), 0);
  }

  setLineupFormation(teamId, formationId) {
    const teamKey = this.getTeamKey(teamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (!['lineup', 'lineup_complete'].includes(this.status)) return { valid: false, error: 'Chỉ được xếp đội hình sau khi hai đội Ban đủ 5 cầu thủ!' };
    if (!FORMATIONS[formationId]) return { valid: false, error: 'Sơ đồ đội hình không hợp lệ!' };

    const current = this.lineups[teamKey];
    if (current.locked) return { valid: false, error: 'Đội hình đã khóa và không thể chỉnh sửa!' };
    if (current.ended) return { valid: false, error: 'Đội đã xin kết thúc lineup và đang chờ Trọng tài xử lý!' };

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
    if (!['lineup', 'lineup_complete'].includes(this.status)) return { valid: false, error: 'Chỉ được xếp đội hình sau khi hai đội Ban đủ 5 cầu thủ!' };

    const lineup = this.lineups[teamKey];
    if (lineup.locked) return { valid: false, error: 'Đội hình đã khóa và không thể chỉnh sửa!' };
    if (lineup.ended) return { valid: false, error: 'Đội đã xin kết thúc lineup và đang chờ Trọng tài xử lý!' };
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
    if (!['lineup', 'lineup_complete'].includes(this.status)) return { valid: false, error: 'Chỉ được xếp đội hình sau khi hai đội Ban đủ 5 cầu thủ!' };

    const lineup = this.lineups[teamKey];
    if (lineup.locked) return { valid: false, error: 'Đội hình đã khóa và không thể chỉnh sửa!' };
    if (lineup.ended) return { valid: false, error: 'Đội đã xin kết thúc lineup và đang chờ Trọng tài xử lý!' };
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
    if (!['lineup', 'lineup_complete'].includes(this.status)) return { valid: false, error: 'Chưa tới giai đoạn xếp đội hình!' };
    if (this.lineups[teamKey].locked) return { valid: false, error: 'Đội hình đã khóa và không thể chỉnh sửa!' };
    if (this.lineups[teamKey].ended) return { valid: false, error: 'Đội đã xin kết thúc lineup và đang chờ Trọng tài xử lý!' };
    this.lineups[teamKey] = this.createEmptyLineup(this.lineups[teamKey].formation);
    return { valid: true };
  }

  lockLineup(teamId) {
    const teamKey = this.getTeamKey(teamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (!['lineup', 'lineup_complete'].includes(this.status)) return { valid: false, error: 'Chưa tới giai đoạn xếp đội hình!' };

    const lineup = this.lineups[teamKey];
    if (lineup.locked) return { valid: false, error: 'Đội hình đã được khóa!' };
    if (lineup.ended) return { valid: false, error: 'Đội đã xin kết thúc lineup và đang chờ Trọng tài xử lý!' };
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
      this.status = 'lineup_complete';
      this.gameHistory[this.currentGame] = {
        ...this.gameHistory[this.currentGame],
        lineups: JSON.parse(JSON.stringify(this.lineups)),
        lineupLockedAt: Date.now()
      };
    }
    return { valid: true, allLocked: this.lineups.teamA.locked && this.lineups.teamB.locked };
  }

  requestLineupEnd(teamId) {
    const teamKey = this.getTeamKey(teamId);
    if (!teamKey) return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    if (this.status !== 'lineup') return { valid: false, error: 'Chỉ được xin kết thúc khi đang xếp đội hình!' };

    const lineup = this.lineups[teamKey];
    if (lineup.locked) return { valid: false, error: 'Đội hình đã khóa, không cần gửi yêu cầu kết thúc!' };
    if (lineup.ended || this.lineupEndRequests[teamKey]) {
      return { valid: false, error: 'Yêu cầu kết thúc lineup đã được gửi tới Trọng tài!' };
    }

    const team = this.getTeamByKey(teamKey);
    lineup.ended = true;
    this.lineupEndRequests[teamKey] = {
      teamKey,
      teamId: team?.id || Number(teamId),
      teamName: team?.name || '',
      teamCode: team?.code || '',
      captainName: team?.captainName || '',
      requestedAt: Date.now()
    };
    return { valid: true, request: this.lineupEndRequests[teamKey] };
  }

  resolveLineupEndRequest(teamId, action) {
    const teamKey = this.getTeamKey(teamId);
    if (!teamKey || !this.lineupEndRequests[teamKey]) {
      return { valid: false, error: 'Không tìm thấy yêu cầu kết thúc lineup đang chờ xử lý!' };
    }
    if (!['resume', 'reset'].includes(action)) {
      return { valid: false, error: 'Cách xử lý yêu cầu lineup không hợp lệ!' };
    }

    if (action === 'reset') {
      const formation = this.lineups[teamKey].formation;
      this.lineups[teamKey] = this.createEmptyLineup(formation);
    } else {
      this.lineups[teamKey].ended = false;
    }
    this.lineupEndRequests[teamKey] = null;
    return { valid: true, action, teamKey };
  }

  nextGame() {
    return this.restartBanSelection();
  }

  restartBanSelection() {
    if (!['lineup', 'lineup_complete'].includes(this.status)) {
      return { valid: false, error: 'Chỉ có thể kết thúc lượt khi đang xếp đội hình!' };
    }
    const forcedEnd = this.status !== 'lineup_complete';
    this.gameHistory[this.currentGame] = {
      ...this.gameHistory[this.currentGame],
      lineups: JSON.parse(JSON.stringify(this.lineups)),
      lineupEndedAt: Date.now(),
      lineupForcedEnd: forcedEnd
    };
    this.currentGame += 1;
    return this.openSelection({ allowRestart: true });
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
      teamAId: this.teamAId,
      teamBId: this.teamBId,
      teamA,
      teamB,
      currentGame: this.currentGame,
      currentBans: this.currentBans,
      currentTurnKey: this.currentTurnKey,
      currentTurnTeamId: this.getCurrentTurnTeamId(),
      timeLeft: this.timeLeft,
      gameHistory: this.gameHistory,
      banLimitPerTeam: BAN_LIMIT_PER_TEAM,
      banTurnSeconds: BAN_TURN_SECONDS,
      lineups,
      lineupSalaryCap: LINEUP_SALARY_CAP,
      formations: Object.keys(FORMATIONS),
      lineupEndRequests: this.lineupEndRequests,
      allLineupsLocked: lineups.teamA.locked && lineups.teamB.locked
    };
  }

  getStateForViewer(role, teamId) {
    const state = this.getState();
    if (role !== 'team') return state;

    const teamKey = this.getTeamKey(teamId);
    // Teams outside the current pairing are read-only observers, just like
    // spectators/referees. Only the two participating Captains need their
    // opponent's private in-progress lineup hidden.
    if (!teamKey) return state;
    const ownLineup = state.lineups[teamKey];
    if (ownLineup?.locked || ownLineup?.ended) return state;
    const lineups = teamKey && state.lineups[teamKey]
      ? { [teamKey]: state.lineups[teamKey] }
      : {};
    const gameHistory = Object.fromEntries(Object.entries(state.gameHistory).map(([game, history]) => {
      if (!history?.lineups) return [game, history];
      return [game, {
        ...history,
        lineups: teamKey && history.lineups[teamKey]
          ? { [teamKey]: history.lineups[teamKey] }
          : {}
      }];
    }));

    return { ...state, lineups, gameHistory };
  }
}

module.exports = {
  MatchBanRoom,
  getPositionCategory,
  getFormationSlots,
  FORMATIONS,
  LINEUP_SALARY_CAP,
  BAN_LIMIT_PER_TEAM,
  BAN_TURN_SECONDS
};
