import React, { useState } from 'react';
import { useDraft } from '../context/DraftContext';
import { TeamLogos } from '../assets/teamLogos';
import { ShieldAlert, CheckCircle2, AlertTriangle, Lock, Play, RotateCcw, ArrowRight, Ban, Check } from 'lucide-react';

function getPosCategory(pos) {
  const p = String(pos || '').toUpperCase();
  if (['ST', 'CF', 'LW', 'RW'].includes(p)) return 'FW';
  if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(p)) return 'MF';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'DF';
  if (p === 'GK') return 'GK';
  return 'OTHER';
}

export default function MatchBanView() {
  const {
    draftState,
    banState,
    currentUser,
    setupBanPhase,
    toggleBanPlayer,
    lockTeamBans,
    nextGameBan,
    resetBanPhase,
    errorMsg,
    successMsg
  } = useDraft();

  const teams = draftState?.teams || [];
  const isReferee = currentUser.role === 'referee';

  // Setup form states (for Referee)
  const [selectedTeamA, setSelectedTeamA] = useState(1);
  const [selectedTeamB, setSelectedTeamB] = useState(2);
  const [seriesType, setSeriesType] = useState('BO5');
  const [gameNum, setGameNum] = useState(1);

  const currentTeamA = teams.find(t => t.id === (banState?.teamAId || 1)) || teams[0];
  const currentTeamB = teams.find(t => t.id === (banState?.teamBId || 2)) || teams[1];

  const isBanning = banState?.status === 'banning' || banState?.status === 'locked';
  const isMyTeamA = currentUser.teamId === currentTeamA?.id;
  const isMyTeamB = currentUser.teamId === currentTeamB?.id;

  // The roster to ban from: Team A bans from Team B's roster, Team B bans from Team A's roster
  const targetTeam = isMyTeamA ? currentTeamB : isMyTeamB ? currentTeamA : currentTeamB;
  const targetRoster = targetTeam ? [...(targetTeam.startingXI || []), ...(targetTeam.subs || [])] : [];

  // My current selected bans
  const mySelectedBans = isMyTeamA
    ? banState?.currentBans?.teamA || []
    : isMyTeamB
    ? banState?.currentBans?.teamB || []
    : [];

  const isMyTeamLocked = isMyTeamA ? banState?.lockedStatus?.teamA : isMyTeamB ? banState?.lockedStatus?.teamB : false;
  const isAllLocked = banState?.status === 'locked';

  // Counters
  const fwCount = mySelectedBans.filter(p => getPosCategory(p.pos) === 'FW').length;
  const mfCount = mySelectedBans.filter(p => getPosCategory(p.pos) === 'MF').length;
  const dfCount = mySelectedBans.filter(p => getPosCategory(p.pos) === 'DF').length;

  const maxBanLimit = banState?.maxBanLimit || (seriesType === 'BO7' ? 3 : 2);

  // Check ban counts in series
  const getBanCount = (playerId) => {
    if (!banState?.gameHistory) return 0;
    let count = 0;
    for (const g in banState.gameHistory) {
      const h = banState.gameHistory[g];
      if (h.teamABans?.some(p => p.id === playerId)) count++;
      if (h.teamBBans?.some(p => p.id === playerId)) count++;
    }
    return count;
  };

  // Check previous game ban
  const isPrevBanned = (playerId) => {
    if (!banState?.currentGame || banState.currentGame <= 1) return false;
    const prev = banState.gameHistory?.[banState.currentGame - 1];
    if (!prev) return false;
    return (
      prev.teamABans?.some(p => p.id === playerId) ||
      prev.teamBBans?.some(p => p.id === playerId)
    );
  };

  const handleStartSetup = (e) => {
    e.preventDefault();
    if (selectedTeamA === selectedTeamB) {
      alert('Vui lòng chọn 2 đội khác nhau!');
      return;
    }
    setupBanPhase({
      teamAId: selectedTeamA,
      teamBId: selectedTeamB,
      seriesType,
      gameNumber: gameNum
    });
  };

  const TeamALogo = currentTeamA ? (TeamLogos[currentTeamA.code] || TeamLogos.AMT) : null;
  const TeamBLogo = currentTeamB ? (TeamLogos[currentTeamB.code] || TeamLogos.NK) : null;

  return (
    <div className="flex-1 flex flex-col gap-4 p-3 md:p-5 bg-[#060a12] text-white overflow-y-auto min-h-0">
      {/* 1. Header Match Banner & Referee Setup */}
      <div className="bg-[#0a101d] border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Match vs Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1 shadow">
              {TeamALogo && <TeamALogo className="w-8 h-8" />}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase">ĐỘI A (HOME)</div>
              <div className="text-sm font-black text-white">{currentTeamA?.name}</div>
            </div>
          </div>

          <div className="flex flex-col items-center px-3">
            <div className="px-2.5 py-0.5 rounded-full bg-red-950 border border-red-500 text-red-400 font-black text-[11px] tracking-wider">
              {banState?.seriesType || seriesType} / GAME {banState?.currentGame || gameNum}
            </div>
            <span className="text-xs font-black text-slate-500 mt-0.5">VS</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1 shadow">
              {TeamBLogo && <TeamBLogo className="w-8 h-8" />}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase">ĐỘI B (AWAY)</div>
              <div className="text-sm font-black text-white">{currentTeamB?.name}</div>
            </div>
          </div>
        </div>

        {/* Referee Controls / Match Setup Box */}
        {isReferee && (
          <div className="flex flex-wrap items-center gap-2 bg-[#101828] p-2 rounded-xl border border-slate-800">
            {!isBanning ? (
              <form onSubmit={handleStartSetup} className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={selectedTeamA}
                  onChange={(e) => setSelectedTeamA(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>Đội A: {t.name}</option>
                  ))}
                </select>

                <select
                  value={selectedTeamB}
                  onChange={(e) => setSelectedTeamB(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>Đội B: {t.name}</option>
                  ))}
                </select>

                <select
                  value={seriesType}
                  onChange={(e) => setSeriesType(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-400 font-black"
                >
                  <option value="BO3">BO3 (Tối đa 2 lần)</option>
                  <option value="BO5">BO5 (Tối đa 2 lần)</option>
                  <option value="BO7">BO7 (Tối đa 3 lần)</option>
                </select>

                <button
                  type="submit"
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-black tracking-wider transition shadow flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> BẮT ĐẦU CẤM
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-bold px-2 py-1 bg-amber-950/60 rounded-lg border border-amber-500">
                  {isAllLocked ? '✅ ĐÃ KHÓA BAN CẢ 2 ĐỘI' : '⏳ ĐANG TRONG GIAI ĐOẠN CẤM...'}
                </span>

                {isAllLocked && (
                  <button
                    onClick={nextGameBan}
                    className="px-3 py-1 bg-neon-green hover:bg-emerald-400 text-slate-950 rounded-lg font-black text-xs transition shadow flex items-center gap-1"
                  >
                    <span>VÁN TIẾP THEO (GAME {banState.currentGame + 1})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={resetBanPhase}
                  className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800 transition"
                  title="Đặt lại phiên cấm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-950/90 border border-red-500 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce shadow-lg">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Main Content Area */}
      {!isBanning ? (
        <div className="bg-[#0a101d] border border-slate-800 rounded-2xl p-12 text-center shadow-2xl flex flex-col items-center justify-center gap-3">
          <Ban className="w-16 h-16 text-red-500/80 animate-pulse" />
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            GIAI ĐOẠN CẤM CẦU THỦ (MATCH BAN PHASE)
          </h3>
          <p className="text-xs text-slate-400 max-w-md">
            Trước mỗi trận đấu đơn, mỗi đội được quyền cấm 5 cầu thủ của đối phương (tối đa 2 cầu thủ cho mỗi vị trí FW, MF, DF; không được cấm GK).
          </p>
          {isReferee ? (
            <div className="text-xs font-bold text-neon-green mt-2">
              👉 Trọng tài vui lòng chọn 2 đội thi đấu ở thanh công cụ phía trên và bấm <strong>"BẮT ĐẦU CẤM"</strong>.
            </div>
          ) : (
            <div className="text-xs font-bold text-amber-400 mt-2">
              ⏳ Vui lòng chờ Trọng tài thiết lập cặp đấu và bắt đầu phiên cấm.
            </div>
          )}
        </div>
      ) : isAllLocked || currentUser.role === 'spectator' || (currentUser.role === 'referee' && isAllLocked) ? (
        /* 2A. Locked Ban Results Display (Stream / Broadcast View) */
        <div className="space-y-4">
          <div className="bg-[#0a101d] border border-red-500/60 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  KẾT QUẢ CẤM CẦU THỦ - GAME {banState?.currentGame} ({banState?.seriesType})
                </h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-950 text-red-300 font-black text-xs border border-red-800 animate-pulse">
                🚫 ĐÃ KHÓA CẤM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A Bans against Team B */}
              <div className="space-y-3 bg-[#0d1422] p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    {TeamALogo && <TeamALogo className="w-4 h-4" />}
                    <span>{currentTeamA?.name}</span> đã cấm từ <strong>{currentTeamB?.name}</strong>:
                  </span>
                  <span className="text-xs font-bold text-red-400">5 Cầu thủ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(banState?.currentBans?.teamA || []).map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-red-950/40 border border-red-600/80 flex items-center justify-between shadow-sm relative overflow-hidden"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs font-black text-red-400">{p.pos}</span>
                        {p.crestUrl && <img src={p.crestUrl} alt="crest" className="w-4 h-4 object-contain" />}
                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-red-300 px-1.5 py-0.5 rounded bg-red-900/80 border border-red-700">
                        BANNED
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B Bans against Team A */}
              <div className="space-y-3 bg-[#0d1422] p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    {TeamBLogo && <TeamBLogo className="w-4 h-4" />}
                    <span>{currentTeamB?.name}</span> đã cấm từ <strong>{currentTeamA?.name}</strong>:
                  </span>
                  <span className="text-xs font-bold text-red-400">5 Cầu thủ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(banState?.currentBans?.teamB || []).map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-red-950/40 border border-red-600/80 flex items-center justify-between shadow-sm relative overflow-hidden"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs font-black text-red-400">{p.pos}</span>
                        {p.crestUrl && <img src={p.crestUrl} alt="crest" className="w-4 h-4 object-contain" />}
                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-red-300 px-1.5 py-0.5 rounded bg-red-900/80 border border-red-700">
                        BANNED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2B. Interactive Ban Picker for Captains */
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Top Counters & Rules Bar */}
          <div className="bg-[#0a101d] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black uppercase text-white flex items-center gap-2">
                <span>🎯 BẠN ĐANG CẤM CẦU THỦ CỦA:</span>
                <strong className="text-neon-cyan">{targetTeam?.name}</strong>
              </div>
              <div className="text-[11px] text-slate-400">
                Quy tắc: Tối đa <strong>2 FW</strong>, <strong>2 MF</strong>, <strong>2 DF</strong> (Tổng 5 cầu thủ), <strong>Không được cấm GK</strong>.
              </div>
            </div>

            {/* Position Counters */}
            <div className="flex items-center gap-2 text-xs font-black">
              <div className={`px-3 py-1.5 rounded-xl border ${fwCount === 2 ? 'border-amber-500 bg-amber-950/60 text-amber-300' : 'border-slate-800 bg-[#101828] text-red-400'}`}>
                TIỀN ĐẠO (FW): {fwCount}/2
              </div>
              <div className={`px-3 py-1.5 rounded-xl border ${mfCount === 2 ? 'border-amber-500 bg-amber-950/60 text-amber-300' : 'border-slate-800 bg-[#101828] text-emerald-400'}`}>
                TIỀN VỆ (MF): {mfCount}/2
              </div>
              <div className={`px-3 py-1.5 rounded-xl border ${dfCount === 2 ? 'border-amber-500 bg-amber-950/60 text-amber-300' : 'border-slate-800 bg-[#101828] text-blue-400'}`}>
                HẬU VỆ (DF): {dfCount}/2
              </div>
              <div className={`px-3 py-1.5 rounded-xl border ${mySelectedBans.length === 5 ? 'border-neon-green bg-emerald-950/80 text-neon-green glow-neon-green' : 'border-slate-700 bg-slate-900 text-white'}`}>
                TỔNG: {mySelectedBans.length}/5
              </div>
            </div>

            {/* Lock Button */}
            <div>
              {isMyTeamLocked ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-950 border border-neon-green text-neon-green font-black text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>ĐÃ KHÓA DANH SÁCH CẤM</span>
                </div>
              ) : (
                <button
                  onClick={lockTeamBans}
                  disabled={mySelectedBans.length !== 5}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 ${
                    mySelectedBans.length === 5
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950 animate-pulse active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>KHÓA 5 CẦU THỦ CẤM</span>
                </button>
              )}
            </div>
          </div>

          {/* Player Cards Grid to select bans */}
          <div className="bg-[#0a101d] border border-slate-800 rounded-2xl p-4 shadow-2xl flex-1 overflow-y-auto">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
              DANH SÁCH 23 CẦU THỦ CỦA {targetTeam?.name} ({targetRoster.length} CẦU THỦ)
            </div>

            {targetRoster.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 italic">
                Đội này chưa có cầu thủ nào được pick trong phiên Draft!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {targetRoster.map((p) => {
                  const posCat = getPosCategory(p.pos);
                  const isGK = posCat === 'GK';
                  const isSelected = mySelectedBans.some(b => b.id === p.id);
                  const banCount = getBanCount(p.id);
                  const isMaxed = banCount >= maxBanLimit;
                  const isPrev = isPrevBanned(p.id);

                  const isDisabled = isGK || isMaxed || isPrev || isMyTeamLocked;

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isDisabled && toggleBanPlayer(p)}
                      className={`relative p-3 rounded-xl border transition duration-200 flex flex-col justify-between select-none ${
                        isSelected
                          ? 'border-red-500 bg-red-950/60 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-102'
                          : isDisabled
                          ? 'opacity-40 bg-[#080d17] border-slate-800/80 cursor-not-allowed'
                          : 'bg-[#0e1626] border-slate-800 hover:border-slate-600 cursor-pointer'
                      }`}
                    >
                      {/* Top Row: Pos, Crest & Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-xs px-1.5 py-0.5 rounded ${
                            posCat === 'FW' ? 'bg-red-950 text-red-400 border border-red-800' :
                            posCat === 'MF' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            posCat === 'DF' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                            'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {p.pos}
                          </span>
                          {p.crestUrl && (
                            <img src={p.crestUrl} alt="crest" className="w-4 h-4 object-contain" />
                          )}
                        </div>

                        <span className="text-xs font-digital font-bold text-amber-400">
                          {p.ovr}
                        </span>
                      </div>

                      {/* Middle: Player Avatar & Name */}
                      <div className="flex items-center gap-2.5 my-1">
                        {p.avatarUrl && (
                          <img
                            src={p.avatarUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-full object-cover bg-slate-900 border border-slate-700 shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate" title={p.name}>
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            Mùa: {p.seasonName} | Lương: {p.salary}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Status / Rule Warnings */}
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        {isGK ? (
                          <span className="text-amber-400 font-bold">🚫 KHÔNG ĐƯỢC CẤM GK</span>
                        ) : isPrev ? (
                          <span className="text-red-400 font-black">⚠️ CẤM LIÊN TIẾP (KHÓA)</span>
                        ) : isMaxed ? (
                          <span className="text-slate-400 font-black">ĐẠT GIỚI HẠN ({banCount}/{maxBanLimit})</span>
                        ) : isSelected ? (
                          <span className="text-red-400 font-black flex items-center gap-1">
                            <Ban className="w-3 h-3" /> ĐÃ CHỌN CẤM
                          </span>
                        ) : (
                          <span className="text-slate-500">Đã cấm trong series: {banCount}/{maxBanLimit}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Series Ban History */}
      {banState?.gameHistory && Object.keys(banState.gameHistory).length > 0 && (
        <div className="bg-[#0a101d] border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
            LỊCH SỬ CẤM TRONG LOẠT TRẬN {banState?.seriesType}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.values(banState.gameHistory).map((gh) => (
              <div key={gh.game} className="bg-[#0e1626] p-3 rounded-xl border border-slate-800 text-xs space-y-1 min-w-[220px]">
                <div className="font-black text-amber-400">GAME {gh.game}</div>
                <div className="text-[11px] text-slate-300 truncate">
                  Đội A cấm: {gh.teamABans.map(p => p.name).join(', ')}
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  Đội B cấm: {gh.teamBBans.map(p => p.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
