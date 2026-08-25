// Match Ban Engine - Quản lý luật cấm cầu thủ trước mỗi trận đấu đơn

function getPositionCategory(pos) {
  const p = String(pos || '').toUpperCase();
  if (['ST', 'CF', 'LW', 'RW'].includes(p)) return 'FW';
  if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(p)) return 'MF';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'DF';
  if (p === 'GK') return 'GK';
  return 'OTHER';
}

class MatchBanRoom {
  constructor(draftRoom) {
    this.draftRoom = draftRoom;
    this.reset();
  }

  reset() {
    this.status = 'idle'; // 'idle' | 'banning' | 'locked'
    this.seriesType = 'BO5'; // 'BO3' | 'BO5' | 'BO7'
    this.teamAId = 1; // Team 1 (e.g. AMT)
    this.teamBId = 2; // Team 2 (e.g. NK)
    this.currentGame = 1; // Game 1, 2, 3, 4, 5...
    this.currentBans = {
      teamA: [], // Danh sách cầu thủ Team A cấm (từ squad Team B)
      teamB: []  // Danh sách cầu thủ Team B cấm (từ squad Team A)
    };
    this.lockedStatus = {
      teamA: false,
      teamB: false
    };
    // Lịch sử ban theo từng Game: { 1: { teamABans: [...], teamBBans: [...] }, 2: ... }
    this.gameHistory = {};
  }

  getMaxBanLimitPerPlayer() {
    if (this.seriesType === 'BO7') return 3;
    if (this.seriesType === 'BO5') return 2;
    return 2;
  }

  // Đếm số lần cầu thủ đã bị cấm trong toàn bộ Series
  getBanCountInSeries(playerId) {
    let count = 0;
    for (const g in this.gameHistory) {
      const hist = this.gameHistory[g];
      if (hist.teamABans && hist.teamABans.some(p => p.id === playerId)) count++;
      if (hist.teamBBans && hist.teamBBans.some(p => p.id === playerId)) count++;
    }
    return count;
  }

  // Kiểm tra cầu thủ có bị cấm ở game liền trước (Game N-1) không
  isBannedInPreviousGame(playerId) {
    if (this.currentGame <= 1) return false;
    const prevGameHist = this.gameHistory[this.currentGame - 1];
    if (!prevGameHist) return false;

    const inTeamA = prevGameHist.teamABans && prevGameHist.teamABans.some(p => p.id === playerId);
    const inTeamB = prevGameHist.teamBBans && prevGameHist.teamBBans.some(p => p.id === playerId);
    return inTeamA || inTeamB;
  }

  // Validate một lượt chọn ban
  validateBanSelection(player, banningTeamId) {
    const isTeamA = parseInt(banningTeamId, 10) === this.teamAId;
    const isTeamB = parseInt(banningTeamId, 10) === this.teamBId;

    if (!isTeamA && !isTeamB) {
      return { valid: false, error: 'Đội của bạn không tham gia trận đấu này!' };
    }

    const teamKey = isTeamA ? 'teamA' : 'teamB';
    if (this.lockedStatus[teamKey]) {
      return { valid: false, error: 'Đội bạn đã khóa danh sách cấm!' };
    }

    const posCat = getPositionCategory(player.pos);

    // 1. Không được cấm thủ môn
    if (posCat === 'GK') {
      return { valid: false, error: 'QUY TẮC: Không được phép cấm Thủ môn (GK)!' };
    }

    // 2. Không được cấm trùng cầu thủ trong 2 trận liên tiếp
    if (this.isBannedInPreviousGame(player.id)) {
      return {
        valid: false,
        error: `QUY TẮC: Cầu thủ "${player.name}" đã bị cấm ở Game ${this.currentGame - 1}. Không được cấm trùng trong 2 trận liên tiếp!`
      };
    }

    // 3. Giới hạn số lần cấm tối đa trong Series (BO5: tối đa 2 lần, BO7: tối đa 3 lần)
    const currentBanCount = this.getBanCountInSeries(player.id);
    const maxLimit = this.getMaxBanLimitPerPlayer();
    if (currentBanCount >= maxLimit) {
      return {
        valid: false,
        error: `QUY TẮC: Cầu thủ "${player.name}" đã bị cấm ${currentBanCount}/${maxLimit} lần trong loạt trận ${this.seriesType}!`
      };
    }

    // 4. Kiểm tra giới hạn 2 cầu thủ cho mỗi vị trí (FW <= 2, MF <= 2, DF <= 2)
    const selectedList = this.currentBans[teamKey];
    if (selectedList.some(p => p.id === player.id)) {
      return { valid: false, error: 'Cầu thủ đã được chọn trong danh sách cấm!' };
    }

    if (selectedList.length >= 5) {
      return { valid: false, error: 'Đã chọn tối đa 5 cầu thủ cấm!' };
    }

    const categoryCount = selectedList.filter(p => getPositionCategory(p.pos) === posCat).length;
    if (categoryCount >= 2) {
      const catName = posCat === 'FW' ? 'Tiền đạo' : posCat === 'MF' ? 'Tiền vệ' : 'Hậu vệ';
      return { valid: false, error: `QUY TẮC: Mỗi vị trí chỉ được cấm tối đa 2 cầu thủ! (Đã chọn 2 ${catName})` };
    }

    return { valid: true };
  }

  toggleBanPlayer(player, banningTeamId) {
    const isTeamA = parseInt(banningTeamId, 10) === this.teamAId;
    const teamKey = isTeamA ? 'teamA' : 'teamB';
    const list = this.currentBans[teamKey];

    const existingIdx = list.findIndex(p => p.id === player.id);
    if (existingIdx >= 0) {
      list.splice(existingIdx, 1);
      return { valid: true, action: 'removed', player };
    }

    const check = this.validateBanSelection(player, banningTeamId);
    if (!check.valid) return check;

    list.push(player);
    return { valid: true, action: 'added', player };
  }

  lockTeamBans(banningTeamId) {
    const isTeamA = parseInt(banningTeamId, 10) === this.teamAId;
    const teamKey = isTeamA ? 'teamA' : 'teamB';
    const list = this.currentBans[teamKey];

    if (list.length !== 5) {
      return { valid: false, error: `Cần chọn đủ đúng 5 cầu thủ cấm trước khi khóa! (Hiện tại: ${list.length}/5)` };
    }

    this.lockedStatus[teamKey] = true;

    // Nếu cả 2 đội đều đã khóa
    if (this.lockedStatus.teamA && this.lockedStatus.teamB) {
      this.status = 'locked';
      this.gameHistory[this.currentGame] = {
        game: this.currentGame,
        teamABans: [...this.currentBans.teamA],
        teamBBans: [...this.currentBans.teamB],
        timestamp: Date.now()
      };
    }

    return { valid: true, allLocked: this.status === 'locked' };
  }

  nextGame() {
    this.currentGame += 1;
    this.currentBans = { teamA: [], teamB: [] };
    this.lockedStatus = { teamA: false, teamB: false };
    this.status = 'banning';
  }

  getState() {
    const teamA = this.draftRoom.teams.find(t => t.id === this.teamAId) || this.draftRoom.teams[0];
    const teamB = this.draftRoom.teams.find(t => t.id === this.teamBId) || this.draftRoom.teams[1];

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
      maxBanLimit: this.getMaxBanLimitPerPlayer()
    };
  }
}

module.exports = {
  MatchBanRoom,
  getPositionCategory
};
