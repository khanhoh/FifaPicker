import React from 'react';
import EnhancementBadge from './EnhancementBadge';

const LINEUP_TEXT_STYLE = {
  color: '#f8fafc',
  WebkitTextStroke: '1.4px rgba(2, 6, 23, 0.95)',
  paintOrder: 'stroke fill',
  textShadow: '0 2px 2px rgba(0, 0, 0, 0.95), 0 0 5px rgba(0, 0, 0, 0.85)'
};

const SIZE_STYLES = {
  default: {
    root: 'h-80 w-[272px]',
    ovr: 'text-3xl',
    pos: 'text-sm',
    badge: 'card',
    seasonLogo: 'h-7 w-7',
    name: 'text-sm',
    fp: 'h-10 w-10 border-4 text-base'
  },
  preview: {
    root: 'h-56 w-[190px]',
    ovr: 'text-2xl',
    pos: 'text-xs',
    badge: 'sm',
    seasonLogo: 'h-5 w-5',
    name: 'text-xs',
    fp: 'h-8 w-8 border-[3px] text-xs'
  },
  compact: {
    root: 'h-[122px] w-[104px]',
    ovr: 'text-sm',
    pos: 'text-[7px]',
    badge: 'xs',
    seasonLogo: 'h-3.5 w-3.5',
    name: 'text-[6px]',
    fp: 'h-5 w-5 border-2 text-[7px]'
  }
};

export default function PlayerCard({ player, variant = 'default', size = 'default', className = '' }) {
  if (!player) return null;
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.default;
  const useLineupContrast = variant === 'lineup' || variant === 'ban';
  const readableTextStyle = useLineupContrast
    ? {
        ...LINEUP_TEXT_STYLE,
        WebkitTextStroke: size === 'compact' ? '0.65px rgba(2, 6, 23, 0.95)' : LINEUP_TEXT_STYLE.WebkitTextStroke,
        textShadow: size === 'compact'
          ? '0 1px 1px rgba(0, 0, 0, 0.95), 0 0 3px rgba(0, 0, 0, 0.8)'
          : LINEUP_TEXT_STYLE.textShadow
      }
    : undefined;

  return (
    <div className={`${sizeStyle.root} ${className} relative overflow-hidden bg-transparent text-[#4b3518] drop-shadow-2xl`}>
      {player.cardBackgroundUrl && (
        <img
          src={player.cardBackgroundUrl}
          alt={`Nền thẻ ${player.seasonName}`}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {/* Original FC hierarchy: OVR and position form one block at top-left. */}
      <div className={`absolute z-20 left-[22%] top-[18%] ${useLineupContrast ? '' : '[text-shadow:0_1px_1px_rgba(255,255,255,0.45)]'}`}>
        <div style={readableTextStyle} className={`${sizeStyle.ovr} font-black tracking-tighter leading-none font-digital ${useLineupContrast ? '' : 'text-[#4b3518]'}`}>
          {player.ovr}
        </div>
        <div style={readableTextStyle} className={`${sizeStyle.pos} font-extrabold tracking-wider leading-tight ${useLineupContrast ? '' : 'text-[#4b3518]'}`}>
          {player.pos}
        </div>
      </div>

      {player.maxPlus && (
        <div className="absolute right-[21%] top-[65%] z-30">
          <EnhancementBadge level={player.maxPlus} size={sizeStyle.badge} />
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
              className={`${sizeStyle.seasonLogo} object-contain shrink-0 drop-shadow`}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div
            style={readableTextStyle}
            className={`${sizeStyle.name} font-black tracking-tight truncate uppercase ${useLineupContrast ? '' : 'text-[#4b3518] [text-shadow:0_1px_1px_rgba(255,255,255,0.5)]'}`}
          >
            {player.name}
          </div>
        </div>
      </div>

      <div
        title={`FP ${player.salary}`}
        className={`${sizeStyle.fp} absolute z-30 left-1/2 bottom-[2%] -translate-x-1/2 inline-flex items-center justify-center rounded-full border-slate-300 bg-slate-100/95 font-black font-digital text-[#4b3518] shadow-lg`}
      >
        {player.salary}
      </div>
    </div>
  );
}
