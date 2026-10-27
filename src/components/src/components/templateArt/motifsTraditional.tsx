// Nhóm 1 (Truyền thống – Song Hỷ, Long Phụng) và nhóm 5 (Cổ phục – Nhật Bình, Bạch Sứ).
// Toàn bộ là minh họa vector vẽ mới cho THIEPONL.
import React from 'react';
import { SONG_HY_PATH } from './songHyGlyph';
import { spiral, lighten, darken, mix } from './artUtils';
import type { MotifProps } from './motifTypes';

/* ------------------------------------------------------------------ */
/* Họa tiết dùng chung                                                 */
/* ------------------------------------------------------------------ */

/** Tường vân (mây cuộn) – nét line-art, rộng ~120, cao ~50 trong toạ độ cục bộ. */
export const Cloud: React.FC<{ x: number; y: number; s?: number; flip?: boolean; stroke: string; sw?: number; fill?: string }> = ({
  x,
  y,
  s = 1,
  flip = false,
  stroke,
  sw = 2,
  fill = 'none',
}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} fill="none" stroke={stroke} strokeWidth={sw / s} strokeLinecap="round">
    <path
      d="M-60 22 C-44 22 -44 6 -28 6 C-14 6 -12 22 2 22 C14 22 16 10 28 10 C40 10 42 22 60 22"
      fill={fill}
    />
    <path d={spiral(-28, -6, 13, 1.25, Math.PI / 2, 1)} />
    <path d={spiral(10, -4, 10, 1.25, Math.PI / 2, -1)} />
    <path d={spiral(36, 2, 7, 1.15, Math.PI / 2, 1)} />
    <path d="M-60 22 C-66 22 -70 16 -68 10" />
  </g>
);

/** Góc khung kiểu cung đình: nẹp chữ L + cuốn xoắn. Vẽ cho góc trên-trái, lật bằng transform. */
const CornerScroll: React.FC<{ stroke: string; sw?: number }> = ({ stroke, sw = 2 }) => (
  <g fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
    <path d="M0 92 V0 H92" />
    <path d="M10 70 V10 H70" strokeWidth={sw * 0.6} />
    <path d={spiral(30, 30, 16, 1.4, Math.PI, 1)} />
    <path d="M30 14 C46 14 56 20 62 32" strokeWidth={sw * 0.7} />
    <path d="M14 30 C14 46 20 56 32 62" strokeWidth={sw * 0.7} />
    <circle cx="80" cy="10" r="2.4" fill={stroke} stroke="none" />
    <circle cx="10" cy="80" r="2.4" fill={stroke} stroke="none" />
  </g>
);

const corners = (node: React.ReactNode, inset = 40) => (
  <>
    <g transform={`translate(${inset} ${inset})`}>{node}</g>
    <g transform={`translate(${600 - inset} ${inset}) scale(-1 1)`}>{node}</g>
    <g transform={`translate(${inset} ${800 - inset}) scale(1 -1)`}>{node}</g>
    <g transform={`translate(${600 - inset} ${800 - inset}) scale(-1 -1)`}>{node}</g>
  </>
);

