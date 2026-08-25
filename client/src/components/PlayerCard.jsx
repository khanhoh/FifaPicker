import React from 'react';
import EnhancementBadge from './EnhancementBadge';

export default function PlayerCard({ player }) {
  if (!player) return null;

  return (
    <div className="relative w-[272px] h-80 bg-transparent text-[#4b3518] drop-shadow-2xl overflow-hidden">
      {player.cardBackgroundUrl && (
        <img
          src={player.cardBackgroundUrl}
          alt={`Nền thẻ ${player.seasonName}`}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {/* Original FC hierarchy: OVR and position form one block at top-left. */}
      <div className="absolute z-20 left-[22%] top-[18%] [text-shadow:0_1px_1px_rgba(255,255,255,0.45)]">
        <div className="text-3xl font-black tracking-tighter leading-none font-digital text-[#4b3518]">
          {player.ovr}
        </div>
        <div className="text-sm font-extrabold tracking-wider leading-tight text-[#4b3518]">
          {player.pos}
        </div>
      </div>

      {player.maxPlus && (
        <div className="absolute right-[21%] top-[65%] z-30">
          <EnhancementBadge level={player.maxPlus} size="card" />
        </div>
      )}

      <div className="absolute z-10 inset-x-[7%] top-[25%] bottom-[21%] flex items-end justify-center">
        <img
          src={player.avatarUrl}
          alt={player.name}
          className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.45)] hover:scale-105 transition duration-300"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* The lower artwork remains visible: season + name, then FP badge. */}
      <div className="absolute z-30 left-[12%] right-[12%] top-[76%] text-center">
        <div className="flex items-center justify-center gap-1.5 min-w-0">
          {player.seasonLogoUrl && (
            <img
              src={player.seasonLogoUrl}
              alt={player.seasonName}
              title={player.seasonName}
              className="w-7 h-7 object-contain shrink-0 drop-shadow"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="text-sm font-black tracking-tight truncate uppercase text-[#4b3518] [text-shadow:0_1px_1px_rgba(255,255,255,0.5)]">
            {player.name}
          </div>
        </div>
      </div>

      <div
        title={`FP ${player.salary}`}
        className="absolute z-30 left-1/2 bottom-[2%] -translate-x-1/2 inline-flex w-10 h-10 items-center justify-center rounded-full border-4 border-slate-300 bg-slate-100/95 text-base font-black font-digital text-[#4b3518] shadow-lg"
      >
        {player.salary}
      </div>
    </div>
  );
}
