// Nhóm 4 (Sang trọng – Hoàng gia – Châu Âu): Baroque, Santorini.
import React from 'react';
import { spiral, lighten, darken, mix } from './artUtils';
import type { MotifProps } from './motifTypes';

/** Lá ô-rô (acanthus) cách điệu, hướng lên, gốc tại (0,0). */
const Acanthus: React.FC<{ fill: string; s?: number }> = ({ fill, s = 1 }) => (
  <g transform={`scale(${s})`}>
    <path d="M0 0 C-6 -20 -22 -30 -34 -30 C-26 -24 -24 -16 -26 -10 C-18 -18 -10 -16 -8 -8 C-14 -12 -18 -6 -14 0 Z" fill={fill} />
    <path d="M0 0 C6 -20 22 -30 34 -30 C26 -24 24 -16 26 -10 C18 -18 10 -16 8 -8 C14 -12 18 -6 14 0 Z" fill={fill} />
    <path d="M0 -2 C-8 -24 -4 -44 0 -56 C4 -44 8 -24 0 -2 Z" fill={fill} />
  </g>
);

/** Cartouche Baroque đối xứng: hai cuốn C + lá ô-rô ở giữa. Vẽ quanh (0,0), rộng ~260. */
const Cartouche: React.FC<{ stroke: string; fill: string; s?: number; flip?: boolean }> = ({ stroke, fill, s = 1, flip }) => (
  <g transform={`scale(${s} ${flip ? -s : s})`} fill="none" stroke={stroke} strokeLinecap="round">
    {[1, -1].map((k) => (
      <g key={k} transform={`scale(${k} 1)`}>
        <path d="M8 0 C40 0 60 -26 92 -26 C120 -26 132 -6 124 8 C116 22 96 18 98 4" strokeWidth="3" />
        <path d={spiral(108, 2, 11, 1.1, Math.PI, 1, 18)} strokeWidth="2" />
        <path d="M30 4 C56 8 72 26 100 30 C118 32 130 26 136 18" strokeWidth="1.6" />
        <path d="M124 8 C140 8 150 0 156 -10" strokeWidth="1.6" />
        <path d={spiral(156, -18, 8, 1, Math.PI / 2, -1, 14)} strokeWidth="1.4" />
        <circle cx="70" cy="-12" r="2.4" fill={fill} stroke="none" />
        <circle cx="168" cy="-4" r="2" fill={fill} stroke="none" />
      </g>
    ))}
    <g stroke="none">
      <Acanthus fill={fill} s={0.9} />
    </g>
    <circle cx="0" cy="8" r="5" fill={fill} stroke="none" />
  </g>
);

const Fleuron: React.FC<{ fill: string; stroke: string }> = ({ fill, stroke }) => (
  <g fill="none" stroke={stroke} strokeLinecap="round">
    <path d="M0 0 C0 30 10 48 34 54" strokeWidth="2" />
    <path d="M0 0 C30 0 48 10 54 34" strokeWidth="2" />
    <path d={spiral(36, 50, 7, 1, -Math.PI / 2, 1, 14)} strokeWidth="1.4" />
    <path d={spiral(50, 36, 7, 1, Math.PI, -1, 14)} strokeWidth="1.4" />
    <path d="M6 6 C18 10 26 18 30 30 C18 26 10 18 6 6 Z" fill={fill} stroke="none" />
  </g>
);

export const BaroqueArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const g = `url(#${uid}-gold)`;
  const v2 = variant === 'v2'; // V2: nền đậm, khung dày hơn
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={darken(c.metal, 0.22)} />
          <stop offset="0.4" stopColor={lighten(c.metal, 0.22)} />
          <stop offset="0.6" stopColor={c.metal} />
          <stop offset="1" stopColor={darken(c.metal, 0.28)} />
        </linearGradient>
        <radialGradient id={`${uid}-paper`} cx="0.5" cy="0.45" r="0.8">
          <stop offset="0" stopColor={lighten(c.ground, v2 ? 0.08 : 0.45)} />
          <stop offset="1" stopColor={v2 ? darken(c.ground, 0.25) : mix(c.ground, c.metal, 0.12)} />
        </radialGradient>
        <filter id={`${uid}-emboss`} x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" floodColor={darken(c.ground, 0.6)} floodOpacity={v2 ? 0.5 : 0.25} />
        </filter>
        <pattern id={`${uid}-damask`} width="80" height="100" patternUnits="userSpaceOnUse">
          <g fill={c.metal}>
            <path d="M40 18 C52 30 52 44 40 54 C28 44 28 30 40 18 Z" />
            <path d="M40 54 C48 62 58 62 64 56 C58 70 46 72 40 64 C34 72 22 70 16 56 C22 62 32 62 40 54 Z" />
            <circle cx="0" cy="100" r="3" />
            <circle cx="80" cy="100" r="3" />
            <circle cx="0" cy="0" r="3" />
            <circle cx="80" cy="0" r="3" />
          </g>
        </pattern>
      </defs>
      <rect width="600" height="800" fill={`url(#${uid}-paper)`} />
      <rect width="600" height="800" fill={`url(#${uid}-damask)`} opacity={v2 ? 0.07 : 0.05} />

      <g filter={`url(#${uid}-emboss)`}>
        <rect x="26" y="26" width="548" height="748" fill="none" stroke={g} strokeWidth={v2 ? 4 : 2.6} />
        <rect x="38" y="38" width="524" height="724" fill="none" stroke={g} strokeWidth="1" />
        <rect x="46" y="46" width="508" height="708" fill="none" stroke={g} strokeWidth="0.6" strokeDasharray="1 4" />
        {/* cartouche trên & dưới */}
        <g transform="translate(300 96)">
          <Cartouche stroke={g} fill={g} s={1} />
        </g>
        <g transform="translate(300 712)">
          <Cartouche stroke={g} fill={g} s={0.82} flip />
        </g>
        {/* hoa góc */}
        <g transform="translate(52 52)"><Fleuron fill={g} stroke={g} /></g>
        <g transform="translate(548 52) scale(-1 1)"><Fleuron fill={g} stroke={g} /></g>
        <g transform="translate(52 748) scale(1 -1)"><Fleuron fill={g} stroke={g} /></g>
        <g transform="translate(548 748) scale(-1 -1)"><Fleuron fill={g} stroke={g} /></g>
        {/* nẹp giữa hai cạnh bên */}
        {[38, 562].map((x) => (
          <g key={x} transform={`translate(${x} 400)`}>
            <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill={g} />
            <path d="M0 -60 V-14 M0 14 V60" stroke={g} strokeWidth="3" />
          </g>
        ))}
      </g>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 8. SANTORINI – mái vòm xanh & vòm cửa trắng                         */
