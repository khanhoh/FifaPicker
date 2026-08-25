import React from 'react';

const POS_COLORS = {
  ST: 'text-red-400 border-red-500 bg-red-500/10',
  CF: 'text-red-400 border-red-500 bg-red-500/10',
  LW: 'text-red-400 border-red-500 bg-red-500/10',
  RW: 'text-red-400 border-red-500 bg-red-500/10',
  CAM: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
  CM: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
  CDM: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
  LM: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
  RM: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
  CB: 'text-blue-400 border-blue-500 bg-blue-500/10',
  LB: 'text-blue-400 border-blue-500 bg-blue-500/10',
  RB: 'text-blue-400 border-blue-500 bg-blue-500/10',
  LWB: 'text-blue-400 border-blue-500 bg-blue-500/10',
  RWB: 'text-blue-400 border-blue-500 bg-blue-500/10',
  GK: 'text-amber-400 border-amber-500 bg-amber-500/10'
};

export default function PlayerCard({ player }) {
  if (!player) return null;

  const posColor = POS_COLORS[player.pos] || 'text-slate-300 border-slate-500 bg-slate-500/10';

  return (
    <div className="relative w-56 h-80 rounded-2xl p-4 bg-gradient-to-b from-amber-100 via-amber-200 to-amber-50 text-slate-900 shadow-2xl border-2 border-amber-300 flex flex-col justify-between overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
      
      {/* Top section: OVR, POS, Season crest, Max plus */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <div className="text-3xl font-black tracking-tighter leading-none font-digital text-slate-950">
            {player.ovr}
          </div>
          <div className="text-sm font-extrabold tracking-wider text-slate-800">
            {player.pos}
          </div>
          {player.maxPlus && (
            <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded bg-amber-700 text-amber-100 text-[10px] font-bold shadow-sm">
              +{player.maxPlus}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {player.crestUrl && (
            <img
              src={player.crestUrl}
              alt={player.season}
              className="w-7 h-7 object-contain drop-shadow"
            />
          )}
          {player.nationUrl && (
            <img
              src={player.nationUrl}
              alt="Nation"
              className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
      </div>

      {/* Center section: Big Player Avatar */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-1">
        <img
          src={player.avatarUrl}
          alt={player.name}
          className="h-44 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.35)] hover:scale-105 transition duration-300"
          onError={(e) => {
            e.target.src = 'https://s1.fifaaddict.com/assets/img/blank.png';
          }}
        />
      </div>

      {/* Bottom section: Player Name, Salary & Details */}
      <div className="relative z-10 text-center border-t border-amber-400/60 pt-1.5">
        <div className="text-sm font-black tracking-tight truncate uppercase text-slate-950">
          {player.name}
        </div>
        <div className="flex justify-center items-center gap-2 text-[10px] font-semibold text-slate-700 mt-0.5">
          <span>Lương: <strong className="text-slate-950 font-bold">{player.salary}</strong></span>
          <span>•</span>
          <span>Chân: {player.weakFoot}</span>
          <span>•</span>
          <span>Skill: {player.skill}★</span>
        </div>
      </div>
    </div>
  );
}
