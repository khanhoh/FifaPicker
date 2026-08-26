const ROUNDS_CONFIG = [
  // --- ROUND 1: ĐỘI HÌNH CHÍNH (11 CẦU THỦ, MAX LƯƠNG 305, ĐÚNG 1 GK) ---
  { roundNum: 1, label: '1R', phase: 'MAIN', picksPerTurn: 1, timeLimit: 30, direction: 'FORWARD' },
  { roundNum: 2, label: '2R', phase: 'MAIN', picksPerTurn: 1, timeLimit: 30, direction: 'REVERSE' },
  { roundNum: 3, label: '3R', phase: 'MAIN', picksPerTurn: 1, timeLimit: 30, direction: 'FORWARD' },
  { roundNum: 4, label: '4R', phase: 'MAIN', picksPerTurn: 2, timeLimit: 60, direction: 'REVERSE' },
  { roundNum: 5, label: '5R', phase: 'MAIN', picksPerTurn: 2, timeLimit: 60, direction: 'FORWARD' },
  { roundNum: 6, label: '6R', phase: 'MAIN', picksPerTurn: 2, timeLimit: 60, direction: 'REVERSE' },
  { roundNum: 7, label: '7R', phase: 'MAIN', picksPerTurn: 2, timeLimit: 60, direction: 'FORWARD' },
  { roundNum: 8, label: '8R', phase: 'MAIN', picksPerTurn: 1, timeLimit: 30, direction: 'REVERSE', isCompensate: true },

  // --- ROUND 2: DỰ BỊ (12 CẦU THỦ -> TỔNG 23 CẦU THỦ, ĐÚNG 1 GK) ---
  { roundNum: 9,  label: '-1R', subLabel: '2.1', phase: 'SUB', picksPerTurn: 2, timeLimit: 60, direction: 'FORWARD' },
  { roundNum: 10, label: '-2R', subLabel: '2.2', phase: 'SUB', picksPerTurn: 2, timeLimit: 60, direction: 'REVERSE' },
  { roundNum: 11, label: '-3R', subLabel: '2.3', phase: 'SUB', picksPerTurn: 3, timeLimit: 90, direction: 'FORWARD' },
  { roundNum: 12, label: '-4R', subLabel: '2.4', phase: 'SUB', picksPerTurn: 2, timeLimit: 60, direction: 'REVERSE' },
  { roundNum: 13, label: '-5R', subLabel: '2.5', phase: 'SUB', picksPerTurn: 3, timeLimit: 90, direction: 'FORWARD' },
  { roundNum: 14, label: '-6R', subLabel: 'BÙ', phase: 'SUB', picksPerTurn: 1, timeLimit: 30, direction: 'FORWARD', isCompensate: true }
];

function getInitialRoundPicks() {
  return {
    '1R': [null],
    '2R': [null],
    '3R': [null],
    '4R': [null, null],
    '5R': [null, null],
    '6R': [null, null],
    '7R': [null, null],
    '8R': [null, null, null],
    '-1R': [null, null],
    '-2R': [null, null],
    '-3R': [null, null, null],
    '-4R': [null, null],
    '-5R': [null, null, null],
    '-6R': []
  };
}

function createEmptyTeam(slotId) {
  return {
    id: slotId,
    code: `T${slotId}`,
    name: `Đang chờ đội ${slotId}`,
    captainName: '',
    logoUrl: null,
    color: '#64748b',
    occupied: false,
    connected: false
  };
}

const INITIAL_TEAMS = [1, 2, 3, 4].map(createEmptyTeam);

function createDraftTeam(team) {
  return {
    ...team,
    startingXI: [],
    subs: [],
    roundPicks: getInitialRoundPicks(),
    totalSalaryMain: 0,
    gkCount: 0,
    mainGkCount: 0,
    subGkCount: 0
  };
}