export const XiGlyph: React.FC<{ cx: number; cy: number; size: number; fill: string }> = ({ cx, cy, size, fill }) => (
  <path
    d={SONG_HY_PATH}
    fill={fill}
    transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 1000})`}
  />
);

/** Hồi văn (key-fret) – pattern dùng làm dải viền. */
const keyFretPattern = (id: string, stroke: string, size = 22) => (
  <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
    <path
      d={`M1 ${size - 1} V1 H${size - 1} V${size * 0.78} H${size * 0.3} V${size * 0.32} H${size * 0.7} V${size * 0.58}`}
      fill="none"
      stroke={stroke}
      strokeWidth={size * 0.09}
      strokeLinecap="square"
    />
  </pattern>
);

/** Gấm hoa: hoa thị 4 cánh + chấm – dùng ở độ mờ thấp. */
const brocadePattern = (id: string, stroke: string) => (
  <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
    <g fill="none" stroke={stroke} strokeWidth="1.1">
      <path d="M28 18 C32 22 32 26 28 28 C24 26 24 22 28 18 Z" />
      <path d="M28 38 C32 34 32 30 28 28 C24 30 24 34 28 38 Z" />
      <path d="M18 28 C22 24 26 24 28 28 C26 32 22 32 18 28 Z" />
      <path d="M38 28 C34 24 30 24 28 28 C30 32 34 32 38 28 Z" />
      <path d="M0 0 L6 6 M56 0 L50 6 M0 56 L6 50 M56 56 L50 50" />
    </g>
    <circle cx="0" cy="0" r="2" fill={stroke} />
    <circle cx="56" cy="0" r="2" fill={stroke} />
    <circle cx="0" cy="56" r="2" fill={stroke} />
    <circle cx="56" cy="56" r="2" fill={stroke} />
  </pattern>
);

const MetalDefs: React.FC<{ uid: string; metal: string; ground: string }> = ({ uid, metal, ground }) => (
  <>
    <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={darken(metal, 0.18)} />
      <stop offset="0.35" stopColor={lighten(metal, 0.28)} />
      <stop offset="0.55" stopColor={metal} />
      <stop offset="1" stopColor={darken(metal, 0.22)} />
    </linearGradient>
    <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stopColor={lighten(ground, 0.1)} />
      <stop offset="0.65" stopColor={ground} />
      <stop offset="1" stopColor={darken(ground, 0.22)} />
    </radialGradient>
  </>
);

/* ------------------------------------------------------------------ */
/* 1. SONG HỶ                                                          */
/* ------------------------------------------------------------------ */
export const SongHyArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const metal = `url(#${uid}-metal)`;
  const v2 = variant === 'v2';
  return (
    <>
      <defs>
        <MetalDefs uid={uid} metal={c.metal} ground={c.ground} />
        {brocadePattern(`${uid}-brocade`, c.metal)}
        {keyFretPattern(`${uid}-fret`, c.metal, 18)}
      </defs>
      <rect width="600" height="800" fill={`url(#${uid}-glow)`} />
      <rect width="600" height="800" fill={`url(#${uid}-brocade)`} opacity={v2 ? 0.07 : 0.1} />

      {/* Khung */}
      <rect x="22" y="22" width="556" height="756" fill="none" stroke={metal} strokeWidth="2.4" />
      {v2 ? (
        <>
          <rect x="32" y="32" width="536" height="18" fill={`url(#${uid}-fret)`} />
          <rect x="32" y="750" width="536" height="18" fill={`url(#${uid}-fret)`} />
          <rect x="44" y="60" width="512" height="680" fill="none" stroke={metal} strokeWidth="0.9" />
        </>
      ) : (
        <>
          <rect x="34" y="34" width="532" height="732" fill="none" stroke={metal} strokeWidth="0.9" />
          {corners(<CornerScroll stroke={c.metal} sw={2} />, 46)}
        </>
      )}

      {v2 ? (
        <g>
          {/* Song Hỷ V2: chữ Hỷ lớn trong ô trám, hai bên mây cuộn */}
          <rect x="230" y="98" width="140" height="140" transform="rotate(45 300 168)" fill="none" stroke={metal} strokeWidth="1.6" />
          <rect x="241" y="109" width="118" height="118" transform="rotate(45 300 168)" fill={c.metal} opacity="0.12" />
          <XiGlyph cx={300} cy={170} size={104} fill={metal} />
          <Cloud x={130} y={168} s={0.9} stroke={c.metal} sw={1.8} />
          <Cloud x={470} y={168} s={0.9} flip stroke={c.metal} sw={1.8} />
        </g>
      ) : (
        <g>
          {/* Song Hỷ: huy chương tròn ánh kim, chữ Hỷ khắc âm */}
          <circle cx="300" cy="176" r="80" fill="none" stroke={metal} strokeWidth="1.2" strokeDasharray="1.5 5" strokeLinecap="round" />
          <circle cx="300" cy="176" r="68" fill={metal} />
          <circle cx="300" cy="176" r="61" fill="none" stroke={c.ground} strokeWidth="1.4" opacity="0.6" />
          <XiGlyph cx={300} cy={178} size={88} fill={c.ground} />
          <path d="M96 176 H206 M394 176 H504" stroke={metal} strokeWidth="1.2" />
          <rect x="88" y="171" width="10" height="10" transform="rotate(45 93 176)" fill={metal} />
          <rect x="502" y="171" width="10" height="10" transform="rotate(45 507 176)" fill={metal} />
        </g>
      )}

      <Cloud x={300} y={712} s={1} stroke={c.metal} sw={1.8} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 2. LONG PHỤNG                                                       */
/* ------------------------------------------------------------------ */

/** Rồng uốn quanh cung tròn bên trái huy chương. */
const Dragon: React.FC<{ cx: number; cy: number; R: number; stroke: string; ground: string }> = ({ cx, cy, R, stroke, ground }) => {
  const a0 = (110 * Math.PI) / 180; // đuôi (dưới-trái)
  const a1 = (238 * Math.PI) / 180; // đầu (trên-trái)
  const N = 26;
  const pts: { x: number; y: number; a: number; w: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = a0 + (a1 - a0) * t;
    const wobble = Math.sin(t * Math.PI * 3) * 9;
    const r = R + wobble;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), a, w: 4 + 9 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.9) });
  }
  const body = 'M' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L');
  const head = pts[N];
  const headAngle = (head.a * 180) / Math.PI + 90; // tiếp tuyến
  return (
    <g fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round">
      {/* thân */}
      <path d={body} strokeWidth="17" />
      <path d={body} strokeWidth="11" stroke={ground} />
      {/* vảy: các cung nhỏ */}
      {pts.slice(2, N - 1).map((p, i) => {
        const nx = Math.cos(p.a);
        const ny = Math.sin(p.a);
        const tx = -ny;
        const ty = nx;
        const s = 4.2;
        return (
          <path
            key={`sc-${i}`}
            d={`M${(p.x - tx * s).toFixed(1)},${(p.y - ty * s).toFixed(1)} Q${(p.x + nx * 3).toFixed(1)},${(p.y + ny * 3).toFixed(1)} ${(p.x + tx * s).toFixed(1)},${(p.y + ty * s).toFixed(1)}`}
            strokeWidth="1.3"
          />
        );
      })}
      {/* vây lưng phía ngoài */}
      {pts.slice(3, N - 2).filter((_, i) => i % 3 === 0).map((p, i) => {
        const nx = Math.cos(p.a);
        const ny = Math.sin(p.a);
        const tx = -ny;
        const ty = nx;
        const bx = p.x + nx * 8;
        const by = p.y + ny * 8;
        return (
          <path
            key={`fin-${i}`}
            d={`M${(bx - tx * 5).toFixed(1)},${(by - ty * 5).toFixed(1)} Q${(bx + nx * 14 + tx * 4).toFixed(1)},${(by + ny * 14 + ty * 4).toFixed(1)} ${(bx + nx * 16 + tx * 9).toFixed(1)},${(by + ny * 16 + ty * 9).toFixed(1)}`}
            strokeWidth="1.6"
          />
        );
      })}
      {/* chân: 2 móng cuộn */}
      {[8, 18].map((k) => {
        const p = pts[k];
        const nx = Math.cos(p.a);
        const ny = Math.sin(p.a);
        const fx = p.x - nx * 24;
        const fy = p.y - ny * 24;
        return (
          <g key={`leg-${k}`}>
            <path d={`M${(p.x - nx * 6).toFixed(1)},${(p.y - ny * 6).toFixed(1)} Q${(fx + ny * 10).toFixed(1)},${(fy - nx * 10).toFixed(1)} ${fx.toFixed(1)},${fy.toFixed(1)}`} strokeWidth="3" />
            <path d={spiral(fx, fy, 6, 1, p.a, 1, 14)} strokeWidth="1.6" />
          </g>
        );
      })}
      {/* đuôi lửa */}
      <g transform={`translate(${pts[0].x} ${pts[0].y}) rotate(${(a0 * 180) / Math.PI - 60})`}>
        <path d="M0 0 C-10 14 -6 30 8 40" strokeWidth="2" />
        <path d="M0 0 C6 16 18 22 30 22" strokeWidth="2" />
        <path d={spiral(8, 40, 6, 1, 0, -1, 14)} strokeWidth="1.4" />
      </g>
      {/* đầu rồng */}
      <g transform={`translate(${head.x} ${head.y}) rotate(${headAngle - 90}) scale(1.45)`}>
        <path d="M-10 -6 C2 -16 22 -16 34 -8 C40 -4 44 2 40 6 C30 8 20 6 12 10 C4 14 -6 12 -10 6 Z" fill={ground} strokeWidth="2.2" />
        <path d="M12 10 C20 14 32 16 38 14" strokeWidth="1.8" />
        <circle cx="16" cy="-4" r="2.6" fill={stroke} stroke="none" />
        <path d="M2 -12 C-6 -26 -18 -32 -30 -30" strokeWidth="2" />
        <path d="M8 -14 C4 -30 -4 -40 -16 -44" strokeWidth="1.6" />
        <path d="M40 4 C54 6 62 -4 58 -14" strokeWidth="1.3" />
        <path d={spiral(58, -14, 5, 1, Math.PI, 1, 12)} strokeWidth="1.2" />
        <path d="M36 12 C46 22 44 34 34 36" strokeWidth="1.3" />
        <path d="M-8 8 C-16 16 -26 16 -32 10" strokeWidth="1.6" />
      </g>
    </g>
  );
};

