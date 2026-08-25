import React, { useState } from 'react';
import { useDraft } from '../context/DraftContext';
import { TeamLogo, FCLogo } from '../assets/teamLogos';
import EnhancementBadge from './EnhancementBadge';
import SquadBuilder from './SquadBuilder';
import { Play, RotateCcw, ArrowRight, Lock, Check } from 'lucide-react';

function getPosCategory(pos) {
  const p = String(pos || '').toUpperCase();
  if (['ST', 'CF', 'LW', 'RW'].includes(p)) return 'FW';
  if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(p)) return 'MF';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'DF';
  if (p === 'GK') return 'GK';
  return 'OTHER';
}

// Red Ban Overlay Icon (Exact match to Image 3)
function BanOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <svg className="w-14 h-14 md:w-16 md:h-16 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="42" stroke="#ef4444" strokeWidth="9" fill="rgba(239,68,68,0.2)"/>
        <line x1="20" y1="20" x2="80" y2="80" stroke="#ef4444" strokeWidth="9" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// Mini FIFA Card component (Matching Image 3)
function MiniCard({ player, isBanned, onClick, disabled, statusText }) {
  if (!player) {
    return (
      <div className="w-16 sm:w-20 md:w-22 h-24 sm:h-28 md:h-32 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex items-center justify-center text-[10px] text-slate-700">
        -
      </div>
    );
  }

  const posCat = getPosCategory(player.pos);
  const isGK = posCat === 'GK';

  return (
    <div
      onClick={onClick}
      className={`relative w-16 sm:w-20 md:w-22 h-24 sm:h-28 md:h-32 rounded-xl p-1.5 flex flex-col justify-between overflow-hidden select-none transition-all duration-200 ${
        isBanned
          ? 'ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-102 bg-gradient-to-b from-slate-800 to-slate-950'
          : disabled
          ? 'opacity-40 bg-slate-900/60 border border-slate-800 cursor-not-allowed'
          : 'bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] border border-slate-700 hover:border-neon-green hover:scale-105 cursor-pointer shadow-lg'
      }`}
    >
      {/* Red Ban Stamp */}
      {isBanned && <BanOverlay />}

      {/* Top section: OVR, POS, Season Crest */}
      <div className="relative z-10 flex justify-between items-start leading-none">
        <div>
          <div className="text-[11px] sm:text-xs font-black font-digital text-amber-300">
            {player.ovr}
          </div>
          <div className={`text-[9px] sm:text-[10px] font-black ${
            posCat === 'FW' ? 'text-red-400' :
            posCat === 'MF' ? 'text-emerald-400' :
            posCat === 'DF' ? 'text-blue-400' : 'text-amber-400'
          }`}>
            {player.pos}
          </div>
          {player.maxPlus && (
            <EnhancementBadge level={player.maxPlus} size="xs" className="mt-0.5" />
          )}
        </div>

        {player.seasonLogoUrl && (
          <img
            src={player.seasonLogoUrl}
            alt={player.seasonName || player.season}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain drop-shadow"
          />
        )}
      </div>

      {/* Center: Cutout Player Image */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-0.5">
        <img
          src={player.avatarUrl}
          alt={player.name}
          className="h-14 sm:h-16 md:h-18 object-contain drop-shadow-md"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* Bottom: Flag + Player Name */}
      <div className="relative z-10 bg-slate-950/90 rounded px-1 py-0.5 text-center border-t border-slate-800 truncate">
        <div className="text-[8px] sm:text-[9px] font-bold text-slate-200 truncate uppercase">
          {player.name}
        </div>
      </div>
    </div>
  );
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

  // Roster A and Roster B (up to 23 players each)
  const rosterA = currentTeamA ? [...(currentTeamA.startingXI || []), ...(currentTeamA.subs || [])] : [];
  const rosterB = currentTeamB ? [...(currentTeamB.startingXI || []), ...(currentTeamB.subs || [])] : [];

  // Group roster into 4 rows: FW, MF, DF, GK & Subs (matching Image 3)
  const groupRosterIntoRows = (roster) => {
    const fws = roster.filter(p => getPosCategory(p.pos) === 'FW');
    const mfs = roster.filter(p => getPosCategory(p.pos) === 'MF');
    const dfs = roster.filter(p => getPosCategory(p.pos) === 'DF');
    const gksAndOthers = roster.filter(p => getPosCategory(p.pos) === 'GK' || getPosCategory(p.pos) === 'OTHER');

    // Fill to 6 per row for clean grid
    const row1 = fws.slice(0, 6);
    const row2 = mfs.slice(0, 6);
    const row3 = dfs.slice(0, 6);
    const row4 = [...gksAndOthers, ...fws.slice(6), ...mfs.slice(6), ...dfs.slice(6)].slice(0, 6);

    return [row1, row2, row3, row4];
  };

  const rowsA = groupRosterIntoRows(rosterA);
  const rowsB = groupRosterIntoRows(rosterB);

  // Bans applied against Team A (picked by Team B) and against Team B (picked by Team A)
  const bansAgainstA = banState?.currentBans?.teamB || [];
  const bansAgainstB = banState?.currentBans?.teamA || [];

  const isTeamALocked = banState?.lockedStatus?.teamA;
  const isTeamBLocked = banState?.lockedStatus?.teamB;
  const isAllLocked = banState?.status === 'locked';

  const maxBanLimit = banState?.maxBanLimit || (seriesType === 'BO7' ? 3 : 2);

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

  // Check if a player in Team A is banned by Team B
  const isPlayerInABanned = (p) => bansAgainstA.some(b => b.id === p.id);
  // Check if a player in Team B is banned by Team A
  const isPlayerInBBanned = (p) => bansAgainstB.some(b => b.id === p.id);

  return (
    <div className="flex-1 flex flex-col bg-[#050811] text-white overflow-y-auto min-h-0 select-none">
      {/* 1. Top Header Banner (Exact match to Image 3) */}
      <div className="bg-[#070b14] border-b border-slate-800/90 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        {/* Left: FC Logo + Team A Badge Pill */}
        <div className="flex items-center gap-3">
          <FCLogo className="w-7 h-7 drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]" />

          {/* Team A Pill (White/Dark Container) */}
          <div className="flex items-center gap-2 bg-[#0c1424] border border-slate-700 px-3.5 py-1 rounded-full shadow-md">
            {currentTeamA && <TeamLogo code={currentTeamA.code} name={currentTeamA.name} color={currentTeamA.color} logoUrl={currentTeamA.logoUrl} className="w-5 h-5" />}
            <span className="text-xs font-black tracking-wider text-white uppercase">
              {currentTeamA?.name}
            </span>
          </div>
        </div>

        {/* Center: Digital Neon Timer 00:00 */}
        <div className="flex items-center gap-2">
          <div className="px-5 py-0.5 rounded-xl bg-black border border-neon-green text-neon-green font-digital text-2xl md:text-3xl font-black tracking-widest glow-neon-green shadow-[0_0_15px_rgba(0,255,102,0.5)]">
            00:00
          </div>
          <div className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500 text-red-400 font-black text-[10px]">
            {banState?.seriesType || seriesType} / GAME {banState?.currentGame || gameNum}
          </div>
        </div>

        {/* Right: Team B Badge Pill (Bright Neon Green Pill) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neon-green text-slate-950 border border-white px-4 py-1 rounded-full shadow-[0_0_15px_rgba(0,255,102,0.6)]">
            {currentTeamB && <TeamLogo code={currentTeamB.code} name={currentTeamB.name} color={currentTeamB.color} logoUrl={currentTeamB.logoUrl} className="w-5 h-5" />}
            <span className="text-xs font-black tracking-wider uppercase">
              {currentTeamB?.name}
            </span>
          </div>

          {/* Referee Control Trigger */}
          {isReferee && (
            <div className="flex items-center gap-1">
              {!isBanning ? (
                <form onSubmit={handleStartSetup} className="flex items-center gap-1">
                  <select
                    value={selectedTeamA}
                    onChange={(e) => setSelectedTeamA(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                  >
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select
                    value={selectedTeamB}
                    onChange={(e) => setSelectedTeamB(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                  >
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select
                    value={seriesType}
                    onChange={(e) => setSeriesType(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-amber-400"
                  >
                    <option value="BO3">BO3</option>
                    <option value="BO5">BO5</option>
                    <option value="BO7">BO7</option>
                  </select>
                  <button
                    type="submit"
                    className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-black"
                  >
                    START BAN
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1">
                  {isAllLocked && (
                    <button
                      onClick={nextGameBan}
                      disabled={!banState?.allLineupsLocked}
                      title={banState?.allLineupsLocked ? 'Chuyển sang game tiếp theo' : 'Chờ hai đội khóa đội hình'}
                      className={`px-2 py-1 rounded text-xs font-black flex items-center gap-1 ${
                        banState?.allLineupsLocked
                          ? 'bg-neon-green text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>NEXT GAME</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={resetBanPhase}
                    className="p-1 bg-rose-950 text-rose-300 rounded border border-rose-800"
                    title="Reset"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="border-b border-red-800 bg-red-950/90 px-4 py-2 text-center text-xs font-black text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Action Notification / Ban Control Pill */}
      {isBanning && !isAllLocked && (isMyTeamA || isMyTeamB) && (
        <div className="bg-[#0b1220] border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-300 font-bold flex items-center gap-2">
            <span>🚫 Đang chọn 5 cầu thủ cấm từ đối phương (FW $\le 2$, MF $\le 2$, DF $\le 2$, GK $= 0$):</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-neon-green font-black">
              Đã chọn: {isMyTeamA ? bansAgainstB.length : bansAgainstA.length}/5
            </span>
          </div>

          <div>
            {(isMyTeamA ? isTeamALocked : isTeamBLocked) ? (
              <span className="px-3 py-1 bg-emerald-950 text-neon-green rounded-full text-xs font-black flex items-center gap-1 border border-neon-green">
                <Check className="w-3.5 h-3.5" /> ĐÃ KHÓA CẤM
              </span>
            ) : (
              <button
                onClick={lockTeamBans}
                disabled={(isMyTeamA ? bansAgainstB.length : bansAgainstA.length) !== 5}
                className={`px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase transition flex items-center gap-1.5 ${
                  (isMyTeamA ? bansAgainstB.length : bansAgainstA.length) === 5
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>KHÓA 5 CẦU THỦ CẤM</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isAllLocked ? (
        <SquadBuilder />
      ) : (
      /* 2. Main 2 Squad Containers Layout (Exact Match to Image 3) */
      <div className="flex-1 p-3 md:p-6 flex flex-col lg:flex-row items-center justify-center gap-4 md:gap-8 min-h-0">
        {/* LEFT CONTAINER: Team A's 23 Squad Players */}
        <div className="relative bg-[#0b101c]/90 border border-slate-800/90 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col gap-2.5 max-w-2xl w-full">
          {/* Team A Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {currentTeamA && <TeamLogo code={currentTeamA.code} name={currentTeamA.name} color={currentTeamA.color} logoUrl={currentTeamA.logoUrl} className="w-6 h-6" />}
              <span className="text-sm font-black text-white tracking-wider uppercase">
                {currentTeamA?.name}
              </span>
            </div>
            <span className="text-xs font-black text-red-400">
              BỊ CẤM: {bansAgainstA.length}/5
            </span>
          </div>

          {/* 4 Rows Grid for Team A */}
          <div className="flex flex-col gap-2">
            {rowsA.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {row.map((player) => {
                  const isBanned = isPlayerInABanned(player);
                  const isGK = getPosCategory(player.pos) === 'GK';
                  const isPrev = isPrevBanned(player.id);
                  const isMaxed = getBanCount(player.id) >= maxBanLimit;

                  // Team B captain can click on Team A's players to ban
                  const canClick = isMyTeamB && !isTeamBLocked && isBanning;

                  return (
                    <MiniCard
                      key={player.id}
                      player={player}
                      isBanned={isBanned}
                      disabled={isGK || isPrev || isMaxed || !canClick}
                      onClick={() => canClick && toggleBanPlayer(player)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER DIVIDER: FVPL Logo & Directional Arrows (Exact match to Image 3) */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-6 shrink-0">
          {/* FVPL / FC Online Watermark Logo */}
          <div className="flex flex-col items-center opacity-80">
            <div className="text-[10px] font-black tracking-widest text-slate-400">EA SPORTS</div>
            <div className="text-base font-black text-white tracking-tighter">FC ONLINE</div>
            <div className="text-[9px] font-bold text-neon-green tracking-widest uppercase">VIETNAM PRO LEAGUE</div>
          </div>

          {/* Directional Center Arrows ◀ ▶ */}
          <div className="flex items-center gap-1 text-slate-600">
            <div className="w-0 h-0 border-y-[10px] border-y-transparent border-r-[14px] border-r-slate-600" />
            <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[14px] border-l-slate-600" />
          </div>
        </div>

        {/* RIGHT CONTAINER: Team B's 23 Squad Players */}
        <div className="relative bg-[#0b101c]/90 border border-slate-800/90 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col gap-2.5 max-w-2xl w-full">
          {/* Team B Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {currentTeamB && <TeamLogo code={currentTeamB.code} name={currentTeamB.name} color={currentTeamB.color} logoUrl={currentTeamB.logoUrl} className="w-6 h-6" />}
              <span className="text-sm font-black text-white tracking-wider uppercase">
                {currentTeamB?.name}
              </span>
            </div>
            <span className="text-xs font-black text-red-400">
              BỊ CẤM: {bansAgainstB.length}/5
            </span>
          </div>

          {/* 4 Rows Grid for Team B */}
          <div className="flex flex-col gap-2">
            {rowsB.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {row.map((player) => {
                  const isBanned = isPlayerInBBanned(player);
                  const isGK = getPosCategory(player.pos) === 'GK';
                  const isPrev = isPrevBanned(player.id);
                  const isMaxed = getBanCount(player.id) >= maxBanLimit;

                  // Team A captain can click on Team B's players to ban
                  const canClick = isMyTeamA && !isTeamALocked && isBanning;

                  return (
                    <MiniCard
                      key={player.id}
                      player={player}
                      isBanned={isBanned}
                      disabled={isGK || isPrev || isMaxed || !canClick}
                      onClick={() => canClick && toggleBanPlayer(player)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