function normalizePlayerIdentity(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

class DraftRoom {
  constructor(roomId, teams = INITIAL_TEAMS) {
    this.roomId = roomId;
    this.teamSeeds = teams.map((team, index) => ({
      ...createEmptyTeam(index + 1),
      ...team,
      id: index + 1
    }));
    this.reset();
  }

  setTeams(teams) {
    if (this.status !== 'waiting') {
      return { valid: false, error: 'Không thể thay đổi đội sau khi Draft đã bắt đầu.' };
    }

    this.teamSeeds = [0, 1, 2, 3].map((index) => ({
      ...createEmptyTeam(index + 1),
      ...(teams[index] || {}),
      id: index + 1
    }));
    this.teams = this.teamSeeds.map(createDraftTeam);
    return { valid: true };
  }

  setTeamConnection(teamId, connected) {
    const normalizedTeamId = parseInt(teamId, 10);
    const seed = this.teamSeeds.find((team) => team.id === normalizedTeamId);
    const team = this.teams.find((item) => item.id === normalizedTeamId);
    if (seed) seed.connected = Boolean(connected);
    if (team) team.connected = Boolean(connected);
  }

  reset() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.status = 'waiting';
    this.currentRoundIdx = 0;
    this.currentTeamTurnIdx = 0;
    this.picksInCurrentTurn = 0;
    this.turnPickTarget = 0;
    this.turnRoundPickOffset = 0;
    this.timeLeft = 30;
    this.pickedPlayerIds = new Set();
    this.pickedPlayerIdentities = new Map();
    this.history = [];
    this.teams = this.teamSeeds.map(createDraftTeam);
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

  getPhasePlayers(team, phase) {
    return phase === 'MAIN' ? team.startingXI : team.subs;
  }

  getPhaseTarget(phase) {
    return phase === 'MAIN' ? 11 : 12;
  }

  getPhaseGkCount(team, phase) {
    return phase === 'MAIN' ? team.mainGkCount : team.subGkCount;
  }

  getMissingPicks(team, phase) {
    return Math.max(0, this.getPhaseTarget(phase) - this.getPhasePlayers(team, phase).length);
  }

  isPhaseComplete(phase) {
    return this.teams.every((team) => (
      this.getMissingPicks(team, phase) === 0
      && this.getPhaseGkCount(team, phase) === 1
    ));
  }

  calculateTurnPickTarget(config = this.getCurrentConfig(), team = this.getCurrentTeam()) {
    if (!config || !team) return 0;
    const missing = this.getMissingPicks(team, config.phase);
    return config.isCompensate ? missing : Math.min(config.picksPerTurn, missing);
  }

  getPicksNeededForCurrentTurn() {
    return this.turnPickTarget || this.calculateTurnPickTarget();
  }

  prepareDraft(io) {
    if (this.status !== 'waiting') {
      return { valid: false, error: 'Draft đã rời Lobby hoặc đã bắt đầu.' };
    }
    this.status = 'ready';
    this.broadcastState(io);
    return { valid: true };
  }

  startDraft(io) {
    if (this.status !== 'ready') {
      return { valid: false, error: 'Draft chưa ở màn hình chờ xác nhận.' };
    }
    this.status = 'drafting';
    this.currentRoundIdx = 0;
    this.currentTeamTurnIdx = 0;
    this.picksInCurrentTurn = 0;
    this.turnPickTarget = 0;
    this.turnRoundPickOffset = 0;
    this.startTurnTimer(io);
    return { valid: true };
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
    const missing = this.getMissingPicks(currentTeam, config.phase);
    if (config.isCompensate && missing === 0) {
      this.nextTurn(io);
      return;
    }

    if (!isResume) {
      this.picksInCurrentTurn = 0;
      this.turnPickTarget = this.calculateTurnPickTarget(config, currentTeam);
      this.turnRoundPickOffset = (currentTeam.roundPicks?.[config.label] || []).filter(Boolean).length;
      this.timeLeft = config.isCompensate
        ? Math.max(30, this.turnPickTarget * 30)
        : config.timeLimit;
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

    if (!player || player.id === undefined || !String(player.name || '').trim()) {
      return { valid: false, error: 'Dữ liệu cầu thủ không hợp lệ!' };
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
    const phasePlayers = this.getPhasePlayers(currentTeam, config.phase);
    const phaseGkCount = this.getPhaseGkCount(currentTeam, config.phase);
    const phaseTarget = this.getPhaseTarget(config.phase);
    const slotsRemaining = phaseTarget - phasePlayers.length;

    if (config.phase === 'MAIN') {
      if (currentTeam.startingXI.length >= 11) {
        return { valid: false, error: 'Đội hình chính đã đủ 11 cầu thủ!' };
      }

      if (isGK && phaseGkCount >= 1) {
        return { valid: false, error: 'Đội hình chính chỉ được có đúng 1 Thủ môn (GK)!' };
      }

      const salaryToAdd = parseInt(player.salary, 10) || 0;
      const newSalary = currentTeam.totalSalaryMain + salaryToAdd;
      if (newSalary > 305) {
        return {
          valid: false,
          error: `Vượt quá giới hạn lương 305! (Hiện tại: ${currentTeam.totalSalaryMain} + ${salaryToAdd} = ${newSalary}/305)`
        };
      }

      if (slotsRemaining === 1 && phaseGkCount === 0 && !isGK) {
        return {
          valid: false,
          error: 'Lượt cuối đội hình chính bắt buộc phải chọn Thủ môn (GK)!'
        };
      }
    }

    if (config.phase === 'SUB') {
      if (currentTeam.subs.length >= 12) {
        return { valid: false, error: 'Danh sách dự bị đã đủ 12 cầu thủ!' };
      }

      if (isGK && phaseGkCount >= 1) {
        return { valid: false, error: 'Danh sách dự bị chỉ được có đúng 1 Thủ môn (GK)!' };
      }

      if (slotsRemaining === 1 && phaseGkCount === 0 && !isGK) {
        return {
          valid: false,
          error: 'Lượt cuối danh sách dự bị bắt buộc phải chọn Thủ môn (GK)!'
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

    if (isGK) {
      team.gkCount += 1;
      if (config.phase === 'MAIN') team.mainGkCount += 1;
      else team.subGkCount += 1;
    }

    const pickRecord = {
      ...player,
      roundLabel: config.label,
      roundNum: config.roundNum,
      subSlotIndex: this.turnRoundPickOffset + this.picksInCurrentTurn,
      pickedByTeamId: team.id,
      pickedByTeamName: team.name,
      phase: config.phase,
      timestamp: Date.now()
    };

    if (!team.roundPicks) {
      team.roundPicks = getInitialRoundPicks();
    }
    if (!team.roundPicks[config.label]) {
      team.roundPicks[config.label] = [];
    }

    // Place pick firmly in the current round's exact sub-slot!
    team.roundPicks[config.label][pickRecord.subSlotIndex] = pickRecord;

    if (config.phase === 'MAIN') {
      team.startingXI.push(pickRecord);
      team.totalSalaryMain += (parseInt(player.salary, 10) || 0);
    } else {
      team.subs.push(pickRecord);
    }

    this.history.push(pickRecord);

    io.to(this.roomId).emit('player_picked_event', {
      pick: pickRecord,
      team: { id: team.id, name: team.name, code: team.code }
    });

    this.picksInCurrentTurn += 1;
    const needed = this.turnPickTarget;

    if (this.picksInCurrentTurn >= needed) {
      this.nextTurn(io);
    } else {
      this.broadcastState(io);
    }

    return { valid: true, pick: pickRecord };
  }

  nextTurn(io) {
    if (this.status !== 'drafting') {
      return { valid: false, error: 'Chỉ có thể chuyển lượt khi Draft đang diễn ra.' };
    }
    this.picksInCurrentTurn = 0;
    this.turnPickTarget = 0;
    this.turnRoundPickOffset = 0;
    const config = this.getCurrentConfig();
    this.currentTeamTurnIdx += 1;

    if (this.currentTeamTurnIdx >= 4) {
      this.currentTeamTurnIdx = 0;
      if (!config?.isCompensate || this.isPhaseComplete(config.phase)) {
        this.currentRoundIdx += 1;
      }

      if (this.currentRoundIdx >= ROUNDS_CONFIG.length) {
        this.finishDraft(io);
        return { valid: true };
      }
    }

    this.startTurnTimer(io);
    return { valid: true };
  }

  finishDraft(io) {
    if (!this.isPhaseComplete('MAIN') || !this.isPhaseComplete('SUB')) {
      const targetRoundIndex = this.isPhaseComplete('MAIN')
        ? ROUNDS_CONFIG.findIndex((config) => config.phase === 'SUB' && config.isCompensate)
        : ROUNDS_CONFIG.findIndex((config) => config.phase === 'MAIN' && config.isCompensate);
      this.currentRoundIdx = targetRoundIndex;
      this.currentTeamTurnIdx = 0;
      this.startTurnTimer(io);
      return;
    }
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.status = 'completed';
    console.log('🎉 Phiên Draft đã hoàn tất!');
    this.broadcastState(io);
    io.to(this.roomId).emit('draft_completed', {
      message: 'Draft hoàn tất: cả 4 đội đã đủ 11 chính, 12 dự bị và đúng 1 GK ở mỗi nhóm.',
      teams: this.teams
    });
  }

  broadcastState(io) {
    io.to(this.roomId).emit('draft_state_update', this.getState());
  }

  getState() {
    const currentConfig = this.getCurrentConfig();
    const currentTeam = this.getCurrentTeam();
    const neededPicks = this.getPicksNeededForCurrentTurn();

    return {
      status: this.status,
      currentRound: currentConfig,
      currentTeam,
      currentRoundIdx: this.currentRoundIdx,
      currentTeamTurnIdx: this.currentTeamTurnIdx,
      picksInCurrentTurn: this.picksInCurrentTurn,
      neededPicks,
      turnPickTarget: this.turnPickTarget,
      turnRoundPickOffset: this.turnRoundPickOffset,
      timeLeft: this.timeLeft,
      phaseProgress: {
        MAIN: this.teams.map((team) => ({ teamId: team.id, count: team.startingXI.length, gkCount: team.mainGkCount })),
        SUB: this.teams.map((team) => ({ teamId: team.id, count: team.subs.length, gkCount: team.subGkCount }))
      },
      teams: this.teams,
      pickedIds: Array.from(this.pickedPlayerIds),
      pickedIdentities: Array.from(this.pickedPlayerIdentities.entries()),
      history: this.history
    };
  }
}

module.exports = {
  DraftRoom,
  ROUNDS_CONFIG,
  INITIAL_TEAMS,
  createEmptyTeam,
  normalizePlayerIdentity
};