/** Phượng hoàng ở cung tròn bên phải, đuôi lông vũ buông dài. */
const Phoenix: React.FC<{ cx: number; cy: number; R: number; stroke: string; ground: string }> = ({ cx, cy, R, stroke, ground }) => {
  const headA = (-58 * Math.PI) / 180;
  const hx = cx + R * Math.cos(headA);
  const hy = cy + R * Math.sin(headA);
  const neck = `M${hx},${hy} C${cx + R * 1.05},${cy - R * 0.85} ${cx + R * 1.15},${cy - R * 0.2} ${cx + R * 0.95},${cy + R * 0.25}`;
  const tails = [0, 1, 2, 3, 4].map((i) => {
    const sx = cx + R * 0.95;
    const sy = cy + R * 0.25;
    const ex = cx + R * (0.15 + i * 0.13);
    const ey = cy + R * (1.25 + i * 0.07);
    const c1x = sx + 40 + i * 6;
    const c1y = sy + 50;
    const c2x = ex + 70 - i * 6;
    const c2y = ey - 10;
    return { d: `M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`, ex, ey, i };
  });
  return (
    <g fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round">
      {/* cổ & thân */}
      <path d={neck} strokeWidth="9" />
      <path d={neck} strokeWidth="4.5" stroke={ground} />
      {/* cánh: lông vũ xòe ra ngoài */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const bx = cx + R * 1.02;
        const by = cy - R * 0.32 + i * 9;
        const len = 46 + i * 6;
        const ang = -38 + i * 15;
        const r = (ang * Math.PI) / 180;
        const ex = bx + len * Math.cos(r);
        const ey = by + len * Math.sin(r);
        return (
          <path key={`w-${i}`} d={`M${bx},${by} Q${(bx + ex) / 2 + 6},${(by + ey) / 2 - 12} ${ex},${ey}`} strokeWidth={i === 0 ? 2.2 : 1.5} />
        );
      })}
      {/* đuôi */}
      {tails.map((t) => (
        <g key={`t-${t.i}`}>
          <path d={t.d} strokeWidth={2.4 - t.i * 0.25} />
          <ellipse cx={t.ex} cy={t.ey} rx="9" ry="5.5" transform={`rotate(-20 ${t.ex} ${t.ey})`} strokeWidth="1.5" />
          <circle cx={t.ex} cy={t.ey} r="2.4" fill={stroke} stroke="none" />
        </g>
      ))}
      {/* đầu, mỏ, mào */}
      <g transform={`translate(${hx} ${hy}) scale(1.35)`}>
        <path d="M0 0 C-6 -10 -18 -14 -28 -8 L-36 -6 L-27 -1 C-18 4 -6 6 0 0 Z" fill={ground} strokeWidth="2" />
        <circle cx="-16" cy="-6" r="2.2" fill={stroke} stroke="none" />
        <path d="M-8 -10 C-6 -26 4 -34 16 -34" strokeWidth="1.6" />
        <path d="M-12 -11 C-14 -28 -8 -40 2 -46" strokeWidth="1.4" />
        <path d="M-16 -11 C-22 -24 -22 -34 -16 -40" strokeWidth="1.2" />
        <circle cx="16" cy="-34" r="2.4" fill={stroke} stroke="none" />
        <circle cx="2" cy="-46" r="2.4" fill={stroke} stroke="none" />
        <circle cx="-16" cy="-40" r="2" fill={stroke} stroke="none" />
        <path d="M-20 2 C-24 12 -20 22 -12 26" strokeWidth="1.3" />
      </g>
    </g>
  );
};

