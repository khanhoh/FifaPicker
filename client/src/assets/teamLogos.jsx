import React from 'react';

function getInitials(name, code) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.map((word) => word[0]).join('').slice(0, 3).toUpperCase();
  return String(code || words[0] || '?').slice(0, 3).toUpperCase();
}

export function TeamLogo({
  code,
  name,
  color = '#64748b',
  logoUrl,
  className = 'w-6 h-6'
}) {
  const logo = logoUrl
    ? { src: logoUrl, alt: name || code, imageClassName: 'w-[82%] h-[82%]' }
    : null;

  if (!logo) {
    return (
      <span
        aria-label={name || code || 'Đội'}
        title={name || code || 'Đội'}
        style={{
          background: `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 42%, #020617))`
        }}
        className={`${className} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[0.3em] ring-1 ring-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_rgba(2,6,23,0.3)]`}
      >
        <svg aria-hidden="true" viewBox="0 0 100 100" className="h-full w-full">
          <text
            x="50"
            y="54"
            fill="white"
            fontSize={getInitials(name, code).length > 2 ? 27 : 34}
            fontWeight="900"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ filter: 'drop-shadow(0 3px 4px rgba(2, 6, 23, 0.55))' }}
          >
            {getInitials(name, code)}
          </text>
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`${className} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[0.3em] bg-gradient-to-br from-white via-slate-100 to-slate-300 ring-1 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_4px_12px_rgba(2,6,23,0.28)]`}
    >
      <img
        src={logo.src}
        alt={logo.alt}
        className={`${logo.imageClassName} object-contain`}
      />
    </span>
  );
}

export const FCLogo = ({ className = 'w-8 h-8' }) => (
  <img
    src="/logos/fclogo.png"
    alt="FC Online"
    className={`${className} object-contain`}
  />
);
