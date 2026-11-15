'use client';

import React from 'react';

export type RoleArtType = 'customer' | 'owner' | 'driver' | 'shuttle' | 'movers';

interface RoleArtProps {
  role: RoleArtType;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function RoleArt({ role, className = '', width = '100%', height = '100%' }: RoleArtProps) {
  if (role === 'customer') {
    return (
      <svg
        role="img"
        aria-label="Customer with suitcase"
        width={width}
        height={height}
        viewBox="0 0 160 120"
        preserveAspectRatio="xMidYMid meet"
        className={className}
      >
        <ellipse cx="80" cy="108" rx="52" ry="7" fill="#C7D7F7" />
        <path d="M118 22c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16z" fill="#1D4ED8" />
        <circle cx="118" cy="38" r="6" fill="#FFFFFF" />
        <rect x="56" y="54" width="34" height="40" rx="12" fill="#2563EB" />
        <rect x="60" y="88" width="10" height="20" rx="4" fill="#1E3A8A" />
        <rect x="76" y="88" width="10" height="20" rx="4" fill="#1E3A8A" />
        <circle cx="73" cy="38" r="13" fill="#E8B48C" />
        <path d="M60 36c0-9 6-14 13-14s13 5 13 13c-4-4-9-5-13-5s-9 2-13 6z" fill="#3B2A20" />
        <rect x="94" y="70" width="26" height="34" rx="5" fill="#F59E0B" />
        <rect x="101" y="62" width="12" height="10" rx="3" fill="none" stroke="#B45309" stroke-width="3" />
        <path d="M99 80h16M99 90h16" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M88 66l10 6" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  }

  if (role === 'owner') {
    return (
      <svg
        role="img"
        aria-label="Car owner with car and key"
        width={width}
        height={height}
        viewBox="0 0 160 120"
        preserveAspectRatio="xMidYMid meet"
        className={className}
      >
        <ellipse cx="78" cy="106" rx="62" ry="7" fill="#BFDCCD" />
        <path d="M18 86V74c0-5 3-8 8-9l18-4 14-16c2-2 4-3 7-3h32c3 0 5 1 7 3l14 16 12 3c5 1 8 5 8 10v12z" fill="#0B6B4F" />
        <path d="M62 47h14v16H50zM82 47h14l12 16H82z" fill="#D7EFE4" />
        <rect x="18" y="80" width="120" height="8" rx="3" fill="#08513C" />
        <circle cx="46" cy="90" r="12" fill="#1F2937" />
        <circle cx="46" cy="90" r="5" fill="#D1D5DB" />
        <circle cx="112" cy="90" r="12" fill="#1F2937" />
        <circle cx="112" cy="90" r="5" fill="#D1D5DB" />
        <rect x="126" y="70" width="10" height="6" rx="2" fill="#FDE68A" />
        <circle cx="132" cy="22" r="11" fill="none" stroke="#F59E0B" strokeWidth="6" />
        <path d="M124 30l-16 16M114 40l5 5M110 44l5 5" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  if (role === 'driver') {
    return (
      <svg
        role="img"
        aria-label="Driver with cap and steering wheel"
        width={width}
        height={height}
        viewBox="0 0 160 120"
        preserveAspectRatio="xMidYMid meet"
        className={className}
      >
        <ellipse cx="80" cy="108" rx="50" ry="7" fill="#F6D9A8" />
        <rect x="56" y="58" width="48" height="44" rx="16" fill="#FFFFFF" stroke="#1F2937" strokeWidth="3" />
        <path d="M80 60v40" stroke="#1F2937" strokeWidth="3" />
        <path d="M70 60l10 12 10-12" fill="#B45309" />
        <circle cx="80" cy="40" r="15" fill="#C98E62" />
        <path d="M62 33c0-11 8-17 18-17s18 6 18 17z" fill="#1F2937" />
        <rect x="58" y="31" width="44" height="6" rx="3" fill="#111827" />
        <rect x="74" y="20" width="12" height="7" rx="2" fill="#F59E0B" />
        <circle cx="80" cy="86" r="22" fill="none" stroke="#B45309" strokeWidth="7" />
        <circle cx="80" cy="86" r="5" fill="#B45309" />
        <path d="M58 86h17M85 86h17M80 91v17" stroke="#B45309" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (role === 'shuttle') {
    return (
      <svg
        role="img"
        aria-label="Pick and drop van with passengers"
        width={width}
        height={height}
        viewBox="0 0 160 120"
        preserveAspectRatio="xMidYMid meet"
        className={className}
      >
        <ellipse cx="80" cy="106" rx="64" ry="7" fill="#DDD0FA" />
        <path d="M14 90V40c0-6 4-10 10-10h96c5 0 9 3 11 8l13 26c1 2 2 5 2 8v18z" fill="#7C3AED" />
        <rect x="22" y="40" width="22" height="20" rx="3" fill="#EDE5FD" />
        <rect x="50" y="40" width="22" height="20" rx="3" fill="#EDE5FD" />
        <rect x="78" y="40" width="22" height="20" rx="3" fill="#EDE5FD" />
        <path d="M106 40h14l12 22h-26z" fill="#EDE5FD" />
        <circle cx="33" cy="52" r="5" fill="#C98E62" />
        <circle cx="61" cy="52" r="5" fill="#E8B48C" />
        <circle cx="89" cy="52" r="5" fill="#C98E62" />
        <rect x="14" y="70" width="132" height="6" fill="#F5B547" />
        <circle cx="44" cy="92" r="12" fill="#1F2937" />
        <circle cx="44" cy="92" r="5" fill="#D1D5DB" />
        <circle cx="118" cy="92" r="12" fill="#1F2937" />
        <circle cx="118" cy="92" r="5" fill="#D1D5DB" />
      </svg>
    );
  }

  // Movers
  return (
    <svg
      role="img"
      aria-label="Moving truck with boxes"
      width={width}
      height={height}
      viewBox="0 0 160 120"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <ellipse cx="80" cy="106" rx="64" ry="7" fill="#F6CDB8" />
      <rect x="24" y="34" width="26" height="24" rx="2" fill="#D6A56B" stroke="#8A5A2B" strokeWidth="2" />
      <rect x="52" y="40" width="26" height="18" rx="2" fill="#E3B884" stroke="#8A5A2B" strokeWidth="2" />
      <rect x="36" y="14" width="24" height="20" rx="2" fill="#E3B884" stroke="#8A5A2B" strokeWidth="2" />
      <path d="M30 46h14M58 49h14M42 24h12" stroke="#8A5A2B" strokeWidth="2" />
      <rect x="14" y="58" width="92" height="22" rx="3" fill="#C2410C" />
      <path d="M106 44h20c4 0 7 2 9 5l9 15c1 2 2 4 2 6v10h-40z" fill="#EA580C" />
      <path d="M112 50h13l8 13h-21z" fill="#FDEADF" />
      <rect x="14" y="78" width="132" height="6" rx="2" fill="#7C2D12" />
      <circle cx="40" cy="90" r="12" fill="#1F2937" />
      <circle cx="40" cy="90" r="5" fill="#D1D5DB" />
      <circle cx="124" cy="90" r="12" fill="#1F2937" />
      <circle cx="124" cy="90" r="5" fill="#D1D5DB" />
    </svg>
  );
}

