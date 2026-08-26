import React from 'react';
import { useDraft } from '../context/DraftContext';
import { TeamLogo } from '../assets/teamLogos';

const POS_COLORS = {
  ST: 'border-l-4 border-l-[#ef4444] text-[#f87171]',
  CF: 'border-l-4 border-l-[#ef4444] text-[#f87171]',
  LW: 'border-l-4 border-l-[#ef4444] text-[#f87171]',
  RW: 'border-l-4 border-l-[#ef4444] text-[#f87171]',
  CAM: 'border-l-4 border-l-[#10b981] text-[#34d399]',
  CM: 'border-l-4 border-l-[#10b981] text-[#34d399]',
  CDM: 'border-l-4 border-l-[#10b981] text-[#34d399]',
  LM: 'border-l-4 border-l-[#10b981] text-[#34d399]',
  RM: 'border-l-4 border-l-[#10b981] text-[#34d399]',
  CB: 'border-l-4 border-l-[#3b82f6] text-[#60a5fa]',
  LB: 'border-l-4 border-l-[#3b82f6] text-[#60a5fa]',
  RB: 'border-l-4 border-l-[#3b82f6] text-[#60a5fa]',
  LWB: 'border-l-4 border-l-[#3b82f6] text-[#60a5fa]',
  RWB: 'border-l-4 border-l-[#3b82f6] text-[#60a5fa]',
  GK: 'border-l-4 border-l-[#f59e0b] text-[#fbbf24]'
};

const MAIN_ROUND_SLOTS = [
  { label: '1R', count: 1 },
  { label: '2R', count: 1 },
  { label: '3R', count: 1 },
  { label: '4R', count: 2 },
  { label: '5R', count: 2 },
  { label: '6R', count: 2 },
  { label: '7R', count: 2 },
  { label: '8R', count: 3, isCompensate: true }
];

const SUB_ROUND_SLOTS = [
  { label: '-1R', count: 2 },
  { label: '-2R', count: 2 },
  { label: '-3R', count: 3 },
  { label: '-4R', count: 2 },
  { label: '-5R', count: 3 },
  { label: '-6R', count: 1, isCompensate: true }
];

