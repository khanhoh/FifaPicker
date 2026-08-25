const ROUNDS_CONFIG = [
  // --- ROUND 1: ĐỘI HÌNH CHÍNH (11 CẦU THỦ, MAX LƯƠNG 305, >= 1 GK) ---
  { roundNum: 1, label: '1R', phase: 'MAIN', picksPerTurn: 1, timeLimit: 30, direction: 'FORWARD' },
  { roundNum: 2, label: '2R', phase: 'MAIN', picksPerTurn: 1, timeLimit: 30, direction: 'REVERSE' },
  { roundNum: 3, label: '3R', phase: 'MAIN', picksPerTurn: 1, timeLimit: 30, direction: 'FORWARD' },
  { roundNum: 4, label: '4R', phase: 'MAIN', picksPerTurn: 2, timeLimit: 60, direction: 'REVERSE' },
  { roundNum: 5, label: '5R', phase: 'MAIN', picksPerTurn: 2, timeLimit: 60, direction: 'FORWARD' },
  { roundNum: 6, label: '6R', phase: 'MAIN', picksPerTurn: 2, timeLimit: 60, direction: 'REVERSE' },
  { roundNum: 7, label: '7R', phase: 'MAIN', picksPerTurn: 2, timeLimit: 60, direction: 'FORWARD' },
  { roundNum: 8, label: '8R', phase: 'MAIN', picksPerTurn: 1, timeLimit: 30, direction: 'REVERSE', isCompensate: true },

  // --- ROUND 2: DỰ BỊ (12 CẦU THỦ -> TỔNG 23 CẦU THỦ, >= 2 GK) ---
  { roundNum: 9,  label: '-1R', subLabel: '2.1', phase: 'SUB', picksPerTurn: 2, timeLimit: 60, direction: 'FORWARD' },
  { roundNum: 10, label: '-2R', subLabel: '2.2', phase: 'SUB', picksPerTurn: 2, timeLimit: 60, direction: 'REVERSE' },
  { roundNum: 11, label: '-3R', subLabel: '2.3', phase: 'SUB', picksPerTurn: 3, timeLimit: 90, direction: 'FORWARD' },
  { roundNum: 12, label: '-4R', subLabel: '2.4', phase: 'SUB', picksPerTurn: 2, timeLimit: 60, direction: 'REVERSE' },
  { roundNum: 13, label: '-5R', subLabel: '2.5', phase: 'SUB', picksPerTurn: 3, timeLimit: 90, direction: 'REVERSE' }
];

// 4 Đội theo thứ tự 1-4 chính xác theo ảnh người dùng cung cấp:
// 1: AMITA FCO (AMT)
// 2: NK FC ONLINE (NK)
// 3: FOR FUN BROTHER (FFB)
// 4: TAG TEAM (TAG)
const INITIAL_TEAMS = [
  { id: 1, code: 'AMT', name: 'AMITA FCO',        logoUrl: '/logos/AMT.png', color: '#ffffff', socketId: null, startingXI: [], subs: [], totalSalaryMain: 0, gkCount: 0 },
  { id: 2, code: 'NK',  name: 'NK FC ONLINE',     logoUrl: '/logos/NK.png',  color: '#ef4444', socketId: null, startingXI: [], subs: [], totalSalaryMain: 0, gkCount: 0 },
  { id: 3, code: 'FFB', name: 'FOR FUN BROTHER',  logoUrl: '/logos/FFB.png', color: '#ea580c', socketId: null, startingXI: [], subs: [], totalSalaryMain: 0, gkCount: 0 },
  { id: 4, code: 'TAG', name: 'TAG TEAM',        logoUrl: '/logos/TAG.png', color: '#f97316', socketId: null, startingXI: [], subs: [], totalSalaryMain: 0, gkCount: 0 }
];