export const LongPhungArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const metal = `url(#${uid}-metal)`;
  const cx = 300;
  const cy = 236;
  const R = 150;
  const brocade = variant !== 'minimal';
  return (
    <>
      <defs>
        <MetalDefs uid={uid} metal={c.metal} ground={c.ground} />
        {brocadePattern(`${uid}-brocade`, c.metal)}
      </defs>
      <rect width="600" height="800" fill={`url(#${uid}-glow)`} />
      {brocade && <rect width="600" height="800" fill={`url(#${uid}-brocade)`} opacity="0.06" />}
      <rect x="20" y="20" width="560" height="760" fill="none" stroke={metal} strokeWidth="2" />
      <rect x="30" y="30" width="540" height="740" fill="none" stroke={metal} strokeWidth="0.8" />

      <g transform={`translate(${cx} 206) scale(0.8) translate(${-cx} ${-cy})`}>
      {/* Huy chương trung tâm */}
      <circle cx={cx} cy={cy} r="74" fill="none" stroke={metal} strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r="66" fill="none" stroke={metal} strokeWidth="0.8" strokeDasharray="2 4" />
      <XiGlyph cx={cx} cy={cy + 2} size={84} fill={metal} />

      <g stroke={metal}>
        <Dragon cx={cx} cy={cy} R={R * 0.92} stroke={metal} ground={c.ground} />
        <Phoenix cx={cx} cy={cy} R={R * 0.86} stroke={metal} ground={c.ground} />
      </g>

      {/* Ngọc lửa giữa rồng và phụng */}
      <g transform={`translate(${cx} ${cy - R - 22})`} fill="none" stroke={metal} strokeLinecap="round">
        <circle r="9" fill={metal} stroke="none" />
        <path d="M-12 -4 C-18 -16 -8 -24 0 -30 C2 -22 10 -20 12 -10" strokeWidth="1.6" />
        <path d="M14 2 C22 0 26 -8 24 -14" strokeWidth="1.3" />
        <path d="M-14 4 C-22 2 -26 -6 -24 -12" strokeWidth="1.3" />
      </g>
      </g>

      <Cloud x={104} y={72} s={0.55} stroke={c.metal} sw={1.3} />
      <Cloud x={496} y={72} s={0.55} flip stroke={c.metal} sw={1.3} />
      <Cloud x={300} y={752} s={0.6} stroke={c.metal} sw={1.3} />
      <path d="M150 392 H450" stroke={metal} strokeWidth="0.8" />
      <rect x="295" y="387" width="10" height="10" transform="rotate(45 300 392)" fill={metal} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 9. BẠCH SỨ (gốm lam trắng)                                          */
/* ------------------------------------------------------------------ */
const Peony: React.FC<{ x: number; y: number; s: number; ink: string; rot?: number }> = ({ x, y, s, ink, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {[0, 72, 144, 216, 288].map((a, i) => (
      <path
        key={`o-${i}`}
        d="M0 0 C-22 -12 -26 -40 -6 -50 C0 -42 6 -42 10 -50 C28 -38 22 -12 0 0 Z"
        transform={`rotate(${a})`}
        fill={ink}
        opacity="0.45"
      />
    ))}
    {[36, 108, 180, 252, 324].map((a, i) => (
      <path
        key={`i-${i}`}
        d="M0 0 C-12 -8 -14 -26 -2 -32 C4 -26 10 -28 12 -24 C14 -14 8 -6 0 0 Z"
        transform={`rotate(${a})`}
        fill={ink}
        opacity="0.8"
      />
    ))}
    <circle r="6" fill={ink} />
    {[0, 1, 2].map((i) => (
      <path
        key={`lf-${i}`}
        d="M0 0 C16 -10 40 -8 54 6 C38 14 16 12 0 0 Z"
        transform={`rotate(${110 + i * 55}) translate(44 0)`}
        fill={ink}
        opacity="0.6"
      />
    ))}
  </g>
);

export const BachSuArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const ink = c.ink;
  const cx = 300;
  const cy = 338;
  const petals = 30;
  const v2 = variant === 'v2';
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-glaze`} cx="0.5" cy="0.42" r="0.8">
          <stop offset="0" stopColor={lighten(c.ground, 0.5)} />
          <stop offset="0.7" stopColor={c.ground} />
          <stop offset="1" stopColor={mix(c.ground, ink, 0.1)} />
        </radialGradient>
        {keyFretPattern(`${uid}-fret`, ink, 20)}
      </defs>
      <rect width="600" height="800" fill={`url(#${uid}-glaze)`} />

      {/* Dải hồi văn viền trên & dưới */}
      <rect x="26" y="26" width="548" height="748" fill="none" stroke={ink} strokeWidth="2.2" />
      <rect x="36" y="36" width="528" height="20" fill={`url(#${uid}-fret)`} />
      <rect x="36" y="744" width="528" height="20" fill={`url(#${uid}-fret)`} />
      <path d="M36 62 H564 M36 738 H564" stroke={ink} strokeWidth="1" />

      {/* Đĩa sứ trung tâm */}
      <circle cx={cx} cy={cy} r="232" fill="none" stroke={ink} strokeWidth="3" />
      <circle cx={cx} cy={cy} r="225" fill="none" stroke={ink} strokeWidth="0.8" />
      {/* dải cánh sen quanh vành – mũi cánh hướng ra ngoài */}
      {Array.from({ length: petals }).map((_, i) => (
        <g key={`p-${i}`} transform={`rotate(${(i / petals) * 360} ${cx} ${cy})`}>
          <path
            d={`M${cx - 15} ${cy - 186} C${cx - 15} ${cy - 204} ${cx - 6} ${cy - 216} ${cx} ${cy - 221} C${cx + 6} ${cy - 216} ${cx + 15} ${cy - 204} ${cx + 15} ${cy - 186} Z`}
            fill={ink}
            opacity={v2 ? 0.35 : 0.88}
          />
          <path
            d={`M${cx - 7} ${cy - 188} C${cx - 7} ${cy - 199} ${cx - 3} ${cy - 206} ${cx} ${cy - 209} C${cx + 3} ${cy - 206} ${cx + 7} ${cy - 199} ${cx + 7} ${cy - 188} Z`}
            fill={c.ground}
          />
        </g>
      ))}
      <circle cx={cx} cy={cy} r="183" fill="none" stroke={ink} strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r="176" fill={lighten(c.ground, 0.4)} stroke={ink} strokeWidth="0.6" strokeDasharray="1 5" />

      {/* Hoa mẫu đơn vẽ men lam ở góc */}
      <Peony x={82} y={112} s={0.5} ink={ink} rot={-20} />
      {!v2 && <Peony x={518} y={112} s={0.4} ink={ink} rot={30} />}
      {!v2 && <Peony x={84} y={680} s={0.46} ink={ink} rot={200} />}
      <Peony x={516} y={680} s={0.46} ink={ink} rot={160} />

      {/* Dải sóng nước dưới đĩa */}
      <g fill="none" stroke={ink} strokeWidth="1.2" opacity="0.75">
        {[0, 1].map((r) => (
          <path
            key={`w-${r}`}
            d={`M153 ${590 + r * 10} ` + Array.from({ length: 7 }).map(() => 'q21 -12 42 0').join(' ')}
          />
        ))}
      </g>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 10. NHẬT BÌNH (cổ phục cung đình triều Nguyễn)                      */
/* ------------------------------------------------------------------ */
export const NhatBinhArt: React.FC<MotifProps> = ({ c, uid }) => {
  const metal = `url(#${uid}-metal)`;
  // Hai vạt cổ vuông buông song song phía trước – đặc trưng áo Nhật Bình.
  const panelL = 'M120 0 L206 0 L206 290 L120 290 Z';
  const panelR = 'M394 0 L480 0 L480 290 L394 290 Z';
  return (
    <>
      <defs>
        <MetalDefs uid={uid} metal={c.metal} ground={c.ground} />
        {brocadePattern(`${uid}-brocade`, c.metal)}
        <clipPath id={`${uid}-panels`}>
          <path d={panelL} />
          <path d={panelR} />
        </clipPath>
        <pattern id={`${uid}-emb`} width="45" height="52" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={c.metal} strokeWidth="1.2" strokeLinecap="round">
            <circle cx="22.5" cy="20" r="5" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse key={a} cx="22.5" cy="10" rx="2.6" ry="5" transform={`rotate(${a} 22.5 20)`} />
            ))}
            <path d="M6 44 C12 38 18 38 22.5 44 C27 38 33 38 39 44" />
          </g>
        </pattern>
      </defs>
      <rect width="600" height="800" fill={`url(#${uid}-glow)`} />
      <rect width="600" height="800" fill={`url(#${uid}-brocade)`} opacity="0.07" />

      {/* Vòng cổ áo */}
      <path d="M206 0 C212 70 388 70 394 0" fill="none" stroke={metal} strokeWidth="3" />
      <path d="M222 0 C230 46 370 46 378 0" fill={darken(c.ground, 0.2)} stroke={metal} strokeWidth="1.2" />

      {/* Hai vạt cổ thêu */}
      <g>
        <path d={panelL} fill={c.soft || darken(c.ground, 0.15)} />
        <path d={panelR} fill={c.soft || darken(c.ground, 0.15)} />
        <rect x="120" y="0" width="360" height="290" fill={`url(#${uid}-emb)`} clipPath={`url(#${uid}-panels)`} opacity="0.85" />
        <path d={panelL} fill="none" stroke={metal} strokeWidth="3" />
        <path d={panelR} fill="none" stroke={metal} strokeWidth="3" />
        <path d="M128 0 V282 H198 V0 M402 0 V282 H472 V0" fill="none" stroke={metal} strokeWidth="1" />
        {/* chân vạt: viền cong & tua */}
        {[163, 437].map((x) => (
          <g key={x}>
            <path d={`M${x - 43} 290 Q${x} 322 ${x + 43} 290`} fill={c.soft || darken(c.ground, 0.15)} stroke={metal} strokeWidth="2.4" />
            {Array.from({ length: 7 }).map((_, i) => (
              <path key={i} d={`M${x - 24 + i * 8} ${310 + (i === 3 ? 2 : 0)} v${22 - Math.abs(3 - i) * 3}`} stroke={metal} strokeWidth="1.3" />
            ))}
          </g>
        ))}
      </g>

      {/* Viền áo hai bên vai */}
      <path d="M0 110 C60 84 100 40 120 0" fill="none" stroke={metal} strokeWidth="2" />
      <path d="M600 110 C540 84 500 40 480 0" fill="none" stroke={metal} strokeWidth="2" />
      <path d="M0 126 C66 98 108 52 132 0" fill="none" stroke={metal} strokeWidth="0.8" />
      <path d="M600 126 C534 98 492 52 468 0" fill="none" stroke={metal} strokeWidth="0.8" />

      {/* Khung chữ giữa hai vạt */}
      <rect x="24" y="24" width="552" height="752" fill="none" stroke={metal} strokeWidth="1.4" />
      <XiGlyph cx={300} cy={160} size={64} fill={metal} />
      <circle cx="300" cy="160" r="50" fill="none" stroke={metal} strokeWidth="1" strokeDasharray="1.5 4" />
      <Cloud x={300} y={752} s={0.55} stroke={c.metal} sw={1.3} />
    </>
  );
};