export default function BroadcastBoard() {
  const { draftState } = useDraft();

  const teams = draftState?.teams || [];
  const currentTeam = draftState?.currentTeam;
  const currentRound = draftState?.currentRound;
  const picksInCurrentTurn = draftState?.picksInCurrentTurn || 0;
  const turnRoundPickOffset = draftState?.turnRoundPickOffset || 0;

  const getRoundSlotCount = (slotInfo) => {
    if (!slotInfo.isCompensate) return slotInfo.count;
    const existingCount = Math.max(0, ...teams.map(team => team.roundPicks?.[slotInfo.label]?.length || 0));
    const activeTarget = currentRound?.label === slotInfo.label
      ? turnRoundPickOffset + (draftState?.neededPicks || 0)
      : 0;
    return Math.max(slotInfo.count, existingCount, activeTarget);
  };

  // Render player sub-slot
  const renderPlayerSlot = (player, isActiveSlot, heightClass = 'h-9') => {
    if (player) {
      const isCompact = heightClass === 'h-8';
      const feet = String(player.weakFoot || '0-0').split('-');
      return (
        <div
          className={`${heightClass} grid grid-cols-[2.25rem_2rem_minmax(0,1fr)_2.5rem] 2xl:grid-cols-[2.25rem_2rem_minmax(0,1fr)_1.5rem_2.25rem_1.75rem_2.5rem] items-center gap-1 overflow-hidden px-2 rounded-lg border bg-[#0d1422] border-slate-800/90 ${
            POS_COLORS[player.pos] || 'border-l-4 border-l-slate-500 text-slate-300'
          } shadow-sm transition`}
        >
          <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} block w-9 font-black font-digital tracking-wide`}>
            {player.pos}
          </span>

          <span className="flex h-full w-8 shrink-0 items-end justify-center overflow-hidden">
            <img
              src={player.avatarUrl}
              alt=""
              className={`${isCompact ? 'h-7' : 'h-8'} max-w-8 object-contain object-bottom drop-shadow`}
              onError={(event) => { event.currentTarget.style.display = 'none'; }}
            />
          </span>

          <span className="flex min-w-0 items-center gap-1">
            <span
              className={`${isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} flex shrink-0 items-center justify-center`}
              title={player.seasonName || player.season}
            >
              {player.seasonLogoUrl && (
                <img
                  src={player.seasonLogoUrl}
                  alt={player.seasonName || player.season}
                  className="max-h-full max-w-full object-contain"
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
              )}
            </span>
            <span
              className={`${isCompact ? 'text-[10px]' : 'text-xs'} min-w-0 flex-1 truncate font-black text-slate-100`}
              title={player.name}
            >
              {player.name}
            </span>
            <span className={`${isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} flex shrink-0 items-center justify-center`}>
              {player.traitIconUrl && (
                <img
                  src={player.traitIconUrl}
                  alt={player.trait || ''}
                  title={player.trait}
                  className="max-h-full max-w-full object-contain drop-shadow"
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
              )}
            </span>
          </span>

          <span className="hidden h-5 w-6 items-center justify-center 2xl:flex">
            {player.clubCrestUrl && (
              <img
                src={player.clubCrestUrl}
                alt={player.clubName || ''}
                title={player.clubName}
                className="max-h-5 max-w-5 object-contain"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />
            )}
          </span>

          <span className="hidden h-5 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-[8px] font-black 2xl:flex">
            {feet.slice(0, 2).map((value, index) => {
              const isPreferred = (index === 0 && player.preferredFoot === 'left')
                || (index === 1 && player.preferredFoot === 'right');
              return (
                <span
                  key={`${player.id}-foot-${index}`}
                  className={`grid h-full flex-1 place-items-center ${isPreferred ? 'bg-lime-500 text-slate-950' : 'text-slate-200'}`}
                >
                  {value}
                </span>
              );
            })}
          </span>

          <span className="hidden h-6 w-7 place-items-center rounded-full border-2 border-slate-600 bg-slate-900 text-[9px] font-black text-slate-100 2xl:grid" title="FP">
            {player.salary}
          </span>

          <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} w-10 justify-self-end text-right font-digital font-bold tabular-nums text-amber-400 opacity-90`}>
            {player.ovr}
          </span>
        </div>
      );
    }

    if (isActiveSlot) {
      return (
        <div
          className={`${heightClass} px-2.5 rounded-lg flex items-center justify-center border bg-neon-green text-slate-950 font-black text-xs tracking-wider shadow-[0_0_18px_rgba(0,255,102,0.8)] animate-pulse`}
        >
          ĐANG CHỌN...
        </div>
      );
    }

    return (
      <div
        className={`${heightClass} px-2.5 rounded-lg flex items-center justify-center border bg-[#070c16]/60 border-slate-800/40 text-slate-700 text-[10px] font-mono`}
      >
        -
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-3 md:p-5 bg-[#060a12] text-white overflow-y-auto">
      {/* Left: 4 Columns Draft Board */}
      <div className="flex-1 flex flex-col bg-[#0a101d] border border-slate-800/90 rounded-2xl p-4 shadow-2xl overflow-x-auto">
        {/* Header Row: 4 Team Badges with Neon Green Border & Circles */}
        <div className="grid grid-cols-[50px_repeat(4,1fr)] gap-2 pb-3 border-b border-slate-800 items-center min-w-[700px]">
          <div className="text-center font-bold text-slate-500 text-xs">ROUND</div>

          {teams.map((t, idx) => {
            const isTurn = currentTeam && currentTeam.id === t.id && draftState?.status === 'drafting';

            return (
              <div
                key={t.id}
                className={`relative flex items-center justify-between p-2.5 rounded-xl border transition duration-300 ${
                  isTurn
                    ? 'border-neon-green bg-emerald-950/50 glow-neon-green shadow-[0_0_15px_rgba(0,255,102,0.4)]'
                    : 'border-neon-green/60 bg-[#0f1728]'
                }`}
              >
                {/* Number, optically balanced logo and team code */}
                <div className="flex min-w-0 items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full border border-neon-green flex items-center justify-center text-[11px] font-black text-neon-green">
                    {idx + 1}
                  </div>
                  <TeamLogo code={t.code} name={t.name} color={t.color} logoUrl={t.logoUrl} className="w-9 h-7" />
                  <div className="min-w-0">
                    <div className="text-sm font-black tracking-wider text-white">{t.code}</div>
                    <div className="max-w-24 truncate text-[9px] font-bold text-neon-cyan" title={t.captainName}>
                      {t.captainName || 'Chưa có người chơi'}
                    </div>
                  </div>
                  <span
                    title={t.connected ? 'Đang online' : 'Mất kết nối'}
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.connected ? 'bg-neon-green' : 'bg-red-500'}`}
                  />
                </div>

                {/* Salary Badge X/305 */}
                <div
                  className={`px-2 py-0.5 rounded-full text-xs font-black tracking-tight border ${
                    t.totalSalaryMain > 305
                      ? 'border-red-500 bg-red-950 text-red-400'
                      : 'border-neon-green bg-emerald-950/80 text-neon-green'
                  }`}
                >
                  {t.totalSalaryMain}/305
                </div>
              </div>
            );
          })}
        </div>

        {/* Rows: 1R to 8R (Main Squad) & -1R to -5R (Subs) */}
        <div className="flex-1 flex flex-col divide-y divide-slate-800/60 pt-2 min-w-[700px]">
          {/* Main Squad Rows */}
          {MAIN_ROUND_SLOTS.map((slotInfo) => {
            const isCurrentRow = currentRound?.label === slotInfo.label;
            const slotCount = getRoundSlotCount(slotInfo);

            return (
              <div
                key={slotInfo.label}
                className={`grid grid-cols-[50px_repeat(4,1fr)] gap-2 py-2 items-center transition ${
                  isCurrentRow && draftState?.status === 'drafting'
                    ? 'bg-emerald-950/20'
                    : ''
                }`}
              >
                {/* Round Label on left */}
                <div
                  className={`text-center font-digital font-bold text-xs flex flex-col items-center justify-center ${
                    isCurrentRow && draftState?.status === 'drafting'
                      ? 'text-neon-green scale-110 font-black'
                      : 'text-slate-400'
                  }`}
                >
                  <span>{slotInfo.label}</span>
                  {slotCount > 1 && (
                    <span className="text-[9px] font-normal text-slate-500">
                      ({slotCount}p)
                    </span>
                  )}
                </div>

                {/* 4 Team Cells with multi-slot stacking: Read strictly from roundPicks */}
                {teams.map((t) => {
                  const isTeamActive = currentTeam && currentTeam.id === t.id && isCurrentRow && draftState?.status === 'drafting';

                  return (
                    <div key={t.id} className="flex flex-col gap-1.5">
                      {Array.from({ length: slotCount }).map((_, subIdx) => {
                        const player = t.roundPicks?.[slotInfo.label]?.[subIdx] || null;
                        const isActiveSlot = isTeamActive && !player && subIdx === turnRoundPickOffset + picksInCurrentTurn;

                        return (
                          <React.Fragment key={subIdx}>
                            {renderPlayerSlot(player, isActiveSlot, 'h-9')}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Separator between Main and Subs */}
          <div className="py-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-[#0d1524] border-y border-slate-800">
            DỰ BỊ (SUBSTITUTES - TỐI ĐA 23 CẦU THỦ)
          </div>

          {/* Sub Squad Rows (-1R to -5R): Read strictly from roundPicks */}
          {SUB_ROUND_SLOTS.map((slotInfo) => {
            const isCurrentSubRow = currentRound?.label === slotInfo.label;
            const slotCount = getRoundSlotCount(slotInfo);

            return (
              <div
                key={slotInfo.label}
                className={`grid grid-cols-[50px_repeat(4,1fr)] gap-2 py-2 items-center transition ${
                  isCurrentSubRow && draftState?.status === 'drafting'
                    ? 'bg-cyan-950/20'
                    : ''
                }`}
              >
                {/* Sub Round Label */}
                <div
                  className={`text-center font-digital font-bold text-xs flex flex-col items-center justify-center ${
                    isCurrentSubRow && draftState?.status === 'drafting'
                      ? 'text-neon-cyan scale-110 font-black'
                      : 'text-slate-400'
                  }`}
                >
                  <span>{slotInfo.label}</span>
                  <span className="text-[9px] font-normal text-slate-500">
                    ({slotCount}p)
                  </span>
                </div>

                {/* 4 Team Cells for Sub Rounds: Read strictly from roundPicks */}
                {teams.map((t) => {
                  const isTeamActive = currentTeam && currentTeam.id === t.id && isCurrentSubRow && draftState?.status === 'drafting';

                  return (
                    <div key={t.id} className="flex flex-col gap-1.5">
                      {Array.from({ length: slotCount }).map((_, subIdx) => {
                        const subPlayer = t.roundPicks?.[slotInfo.label]?.[subIdx] || null;
                        const isActiveSlot = isTeamActive && !subPlayer && subIdx === turnRoundPickOffset + picksInCurrentTurn;

                        return (
                          <React.Fragment key={subIdx}>
                            {renderPlayerSlot(subPlayer, isActiveSlot, 'h-8')}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar: 4 Team Cards (With Yellow Banners) */}
      <div className="w-full lg:w-72 flex flex-col gap-3">
        {teams.map((t) => {
          const isTurn = currentTeam && currentTeam.id === t.id && draftState?.status === 'drafting';
          const totalPlayers = t.startingXI.length + t.subs.length;

          return (
            <div
              key={t.id}
              className={`relative bg-[#0c1424] border rounded-2xl overflow-hidden flex flex-col transition duration-300 shadow-2xl ${
                isTurn
                  ? 'border-neon-green glow-neon-green shadow-emerald-950 scale-102'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div
                className={`h-1 w-full ${
                  isTurn
                    ? 'bg-neon-green'
                    : 'bg-gradient-to-r from-rose-600 via-red-500 to-orange-400'
                }`}
              />

              {/* Upper Card: Logo & Stats */}
              <div className="p-3.5 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <TeamLogo code={t.code} name={t.name} color={t.color} logoUrl={t.logoUrl} className="w-14 h-14 rounded-xl" />
                    <div className="min-w-0">
                      <div className="text-base font-black text-white tracking-wider">
                        {t.code}
                      </div>
                      <div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400" title={t.name}>
                        {t.name}
                      </div>
                      <div className="truncate text-[11px] font-bold text-neon-cyan" title={t.captainName}>
                        👤 {t.captainName || 'Chưa có người chơi'}
                      </div>
                    </div>
                  </div>

                  {!t.connected ? (
                    <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-400 border border-red-900 text-[9px] font-black">
                      OFFLINE
                    </span>
                  ) : isTurn ? (
                    <span className="px-2.5 py-1 rounded-full bg-neon-green text-slate-950 text-[10px] font-black animate-pulse shadow">
                      ĐANG PICK
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">
                      CHỜ
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      t.totalSalaryMain > 305 ? 'bg-red-500' : 'bg-gradient-to-r from-teal-500 to-neon-green'
                    }`}
                    style={{ width: `${Math.min(100, (t.totalSalaryMain / 305) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-300">
                  <span>Cầu thủ: <strong className="text-white font-bold">{totalPlayers}/23</strong></span>
                  <span>GK chính: <strong className={t.mainGkCount === 1 ? 'text-neon-green font-bold' : 'text-red-400 font-bold'}>{t.mainGkCount || 0}/1</strong></span>
                  <span>GK dự bị: <strong className={t.subGkCount === 1 ? 'text-neon-green font-bold' : 'text-red-400 font-bold'}>{t.subGkCount || 0}/1</strong></span>
                </div>
              </div>

              {/* Bottom Yellow Banner */}
              <div className="bg-[#fbbf24] text-slate-950 py-1.5 px-3 text-center text-xs font-black tracking-widest uppercase shadow-md">
                {t.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
