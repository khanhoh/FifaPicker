import React from 'react';

const SIZE_CLASSES = {
  xs: 'h-4 min-w-6 px-1 text-[9px]',
  sm: 'h-5 min-w-8 px-1.5 text-[11px]',
  md: 'h-7 min-w-10 px-2.5 text-sm',
  card: 'h-8 min-w-12 px-3 text-lg',
  lg: 'h-10 min-w-14 px-4 text-xl'
};

const TIER_CLASSES = {
  bronze: {
    face: 'from-[#dfb185] via-[#b9794d] to-[#8c5637]',
    text: 'text-[#2d1a12]',
    border: 'border-[#f0c79f]/80'
  },
  silver: {
    face: 'from-[#f6f7fb] via-[#d9dce6] to-[#aeb5c4]',
    text: 'text-[#1e2035]',
    border: 'border-white/80'
  },
  gold: {
    face: 'from-[#ffe89a] via-[#e7b93f] to-[#a86b08]',
    text: 'text-[#2b1b00]',
    border: 'border-[#fff0a8]/90'
  },
  elite: {
    face: 'from-[#e9d5ff] via-[#67e8f9] to-[#f0abfc]',
    text: 'text-[#211638]',
    border: 'border-cyan-100/90'
  }
};

function getTier(level) {
  if (level <= 4) return 'bronze';
  if (level <= 7) return 'silver';
  if (level <= 9) return 'gold';
  return 'elite';
}

export default function EnhancementBadge({ level, size = 'md', className = '' }) {
  const grade = Number(level);
  if (!Number.isFinite(grade) || grade <= 0) return null;

  const tier = TIER_CLASSES[getTier(grade)];
  const sizeClassName = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <span
      role="img"
      aria-label={`Cấp thẻ tối đa +${grade}`}
      title={`Cấp thẻ tối đa +${grade}`}
      className={`${className} ${sizeClassName} relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm border bg-gradient-to-b ${tier.face} ${tier.border} font-sans font-black tabular-nums tracking-tight shadow-[0_4px_10px_rgba(2,6,23,0.38)]`}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/90" />
      <span aria-hidden="true" className="absolute inset-y-0 right-0 w-px bg-slate-700/25" />
      <span className={`relative z-10 leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] ${tier.text}`}>
        {grade}
      </span>
    </span>
  );
}