function normalizePlayerIdentity(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

class DraftRoom {
  constructor(roomId = 'main_room') {
    this.roomId = roomId;
    this.reset();
  }

  reset() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.status = 'waiting';
    this.currentRoundIdx = 0;
    this.currentTeamTurnIdx = 0;
    this.picksInCurrentTurn = 0;
    this.timeLeft = 30;
    this.pickedPlayerIds = new Set();
    this.pickedPlayerIdentities = new Map();
    this.history = [];
    this.teams = JSON.parse(JSON.stringify(INITIAL_TEAMS));
  }

  getTurnOrder() {
    const config = ROUNDS_CONFIG[this.currentRoundIdx] || ROUNDS_CONFIG[0];
    return config.direction === 'FORWARD' ? [0, 1, 2, 3] : [3, 2, 1, 0];
  }

  getCurrentTeamIndex() {
    const turnOrder = this.getTurnOrder();
    return turnOrder[this.currentTeamTurnIdx];
  }

  getCurrentTeam() {
    const idx = this.getCurrentTeamIndex();
    return this.teams[idx];
  }

  getCurrentConfig() {
    return ROUNDS_CONFIG[this.currentRoundIdx] || null;
  }

  getPicksNeededForCurrentTurn() {
    const config = this.getCurrentConfig();
    if (!config) return 0;
    if (config.isCompensate) {
      const team = this.getCurrentTeam();
      return Math.max(0, 11 - team.startingXI.length);
    }
    return config.picksPerTurn;
  }

  startDraft(io) {
    if (this.status === 'drafting') return;
    this.status = 'drafting';
    this.currentRoundIdx = 0;
    this.currentTeamTurnIdx = 0;
    this.picksInCurrentTurn = 0;
    this.startTurnTimer(io);
  }

  pauseDraft(io) {
    if (this.status !== 'drafting') return;
    this.status = 'paused';
    if (this.timerInterval) clearInterval(this.timerInterval);
    console.log('⏸️ Draft đã được Trọng tài tạm dừng.');
    this.broadcastState(io);
  }

  resumeDraft(io) {
    if (this.status !== 'paused') return;
    this.status = 'drafting';
    console.log('▶️ Draft được Trọng tài tiếp tục.');
    this.startTurnTimer(io, true);
  }

  startTurnTimer(io, isResume = false) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const config = this.getCurrentConfig();
    if (!config) {
      this.finishDraft(io);
      return;
    }

    const currentTeam = this.getCurrentTeam();
    if (config.isCompensate && currentTeam.startingXI.length >= 11) {
      console.log(`⏩ [Auto-Skip 8R] ${currentTeam.name} đã đủ 11 cầu thủ chính.`);
      setTimeout(() => this.nextTurn(io), 500);
      return;
    }

    if (!isResume) {
      this.timeLeft = config.timeLimit;
    }

    this.broadcastState(io);

    this.timerInterval = setInterval(() => {
      if (this.status === 'paused') return;

      this.timeLeft -= 1;
      io.to(this.roomId).emit('timer_tick', {
        timeLeft: this.timeLeft,
        currentRound: config.label,
        currentTeamId: currentTeam.id
      });

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        console.log(`⏰ Hết giờ lượt pick của ${currentTeam.name} (Round ${config.label})`);
        this.nextTurn(io);
      }
    }, 1000);
  }

  validatePick(player, teamId) {
    if (this.status !== 'drafting') {
      return { valid: false, error: 'Phiên Draft đang tạm dừng hoặc chưa bắt đầu!' };
    }

    const currentTeam = this.getCurrentTeam();
    if (teamId && currentTeam.id !== parseInt(teamId, 10)) {
      return { valid: false, error: `Chưa tới lượt của bạn! Đang là lượt của ${currentTeam.name}.` };
    }

    const identityKey = normalizePlayerIdentity(player.name);
    if (this.pickedPlayerIdentities.has(identityKey)) {
      const existing = this.pickedPlayerIdentities.get(identityKey);
      return {
        valid: false,
        error: `Cầu thủ "${player.name}" đã được chọn bởi ${existing.teamName} (Mùa ${existing.season?.toUpperCase()}). Không thể chọn mùa khác của cùng cầu thủ này!`
      };
    }

    if (this.pickedPlayerIds.has(player.id)) {
      return { valid: false, error: `Thẻ "${player.name}" (${player.seasonName}) đã được chọn trước đó!` };
    }

    const config = this.getCurrentConfig();
    const isGK = String(player.pos).toUpperCase() === 'GK';

    if (config.phase === 'MAIN') {
      if (currentTeam.startingXI.length >= 11) {
        return { valid: false, error: 'Đội hình chính đã đủ 11 cầu thủ!' };
      }

      const salaryToAdd = parseInt(player.salary, 10) || 0;
      const newSalary = currentTeam.totalSalaryMain + salaryToAdd;
      if (newSalary > 305) {
        return {
          valid: false,
          error: `Vượt quá giới hạn lương 305! (Hiện tại: ${currentTeam.totalSalaryMain} + ${salaryToAdd} = ${newSalary}/305)`
        };
      }

      const slotsRemainingInMain = 11 - currentTeam.startingXI.length;
      if (slotsRemainingInMain === 1 && currentTeam.gkCount === 0 && !isGK) {
        return {
          valid: false,
          error: 'Đội hình chính bắt buộc phải có ít nhất 1 Thủ môn (GK)!'
        };
      }
    }

    if (config.phase === 'SUB') {
      const totalCount = currentTeam.startingXI.length + currentTeam.subs.length;
      if (totalCount >= 23) {
        return { valid: false, error: 'Đội đã đủ danh sách tối đa 23 cầu thủ!' };
      }

      if (totalCount === 22 && currentTeam.gkCount < 2 && !isGK) {
        return {
          valid: false,
          error: 'Toàn đội 23 cầu thủ bắt buộc phải có tối thiểu 2 Thủ môn (GK)!'
        };
      }
    }

    return { valid: true };
  }

  executePick(player, teamId, io) {
    const check = this.validatePick(player, teamId);
    if (!check.valid) return check;

    const team = this.getCurrentTeam();
    const config = this.getCurrentConfig();
    const isGK = String(player.pos).toUpperCase() === 'GK';
    const identityKey = normalizePlayerIdentity(player.name);

    this.pickedPlayerIds.add(player.id);
    this.pickedPlayerIdentities.set(identityKey, {
      name: player.name,
      teamId: team.id,
      teamName: team.name,
      season: player.season
    });

    if (isGK) team.gkCount += 1;

    const pickRecord = {
      ...player,
      roundLabel: config.label,
      pickedByTeamId: team.id,
      pickedByTeamName: team.name,
      phase: config.phase,
      timestamp: Date.now()
    };

    if (config.phase === 'MAIN') {
      team.startingXI.push(pickRecord);
      team.totalSalaryMain += (parseInt(player.salary, 10) || 0);
    } else {
      team.subs.push(pickRecord);
    }

    this.history.push(pickRecord);
    this.picksInCurrentTurn += 1;

    const neededPicks = this.getPicksNeededForCurrentTurn();
    const isTurnCompleted = this.picksInCurrentTurn >= neededPicks || (config.phase === 'MAIN' && team.startingXI.length === 11);

    io.to(this.roomId).emit('player_picked_event', {
      pick: pickRecord,
      team,
      isTurnCompleted,
      picksInCurrentTurn: this.picksInCurrentTurn,
      neededPicks: neededPicks,
      pickedPlayerIdentities: Array.from(this.pickedPlayerIdentities.entries())
    });

    if (isTurnCompleted) {
      this.nextTurn(io);
    } else {
      this.broadcastState(io);
    }

    return { valid: true, pick: pickRecord, isTurnCompleted };
  }

  nextTurn(io) {
    this.picksInCurrentTurn = 0;
    const turnOrder = this.getTurnOrder();

    this.currentTeamTurnIdx += 1;

    if (this.currentTeamTurnIdx >= turnOrder.length) {
      this.currentRoundIdx += 1;
      this.currentTeamTurnIdx = 0;
    }

    if (this.currentRoundIdx >= ROUNDS_CONFIG.length) {
      this.finishDraft(io);
      return;
    }

    this.startTurnTimer(io);
  }

  finishDraft(io) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.status = 'completed';
    console.log('🏆 Draft hoàn tất toàn bộ 13 Rounds!');
    this.broadcastState(io);
    io.to(this.roomId).emit('draft_completed', {
      message: 'Draft hoàn tất toàn bộ 23 cầu thủ cho 4 đội!',
      teams: this.teams
    });
  }

  getState() {
    return {
      roomId: this.roomId,
      status: this.status,
      currentRoundIdx: this.currentRoundIdx,
      currentRound: this.getCurrentConfig(),
      allRounds: ROUNDS_CONFIG,
      currentTeamTurnIdx: this.currentTeamTurnIdx,
      currentTeam: this.getCurrentTeam(),
      picksInCurrentTurn: this.picksInCurrentTurn,
      neededPicks: this.getPicksNeededForCurrentTurn(),
      timeLeft: this.timeLeft,
      teams: this.teams,
      pickedIds: Array.from(this.pickedPlayerIds),
      pickedIdentities: Array.from(this.pickedPlayerIdentities.entries()),
      history: this.history
    };
  }

  broadcastState(io) {
    io.to(this.roomId).emit('draft_state_update', this.getState());
  }
}

module.exports = {
  DraftRoom,
  ROUNDS_CONFIG,
  INITIAL_TEAMS,
  normalizePlayerIdentity
};
