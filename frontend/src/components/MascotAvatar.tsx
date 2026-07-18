'use client';

import { useId } from 'react';

/** Shared Wayspeak owl colors — hex for SVG fills */
export const MASCOT_COLORS: Record<string, { fill: string; dark: string; label: string }> = {
  Green: { fill: '#58cc02', dark: '#46a302', label: 'Green' },
  Blue: { fill: '#1cb0f6', dark: '#1899d6', label: 'Blue' },
  Gold: { fill: '#ffc800', dark: '#e6a800', label: 'Gold' },
  Red: { fill: '#ff4b4b', dark: '#ea2b2b', label: 'Red' },
};

export const MASCOT_OUTFITS = ['Classic', 'Explorer', 'Astro'] as const;
export const MASCOT_ACCESSORIES = ['None', 'Glasses', 'Hat'] as const;
export const MASCOT_COLOR_KEYS = ['Green', 'Blue', 'Gold', 'Red'] as const;

type MascotAvatarProps = {
  outfit?: string | null;
  accessory?: string | null;
  color?: string | null;
  className?: string;
  size?: number;
};

export default function MascotAvatar({
  outfit = 'Classic',
  accessory = null,
  color = 'Green',
  className = '',
  size = 256,
}: MascotAvatarProps) {
  const uid = useId().replace(/:/g, '');
  const palette = MASCOT_COLORS[color || 'Green'] ?? MASCOT_COLORS.Green;
  const o = (outfit || 'Classic').toLowerCase();
  const acc = (accessory || 'None').toLowerCase();
  const bodySheen = `bodySheen-${uid}`;
  const headSheen = `headSheen-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={`Mascot in ${outfit} outfit, ${color} color${acc !== 'none' ? `, wearing ${accessory}` : ''}`}
    >
      <ellipse cx="100" cy="178" rx="48" ry="8" fill="rgba(0,0,0,0.12)" />

      <ellipse cx="100" cy="118" rx="52" ry="48" fill={palette.fill} />
      <ellipse cx="100" cy="118" rx="52" ry="48" fill={`url(#${bodySheen})`} opacity="0.25" />

      <ellipse cx="100" cy="128" rx="28" ry="26" fill="#fff9e6" />

      <circle cx="100" cy="72" r="46" fill={palette.fill} />
      <circle cx="100" cy="72" r="46" fill={`url(#${headSheen})`} opacity="0.2" />

      <ellipse cx="62" cy="42" rx="14" ry="18" fill={palette.dark} transform="rotate(-18 62 42)" />
      <ellipse cx="138" cy="42" rx="14" ry="18" fill={palette.dark} transform="rotate(18 138 42)" />
      <ellipse cx="64" cy="44" rx="8" ry="10" fill={palette.fill} transform="rotate(-18 64 44)" />
      <ellipse cx="136" cy="44" rx="8" ry="10" fill={palette.fill} transform="rotate(18 136 44)" />

      <circle cx="82" cy="72" r="16" fill="white" />
      <circle cx="118" cy="72" r="16" fill="white" />
      <circle cx="84" cy="74" r="8" fill="#1a1a1a" />
      <circle cx="120" cy="74" r="8" fill="#1a1a1a" />
      <circle cx="87" cy="71" r="3" fill="white" />
      <circle cx="123" cy="71" r="3" fill="white" />

      <path d="M100 82 L92 94 L108 94 Z" fill="#ff9600" />
      <path d="M100 84 L95 92 L105 92 Z" fill="#ffc800" />

      <ellipse cx="82" cy="162" rx="12" ry="6" fill="#ff9600" />
      <ellipse cx="118" cy="162" rx="12" ry="6" fill="#ff9600" />

      {o === 'explorer' && (
        <g>
          <path d="M62 98 Q100 112 138 98 Q140 118 100 122 Q60 118 62 98" fill="#8B4513" />
          <rect x="118" y="108" width="10" height="28" rx="3" fill="#A0522D" transform="rotate(12 123 122)" />
          <circle cx="100" cy="112" r="8" fill="#ffc800" stroke="#8B4513" strokeWidth="2" />
          <circle cx="100" cy="112" r="3" fill="#8B4513" />
        </g>
      )}

      {o === 'astro' && (
        <g>
          <path
            d="M58 96 Q100 108 142 96 L138 130 Q100 142 62 130 Z"
            fill="#e8eef5"
            stroke="#9aa8b8"
            strokeWidth="2"
          />
          <rect x="84" y="108" width="32" height="22" rx="4" fill="#c5d4e3" stroke="#7a8fa3" strokeWidth="1.5" />
          <circle cx="92" cy="119" r="3" fill="#58cc02" />
          <circle cx="100" cy="119" r="3" fill="#1cb0f6" />
          <circle cx="108" cy="119" r="3" fill="#ff4b4b" />
          <ellipse cx="100" cy="70" rx="42" ry="40" fill="none" stroke="#b0c4d8" strokeWidth="5" opacity="0.85" />
          <ellipse cx="100" cy="70" rx="42" ry="40" fill="rgba(180,220,255,0.18)" />
        </g>
      )}

      {o === 'classic' && (
        <g>
          <path d="M88 104 L100 110 L88 116 Z" fill={palette.dark} />
          <path d="M112 104 L100 110 L112 116 Z" fill={palette.dark} />
          <circle cx="100" cy="110" r="4" fill="#ffc800" />
        </g>
      )}

      <ellipse cx="52" cy="120" rx="14" ry="22" fill={palette.dark} opacity="0.85" transform="rotate(-20 52 120)" />
      <ellipse cx="148" cy="120" rx="14" ry="22" fill={palette.dark} opacity="0.85" transform="rotate(20 148 120)" />

      {acc === 'glasses' && (
        <g>
          <circle cx="82" cy="74" r="18" fill="rgba(255,255,255,0.15)" stroke="#222" strokeWidth="3.5" />
          <circle cx="118" cy="74" r="18" fill="rgba(255,255,255,0.15)" stroke="#222" strokeWidth="3.5" />
          <rect x="97" y="71" width="6" height="5" rx="1.5" fill="#222" />
          <path d="M64 70 Q56 66 50 72" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M136 70 Q144 66 150 72" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {acc === 'hat' && (
        <g>
          <ellipse cx="100" cy="38" rx="40" ry="12" fill="#1a1a1a" />
          <path d="M70 40 Q100 8 130 40" fill="#2d2d2d" />
          <path d="M70 40 Q100 14 130 40" fill="#3d3d3d" />
          <ellipse cx="100" cy="36" rx="28" ry="8" fill="#4a4a4a" opacity="0.5" />
          <ellipse cx="118" cy="42" rx="22" ry="7" fill="#1a1a1a" />
          <rect x="92" y="28" width="16" height="6" rx="2" fill="#58cc02" />
        </g>
      )}

      <defs>
        <radialGradient id={bodySheen} cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id={headSheen} cx="35%" cy="30%" r="55%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function OutfitPreview({ outfit, color = 'Green' }: { outfit: string; color?: string }) {
  return (
    <MascotAvatar outfit={outfit} color={color} accessory="None" size={64} className="w-16 h-16" />
  );
}

export function AccessoryPreview({ accessory, color = 'Green' }: { accessory: string; color?: string }) {
  return (
    <MascotAvatar
      outfit="Classic"
      color={color}
      accessory={accessory === 'None' ? null : accessory}
      size={64}
      className="w-16 h-16"
    />
  );
}
