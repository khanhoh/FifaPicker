import React from 'react';
import { useDraft } from '../context/DraftContext';
import { TeamLogos } from '../assets/teamLogos';

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

// 8R đặt 3 ô theo yêu cầu
const MAIN_ROUND_SLOTS = [
  { label: '1R', count: 1, startIndex: 0 },
  { label: '2R', count: 1, startIndex: 1 },
  { label: '3R', count: 1, startIndex: 2 },
  { label: '4R', count: 2, startIndex: 3 },
  { label: '5R', count: 2, startIndex: 5 },
  { label: '6R', count: 2, startIndex: 7 },
  { label: '7R', count: 2, startIndex: 9 },
  { label: '8R', count: 3, startIndex: 10, isCompensate: true }
];

const SUB_ROUND_SLOTS = [
  { label: '-1R', count: 2, startIndex: 0 },
  { label: '-2R', count: 2, startIndex: 2 },
  { label: '-3R', count: 3, startIndex: 4 },
  { label: '-4R', count: 2, startIndex: 7 },
  { label: '-5R', count: 3, startIndex: 9 }
];

export default function BroadcastBoard() {
  const { draftState } = useDraft();

  const teams = draftState?.teams || [];
  const currentTeam = draftState?.currentTeam;
  const currentRound = draftState?.currentRound;
  const picksInCurrentTurn = draftState?.picksInCurrentTurn || 0;

  // Render player sub-slot
  const renderPlayerSlot = (player, isActiveSlot, heightClass = 'h-9') => {
    if (player) {
      return (
        <div
          className={`${heightClass} px-2.5 rounded-lg flex items-center justify-between border bg-[#0d1422] border-slate-800/90 ${
            POS_COLORS[player.pos] || 'border-l-4 border-l-slate-500 text-slate-300'
          } shadow-sm transition`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="font-black text-xs tracking-wider">
              {player.pos}
            </span>
            {player.crestUrl && (
              <img
                src={player.crestUrl}
                alt={player.season}
                className="w-4 h-4 object-contain"
              />
            )}
            <span className="text-xs font-bold truncate text-slate-100" title={player.name}>
              {player.name}
            </span>
          </div>
          <span className="text-xs font-digital font-bold text-amber-400 opacity-90">
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
            const TeamLogo = TeamLogos[t.code] || TeamLogos.AMT;

            return (
              <div
                key={t.id}
                className={`relative flex items-center justify-between p-2.5 rounded-xl border transition duration-300 ${
                  isTurn
                    ? 'border-neon-green bg-emerald-950/50 glow-neon-green shadow-[0_0_15px_rgba(0,255,102,0.4)]'
                    : 'border-neon-green/60 bg-[#0f1728]'
                }`}
              >
                {/* Number in circle (1) + Team code + Logo */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-neon-green flex items-center justify-center text-[11px] font-black text-neon-green">
                    {idx + 1}
                  </div>
                  <div className="text-sm font-black tracking-wider text-white">
                    {t.code}
                  </div>
                  <TeamLogo className="w-6 h-6 drop-shadow" />
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
                  {slotInfo.count > 1 && (
                    <span className="text-[9px] font-normal text-slate-500">
                      ({slotInfo.count}p)
                    </span>
                  )}
                </div>

                {/* 4 Team Cells with multi-slot stacking */}
                {teams.map((t) => {
                  const isTeamActive = currentTeam && currentTeam.id === t.id && isCurrentRow && draftState?.status === 'drafting';

                  return (
                    <div key={t.id} className="flex flex-col gap-1.5">
                      {Array.from({ length: slotInfo.count }).map((_, subIdx) => {
                        const playerIndex = slotInfo.startIndex + subIdx;
                        const player = t.startingXI[playerIndex];
                        const isActiveSlot = isTeamActive && !player && subIdx === picksInCurrentTurn;

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

          {/* Sub Squad Rows (-1R to -5R) */}
          {SUB_ROUND_SLOTS.map((slotInfo) => {
            const isCurrentSubRow = currentRound?.label === slotInfo.label;

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
                    ({slotInfo.count}p)
                  </span>
                </div>

                {/* 4 Team Cells for Sub Rounds */}
                {teams.map((t) => {
                  const isTeamActive = currentTeam && currentTeam.id === t.id && isCurrentSubRow && draftState?.status === 'drafting';

                  return (
                    <div key={t.id} className="flex flex-col gap-1.5">
                      {Array.from({ length: slotInfo.count }).map((_, subIdx) => {
                        const subPlayerIndex = slotInfo.startIndex + subIdx;
                        const subPlayer = t.subs[subPlayerIndex];
                        const isActiveSlot = isTeamActive && !subPlayer && subIdx === picksInCurrentTurn;

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
          const TeamLogo = TeamLogos[t.code] || TeamLogos.AMT;

          return (
            <div
              key={t.id}
              className={`relative bg-[#0c1424] border rounded-2xl overflow-hidden flex flex-col justify-between transition duration-300 shadow-2xl ${
                isTurn
                  ? 'border-neon-green glow-neon-green shadow-emerald-950 scale-102'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Upper Card: Logo & Stats */}
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1 shadow-lg">
                      <TeamLogo className="w-10 h-10" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white tracking-wider">
                        {t.code}
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold">
                        Quỹ lương: <strong className={t.totalSalaryMain > 305 ? 'text-red-400' : 'text-neon-green'}>{t.totalSalaryMain}/305</strong>
                      </div>
                    </div>
                  </div>

                  {isTurn ? (
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
                  <span>GK: <strong className={t.gkCount >= 2 ? 'text-neon-green font-bold' : t.gkCount === 1 ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>{t.gkCount}/2</strong></span>
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