/* ------------------------------------------------------------------ */
export const SantoriniArt: React.FC<MotifProps> = ({ c, uid }) => {
  const white = lighten(c.ground, 0.7);
  const shade = mix(c.ground, c.ink, 0.12);
  const blue = c.ink;
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.ground} />
          <stop offset="0.55" stopColor={lighten(c.ground, 0.5)} />
          <stop offset="1" stopColor={white} />
        </linearGradient>
        <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(blue, 0.15)} />
          <stop offset="1" stopColor={darken(blue, 0.15)} />
        </linearGradient>
        <clipPath id={`${uid}-window`}>
          <path d="M44 780 V250 A256 256 0 0 1 556 250 V780 Z" />
        </clipPath>
      </defs>
      {/* tường trắng ngoài khung cửa vòm */}
      <rect width="600" height="800" fill={white} />
      <g clipPath={`url(#${uid}-window)`}>
        <rect width="600" height="800" fill={`url(#${uid}-sky)`} />
        {/* mặt trời */}
        <circle cx="468" cy="626" r="38" fill={c.metal} opacity="0.9" />
        {/* biển */}
        <rect x="0" y="626" width="600" height="180" fill={`url(#${uid}-sea)`} />
        <g stroke={white} strokeWidth="1.2" opacity="0.5" strokeLinecap="round">
          <path d="M420 646 H520 M440 660 H500 M200 650 H260" />
        </g>
        {/* làng trắng – mái vòm xanh */}
        <g transform="translate(0 46)">
          <rect x="30" y="600" width="130" height="200" fill={white} />
          <rect x="30" y="600" width="130" height="200" fill="none" stroke={shade} strokeWidth="1" />
          <path d="M60 600 A35 35 0 0 1 130 600 Z" fill={blue} />
          <rect x="91" y="548" width="8" height="18" fill={white} />
          <path d="M95 540 V552 M89 546 H101" stroke={white} strokeWidth="2.4" />
          <path d="M66 700 V666 A14 14 0 0 1 94 666 V700 Z" fill={blue} />
          <rect x="112" y="660" width="26" height="26" fill={blue} />

          <rect x="148" y="660" width="150" height="140" fill={white} stroke={shade} strokeWidth="1" />
          <path d="M176 740 V712 A16 16 0 0 1 208 712 V740 Z" fill={blue} />
          <path d="M236 740 V712 A16 16 0 0 1 268 712 V740 Z" fill={blue} />

          <rect x="300" y="630" width="120" height="170" fill={white} stroke={shade} strokeWidth="1" />
          <path d="M318 630 A42 42 0 0 1 402 630 Z" fill={blue} />
          <path d="M342 720 V690 A18 18 0 0 1 378 690 V720 Z" fill={blue} />

          <rect x="420" y="680" width="160" height="120" fill={white} stroke={shade} strokeWidth="1" />
          <path d="M446 740 V716 A14 14 0 0 1 474 716 V740 Z" fill={blue} />
          <rect x="500" y="706" width="50" height="34" fill={blue} />
          {/* bậc thang */}
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${150 + i * 18} ${800 - i * 12} h20`} stroke={shade} strokeWidth="2" />
          ))}
          {/* hoa giấy */}
          {[[150, 650], [162, 640], [140, 662], [172, 652], [418, 668], [430, 676], [410, 680]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={6 + (i % 3)} fill={c.soft} opacity="0.9" />
          ))}
        </g>
      </g>
      {/* viền cửa vòm */}
      <path d="M44 780 V250 A256 256 0 0 1 556 250 V780" fill="none" stroke={blue} strokeWidth="3" />
      <path d="M30 790 V250 A270 270 0 0 1 570 250 V790" fill="none" stroke={c.metal} strokeWidth="1" />
    </>
  );
};
