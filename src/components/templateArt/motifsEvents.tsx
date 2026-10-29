/**
 * Minh họa SVG cho các loại thiệp sự kiện (viewBox 600 × 800).
 * Vùng chữ được chừa trống theo MOTIF_LAYOUT tương ứng.
 */
import React from 'react';
import type { MotifProps } from './motifTypes';
import { lighten, darken, mix } from './artUtils';

/* ---------- tiện ích nhỏ ---------- */
const Frame: React.FC<{ color: string; inset?: number; r?: number; double?: boolean; opacity?: number }> = ({
  color,
  inset = 26,
  r = 18,
  double = true,
  opacity = 0.9,
}) => (
  <g fill="none" stroke={color} opacity={opacity}>
    <rect x={inset} y={inset} width={600 - inset * 2} height={800 - inset * 2} rx={r} strokeWidth="2.4" />
    {double && <rect x={inset + 10} y={inset + 10} width={600 - (inset + 10) * 2} height={800 - (inset + 10) * 2} rx={r - 6} strokeWidth="1" />}
  </g>
);

const Star: React.FC<{ x: number; y: number; r: number; fill: string; opacity?: number }> = ({ x, y, r, fill, opacity = 1 }) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} opacity={opacity} />;
};

const Sparkle: React.FC<{ x: number; y: number; s: number; fill: string; opacity?: number }> = ({ x, y, s, fill, opacity = 1 }) => (
  <path
    d={`M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s}Z`}
    fill={fill}
    opacity={opacity}
  />
);

/** Hạt giấy màu tất định (không dùng Math.random để render ổn định). */
function confettiPieces(n: number, seed: number, area: { x: number; y: number; w: number; h: number }) {
  const out: { x: number; y: number; w: number; h: number; rot: number; k: number }[] = [];
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < n; i++) {
    out.push({
      x: area.x + rnd() * area.w,
      y: area.y + rnd() * area.h,
      w: 6 + rnd() * 10,
      h: 3 + rnd() * 5,
      rot: rnd() * 180,
      k: Math.floor(rnd() * 4),
    });
  }
  return out;
}

/* ================= SINH NHẬT ================= */

/** Chùm bóng bay hai góc trên + dây ruy băng. */
export const BalloonsArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const pastel = variant === 'pastel';
  const cols = [c.ink, c.metal, c.soft, pastel ? lighten(c.ink, 0.35) : darken(c.soft, 0.1)];
  const Balloon = ({ x, y, r, col, tilt = 0 }: { x: number; y: number; r: number; col: string; tilt?: number }) => (
    <g transform={`rotate(${tilt} ${x} ${y + r * 1.2})`}>
      <path
        d={`M${x} ${y + r * 1.25} C${x - 4} ${y + r * 1.7} ${x + 8} ${y + r * 2.2} ${x} ${y + r * 3.1}`}
        stroke={darken(col, 0.25)}
        strokeWidth="1.4"
        fill="none"
      />
      <ellipse cx={x} cy={y} rx={r} ry={r * 1.18} fill={`url(#${uid}-b-${col.replace('#', '')})`} />
      <path d={`M${x - 6} ${y + r * 1.16} L${x + 6} ${y + r * 1.16} L${x} ${y + r * 1.3}Z`} fill={darken(col, 0.15)} />
      <ellipse cx={x - r * 0.35} cy={y - r * 0.45} rx={r * 0.18} ry={r * 0.3} fill="#fff" opacity="0.45" transform={`rotate(-25 ${x - r * 0.35} ${y - r * 0.45})`} />
    </g>
  );
  return (
    <>
      <defs>
        {cols.map((col) => (
          <radialGradient key={col} id={`${uid}-b-${col.replace('#', '')}`} cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor={lighten(col, 0.35)} />
            <stop offset="1" stopColor={col} />
          </radialGradient>
        ))}
      </defs>
      <rect width="600" height="800" fill={c.ground} />
      {pastel && <rect width="600" height="800" fill={lighten(c.soft, 0.6)} opacity="0.35" />}
      {/* bóng góc trái */}
      <Balloon x={88} y={120} r={46} col={cols[0]} tilt={-8} />
      <Balloon x={150} y={70} r={38} col={cols[1]} tilt={4} />
      <Balloon x={40} y={210} r={30} col={cols[2]} tilt={-14} />
      {/* bóng góc phải */}
      <Balloon x={512} y={118} r={46} col={cols[2]} tilt={8} />
      <Balloon x={448} y={66} r={36} col={cols[0]} tilt={-4} />
      <Balloon x={562} y={212} r={30} col={cols[3]} tilt={12} />
      {/* bóng nhỏ dưới */}
      <Balloon x={70} y={640} r={26} col={cols[1]} tilt={-6} />
      <Balloon x={532} y={650} r={24} col={cols[0]} tilt={6} />
      {/* cờ đuôi nheo */}
      <path d="M150 200 Q300 250 450 200" stroke={c.metal} strokeWidth="1.6" fill="none" />
      {Array.from({ length: 9 }).map((_, i) => {
        const t = (i + 0.5) / 9;
        const x = 150 + t * 300;
        const y = 200 + Math.sin(Math.PI * t) * 25;
        return <path key={i} d={`M${x - 13} ${y} L${x + 13} ${y} L${x} ${y + 26}Z`} fill={cols[i % 3]} opacity="0.92" />;
      })}
      {[...Array(14)].map((_, i) => (
        <circle key={i} cx={60 + ((i * 97) % 480)} cy={280 + ((i * 53) % 420)} r={i % 3 === 0 ? 3 : 2} fill={cols[i % 4]} opacity="0.5" />
      ))}
      <Frame color={c.metal} inset={20} opacity={0.5} double={false} />
    </>
  );
};

/** Bánh kem nhiều tầng phía dưới, nến sáng & ánh lấp lánh. */
export const CakeArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const tiers = variant === 'mini' ? 2 : 3;
  const baseY = 760;
  const widths = [300, 230, 160];
  const heights = [68, 60, 52];
  let y = baseY;
  const layers = widths.slice(0, tiers).map((w, i) => {
    const h = heights[i];
    y -= h;
    return { x: 300 - w / 2, y, w, h, i };
  });
  const topY = layers[layers.length - 1].y;
  const topW = layers[layers.length - 1].w;
  const candles = variant === 'mini' ? 3 : 5;
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-cake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(c.soft, 0.25)} />
          <stop offset="1" stopColor={c.soft} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={c.metal} stopOpacity="0.55" />
          <stop offset="1" stopColor={c.metal} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="800" fill={c.ground} />
      <Frame color={c.metal} />
      {/* đĩa */}
      <ellipse cx="300" cy={baseY + 6} rx="190" ry="14" fill={darken(c.ground, 0.12)} opacity="0.4" />
      <rect x="110" y={baseY - 4} width="380" height="10" rx="5" fill={c.metal} />
      {layers.map((l) => (
        <g key={l.i}>
          <rect x={l.x} y={l.y} width={l.w} height={l.h} rx="10" fill={`url(#${uid}-cake)`} />
          {/* kem chảy */}
          <path
            d={`M${l.x} ${l.y + 14} ${Array.from({ length: 8 })
              .map((_, k) => {
                const sx = l.x + (l.w / 8) * k;
                return `Q${sx + l.w / 16} ${l.y + 30 + (k % 2) * 8} ${sx + l.w / 8} ${l.y + 14}`;
              })
              .join(' ')} L${l.x + l.w} ${l.y + 6} Q${l.x + l.w} ${l.y} ${l.x + l.w - 10} ${l.y} L${l.x + 10} ${l.y} Q${l.x} ${l.y} ${l.x} ${l.y + 6}Z`}
            fill={c.ink}
          />
          {Array.from({ length: Math.round(l.w / 30) }).map((_, k) => (
            <circle key={k} cx={l.x + 15 + k * 30} cy={l.y + l.h - 14} r="3.2" fill={c.metal} />
          ))}
        </g>
      ))}
      {/* nến */}
      {Array.from({ length: candles }).map((_, k) => {
        const cx = 300 - topW / 2 + 22 + ((topW - 44) / (candles - 1)) * k;
        return (
          <g key={k}>
            <circle cx={cx} cy={topY - 48} r="22" fill={`url(#${uid}-glow)`} />
            <rect x={cx - 4} y={topY - 34} width="8" height="34" rx="2" fill={k % 2 ? c.ink : lighten(c.ink, 0.4)} />
            <path d={`M${cx} ${topY - 58} Q${cx + 7} ${topY - 46} ${cx} ${topY - 38} Q${cx - 7} ${topY - 46} ${cx} ${topY - 58}Z`} fill={c.metal} />
          </g>
        );
      })}
      {[
        [90, 110, 14],
        [510, 140, 12],
        [120, 520, 9],
        [480, 500, 11],
        [300, 64, 10],
      ].map(([x, yy, s], i) => (
        <Sparkle key={i} x={x} y={yy} s={s} fill={c.metal} opacity={0.85} />
      ))}
    </>
  );
};

/** Pháo giấy rơi khắp thiệp + dải ruy băng cong. */
export const ConfettiArt: React.FC<MotifProps> = ({ c, variant }) => {
  const dark = variant === 'night';
  const cols = [c.ink, c.metal, c.soft, lighten(c.metal, 0.3)];
  const pieces = [
    ...confettiPieces(70, 7, { x: 30, y: 30, w: 540, h: 170 }),
    ...confettiPieces(55, 21, { x: 30, y: 620, w: 540, h: 150 }),
    ...confettiPieces(16, 3, { x: 30, y: 200, w: 70, h: 420 }),
    ...confettiPieces(16, 5, { x: 500, y: 200, w: 70, h: 420 }),
  ];
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      {dark && <rect width="600" height="800" fill={darken(c.ground, 0.2)} opacity="0.4" />}
      {pieces.map((p, i) =>
        p.k === 0 ? (
          <circle key={i} cx={p.x} cy={p.y} r={p.h * 0.7} fill={cols[i % 4]} opacity="0.9" />
        ) : p.k === 1 ? (
          <path key={i} d={`M${p.x} ${p.y} q6 -8 12 0 t12 0`} stroke={cols[i % 4]} strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="1.5" fill={cols[i % 4]} transform={`rotate(${p.rot} ${p.x} ${p.y})`} opacity="0.92" />
        )
      )}
      <path d="M-20 190 C120 120 220 260 360 170 S560 140 640 200" stroke={c.metal} strokeWidth="5" fill="none" opacity="0.85" />
      <path d="M-20 640 C140 700 260 580 400 660 S560 700 640 630" stroke={c.ink} strokeWidth="4" fill="none" opacity="0.7" />
      <Star x={300} y={96} r={22} fill={c.metal} />
      <Frame color={c.metal} inset={18} opacity={0.55} double={false} />
    </>
  );
};

/* ================= TÂN GIA ================= */

/** Ngôi nhà nhỏ có mái, cửa sổ sáng đèn, cây hai bên. */
export const HouseArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const night = variant === 'night';
  const modern = variant === 'modern';
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? darken(c.ground, 0.15) : lighten(c.ground, 0.1)} />
          <stop offset="1" stopColor={c.ground} />
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill={`url(#${uid}-sky)`} />
      {night ? (
        <>
          <circle cx="526" cy="84" r="24" fill={c.metal} />
          <circle cx="536" cy="77" r="21" fill={darken(c.ground, 0.15)} />
          {[
            [90, 90],
            [170, 150],
            [380, 70],
            [540, 210],
            [60, 230],
            [260, 60],
          ].map(([x, y], i) => (
            <Sparkle key={i} x={x} y={y} s={i % 2 ? 6 : 9} fill={c.metal} />
          ))}
        </>
      ) : (
        <>
          <circle cx="528" cy="82" r="26" fill={c.metal} opacity="0.35" />
          <path d="M60 330 q20 -26 48 -8 q24 -18 44 6 q20 2 18 18 h-120 q-8 -12 10 -16z" fill="#fff" opacity="0.7" />
        </>
      )}
      {/* đồi */}
      <path d="M0 640 Q150 590 300 620 T600 610 V800 H0Z" fill={c.soft} opacity="0.55" />
      <path d="M0 680 Q200 640 360 670 T600 660 V800 H0Z" fill={c.soft} />
      {/* nhà */}
      <g transform="translate(300 560)">
        {modern ? (
          <>
            <rect x="-120" y="-120" width="240" height="140" fill={c.ink} />
            <rect x="-140" y="-136" width="280" height="18" fill={darken(c.ink, 0.2)} />
            <rect x="-96" y="-92" width="70" height="56" fill={c.metal} opacity="0.9" />
            <rect x="26" y="-92" width="70" height="56" fill={c.metal} opacity="0.9" />
            <rect x="-22" y="-52" width="44" height="72" fill={darken(c.ink, 0.3)} />
          </>
        ) : (
          <>
            <rect x="-110" y="-110" width="220" height="130" fill={lighten(c.ink, 0.15)} />
            <path d="M-140 -104 L0 -210 L140 -104Z" fill={darken(c.ink, 0.15)} />
            <rect x="52" y="-200" width="26" height="54" fill={darken(c.ink, 0.3)} />
            <rect x="-86" y="-80" width="54" height="50" rx="4" fill={c.metal} />
            <rect x="32" y="-80" width="54" height="50" rx="4" fill={c.metal} />
            <path d="M-59 -80 V-30 M-86 -55 H-32 M59 -80 V-30 M32 -55 H86" stroke={lighten(c.ink, 0.15)} strokeWidth="3" />
            <path d="M-24 20 V-34 Q0 -56 24 -34 V20Z" fill={darken(c.ink, 0.35)} />
            <circle cx="14" cy="-8" r="3" fill={c.metal} />
            <circle cx="0" cy="-150" r="16" fill={c.metal} opacity="0.9" />
          </>
        )}
      </g>
      {/* cây */}
      {[
        [110, 600, 1],
        [490, 604, 0.9],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-5" y="-10" width="10" height="44" fill={darken(c.soft, 0.4)} />
          <circle cx="0" cy="-40" r="34" fill={darken(c.soft, 0.18)} />
          <circle cx="-20" cy="-22" r="22" fill={darken(c.soft, 0.1)} />
          <circle cx="20" cy="-24" r="24" fill={darken(c.soft, 0.25)} />
        </g>
      ))}
      <Frame color={c.metal} inset={20} opacity={0.6} />
    </>
  );
};

/** Chìa khóa vàng buộc nơ + lá monstera hai góc. */
export const KeysPlantArt: React.FC<MotifProps> = ({ c, variant }) => {
  const minimal = variant === 'minimal';
  const Leaf = ({ x, y, s, rot }: { x: number; y: number; s: number; rot: number }) => (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C40 -20 90 -10 110 30 C120 60 100 100 60 110 C20 120 -10 90 -10 50 C-12 30 -8 10 0 0Z" fill={c.soft} />
      <path d="M0 0 C40 30 70 60 70 110" stroke={darken(c.soft, 0.3)} strokeWidth="3" fill="none" />
      {[20, 45, 70].map((k) => (
        <path key={k} d={`M${k * 0.6} ${k * 0.5} L${k * 0.6 + 34} ${k * 0.5 - 10}`} stroke={c.ground} strokeWidth="5" />
      ))}
    </g>
  );
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      {!minimal && (
        <>
          <Leaf x={-20} y={40} s={1.3} rot={10} />
          <Leaf x={610} y={60} s={1.2} rot={110} />
          <Leaf x={-10} y={700} s={1.1} rot={-50} />
          <Leaf x={600} y={720} s={1.2} rot={-140} />
        </>
      )}
      {/* chìa khóa */}
      <g transform="translate(300 150) rotate(-18)">
        <circle cx="0" cy="0" r="34" fill="none" stroke={c.metal} strokeWidth="12" />
        <circle cx="0" cy="0" r="12" fill={c.metal} opacity="0.4" />
        <rect x="30" y="-7" width="120" height="14" rx="4" fill={c.metal} />
        <rect x="118" y="5" width="12" height="22" fill={c.metal} />
        <rect x="138" y="5" width="10" height="16" fill={c.metal} />
      </g>
      <g transform="translate(266 188)">
        <path d="M0 0 C-30 -26 -50 -4 -34 12 C-22 22 -8 10 0 0Z M0 0 C30 -26 50 -4 34 12 C22 22 8 10 0 0Z" fill={c.ink} />
        <path d="M0 0 L-16 46 M0 0 L14 48" stroke={c.ink} strokeWidth="5" strokeLinecap="round" />
        <circle r="7" fill={darken(c.ink, 0.2)} />
      </g>
      <Frame color={c.ink} inset={34} r={8} opacity={0.45} double={false} />
    </>
  );
};

/* ================= ĐẦY THÁNG / THÔI NÔI ================= */

/** Mây bồng bềnh, trăng khuyết & sao treo. */
export const BabyCloudArt: React.FC<MotifProps> = ({ c }) => {
  const Cloud = ({ x, y, s, o = 1 }: { x: number; y: number; s: number; o?: number }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <path d="M-60 20 Q-70 -10 -40 -14 Q-36 -44 -6 -40 Q12 -62 38 -40 Q66 -44 64 -12 Q86 -4 74 20Z" fill="#fff" />
    </g>
  );
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      {/* dây treo */}
      {[
        [150, 120, 'star'],
        [230, 80, 'moon'],
        [370, 90, 'star'],
        [450, 130, 'heart'],
      ].map(([x, len, kind], i) => (
        <g key={i}>
          <line x1={x as number} y1="0" x2={x as number} y2={len as number} stroke={c.metal} strokeWidth="1.5" />
          {kind === 'star' && <Star x={x as number} y={(len as number) + 18} r={18} fill={c.metal} />}
          {kind === 'heart' && (
            <path
              d={`M${x} ${(len as number) + 30} C${(x as number) - 30} ${(len as number) + 8} ${(x as number) - 14} ${(len as number) - 10} ${x} ${(len as number) + 6} C${(x as number) + 14} ${(len as number) - 10} ${(x as number) + 30} ${(len as number) + 8} ${x} ${(len as number) + 30}Z`}
              fill={c.ink}
            />
          )}
          {kind === 'moon' && (
            <g>
              <circle cx={x as number} cy={(len as number) + 26} r="26" fill={c.soft} />
              <circle cx={(x as number) + 12} cy={(len as number) + 18} r="22" fill={c.ground} />
            </g>
          )}
        </g>
      ))}
      <Cloud x={110} y={250} s={1.1} o={0.95} />
      <Cloud x={500} y={230} s={0.9} o={0.9} />
      <Cloud x={90} y={700} s={1.4} />
      <Cloud x={300} y={740} s={1.6} />
      <Cloud x={510} y={700} s={1.3} />
      {[
        [70, 380],
        [540, 400],
        [80, 560],
        [530, 560],
      ].map(([x, y], i) => (
        <Sparkle key={i} x={x} y={y} s={8} fill={c.metal} opacity={0.8} />
      ))}
      <Frame color={c.ink} inset={18} r={28} opacity={0.35} double={false} />
    </>
  );
};

/** Gấu bông ôm bóng + cờ đuôi nheo mềm mại. */
export const BabyBearArt: React.FC<MotifProps> = ({ c }) => {
  const fur = c.soft;
  const furD = darken(c.soft, 0.18);
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      {/* cờ */}
      <path d="M40 60 Q300 150 560 60" stroke={c.metal} strokeWidth="1.6" fill="none" />
      {Array.from({ length: 11 }).map((_, i) => {
        const t = (i + 0.5) / 11;
        const x = 40 + t * 520;
        const y = 60 + Math.sin(Math.PI * t) * 45;
        return <path key={i} d={`M${x - 16} ${y} L${x + 16} ${y} L${x} ${y + 30}Z`} fill={i % 2 ? c.ink : c.metal} opacity="0.85" />;
      })}
      {/* gấu ngồi góc dưới trái */}
      <g transform="translate(120 650)">
        <circle cx="-38" cy="-118" r="22" fill={fur} />
        <circle cx="38" cy="-118" r="22" fill={fur} />
        <circle cx="-38" cy="-118" r="11" fill={furD} />
        <circle cx="38" cy="-118" r="11" fill={furD} />
        <ellipse cx="0" cy="10" rx="70" ry="66" fill={fur} />
        <circle cx="0" cy="-86" r="54" fill={fur} />
        <ellipse cx="0" cy="-70" rx="22" ry="17" fill={lighten(fur, 0.4)} />
        <ellipse cx="0" cy="-76" rx="8" ry="6" fill={darken(fur, 0.6)} />
        <circle cx="-20" cy="-98" r="5" fill={darken(fur, 0.7)} />
        <circle cx="20" cy="-98" r="5" fill={darken(fur, 0.7)} />
        <circle cx="-34" cy="-78" r="7" fill={c.ink} opacity="0.35" />
        <circle cx="34" cy="-78" r="7" fill={c.ink} opacity="0.35" />
        <ellipse cx="0" cy="20" rx="40" ry="38" fill={lighten(fur, 0.3)} />
        <ellipse cx="-56" cy="66" rx="26" ry="18" fill={furD} />
        <ellipse cx="56" cy="66" rx="26" ry="18" fill={furD} />
        <path d="M-18 -36 L0 -26 L18 -36 L18 -16 L0 -26 L-18 -16Z" fill={c.ink} />
        <line x1="60" y1="-10" x2="110" y2="-200" stroke={darken(fur, 0.4)} strokeWidth="1.5" />
      </g>
      <ellipse cx="236" cy="420" rx="32" ry="38" fill={c.metal} />
      <ellipse cx="226" cy="406" rx="7" ry="11" fill="#fff" opacity="0.5" />
      {[
        [490, 640, 22],
        [540, 560, 14],
        [450, 560, 10],
      ].map(([x, y, r], i) => (
        <Star key={i} x={x} y={y} r={r} fill={i % 2 ? c.ink : c.metal} opacity={0.85} />
      ))}
      <Frame color={c.metal} inset={18} r={28} opacity={0.5} double={false} />
    </>
  );
};

/* ================= KHAI TRƯƠNG / SỰ KIỆN ================= */

/** Dải lụa đỏ cắt băng với nơ lớn + ánh vàng. */
export const RibbonCutArt: React.FC<MotifProps> = ({ c, uid }) => (
  <>
    <defs>
      <linearGradient id={`${uid}-rib`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lighten(c.ink, 0.15)} />
        <stop offset="1" stopColor={darken(c.ink, 0.15)} />
      </linearGradient>
    </defs>
    <rect width="600" height="800" fill={c.ground} />
    <Frame color={c.metal} />
    {/* tia sáng */}
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (Math.PI / 11) * i + Math.PI;
      return (
        <line key={i} x1="300" y1="170" x2={300 + Math.cos(a) * 260} y2={170 + Math.sin(a) * 130} stroke={c.metal} strokeWidth="1" opacity="0.35" />
      );
    })}
    {/* băng ngang */}
    <path d="M36 150 Q300 190 564 150 L564 186 Q300 226 36 186Z" fill={`url(#${uid}-rib)`} />
    {/* nơ */}
    <g transform="translate(300 172)">
      <path d="M0 0 C-60 -70 -120 -30 -96 18 C-80 46 -30 30 0 0Z" fill={c.ink} />
      <path d="M0 0 C60 -70 120 -30 96 18 C80 46 30 30 0 0Z" fill={c.ink} />
      <path d="M0 0 C-40 -46 -84 -24 -72 8" stroke={darken(c.ink, 0.3)} strokeWidth="3" fill="none" />
      <path d="M0 0 C40 -46 84 -24 72 8" stroke={darken(c.ink, 0.3)} strokeWidth="3" fill="none" />
      <path d="M-10 6 L-46 96 L-24 88 L-14 108 L6 10Z" fill={darken(c.ink, 0.1)} />
      <path d="M10 6 L46 96 L24 88 L14 108 L-6 10Z" fill={darken(c.ink, 0.1)} />
      <ellipse rx="20" ry="16" fill={darken(c.ink, 0.2)} />
    </g>
    {/* kéo vàng */}
    <g transform="translate(300 690) rotate(-30)" fill="none" stroke={c.metal} strokeWidth="6">
      <circle cx="-34" cy="30" r="16" />
      <circle cx="34" cy="30" r="16" />
      <path d="M-22 18 L40 -60 M22 18 L-40 -60" strokeLinecap="round" />
    </g>
    {[
      [100, 280],
      [500, 300],
      [120, 620],
      [480, 620],
    ].map(([x, y], i) => (
      <Sparkle key={i} x={x} y={y} s={10} fill={c.metal} />
    ))}
  </>
);

/** Pháo hoa nổ trên nền trời đêm. */
export const FireworkArt: React.FC<MotifProps> = ({ c }) => {
  const Burst = ({ x, y, r, col, n = 18 }: { x: number; y: number; r: number; col: string; n?: number }) => (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const a = ((Math.PI * 2) / n) * i;
        return (
          <g key={i}>
            <line x1={x + Math.cos(a) * r * 0.25} y1={y + Math.sin(a) * r * 0.25} x2={x + Math.cos(a) * r} y2={y + Math.sin(a) * r} stroke={col} strokeWidth="2.2" strokeLinecap="round" />
            <circle cx={x + Math.cos(a) * r * 1.12} cy={y + Math.sin(a) * r * 1.12} r="2.6" fill={col} />
          </g>
        );
      })}
      <circle cx={x} cy={y} r="4" fill="#fff" />
    </g>
  );
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      <Burst x={140} y={140} r={80} col={c.metal} />
      <Burst x={460} y={120} r={66} col={c.soft} n={16} />
      <Burst x={300} y={64} r={40} col={c.ink} n={14} />
      <Burst x={90} y={660} r={50} col={c.soft} n={14} />
      <Burst x={510} y={670} r={58} col={c.metal} n={16} />
      {Array.from({ length: 30 }).map((_, i) => (
        <circle key={i} cx={(i * 137) % 600} cy={(i * 83) % 800} r={i % 4 === 0 ? 1.8 : 1} fill="#fff" opacity="0.6" />
      ))}
      <path d="M0 780 L60 740 L110 760 L170 720 L240 750 L300 710 L360 748 L430 716 L500 752 L560 726 L600 750 V800 H0Z" fill={darken(c.ground, 0.3)} />
      <Frame color={c.metal} inset={20} opacity={0.5} />
    </>
  );
};

/* ================= TỐT NGHIỆP ================= */

/** Mũ tốt nghiệp, bằng cuộn & vòng nguyệt quế. */
export const GradCapArt: React.FC<MotifProps> = ({ c }) => {
  const Laurel = ({ side }: { side: 1 | -1 }) => (
    <g transform={`translate(300 772) scale(${side * 0.72} 0.72)`}>
      <path d="M0 0 C-90 -10 -170 -80 -190 -190" stroke={c.metal} strokeWidth="3" fill="none" />
      {Array.from({ length: 9 }).map((_, i) => {
        const t = (i + 1) / 10;
        const x = -190 * Math.pow(t, 0.9);
        const y = -190 * t * t;
        return <ellipse key={i} cx={x - 10} cy={y + 6} rx="16" ry="7" fill={c.metal} transform={`rotate(${-30 - t * 50} ${x - 10} ${y + 6})`} />;
      })}
    </g>
  );
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      <Frame color={c.metal} />
      {/* mũ */}
      <g transform="translate(300 150)">
        <path d="M-150 0 L0 -60 L150 0 L0 60Z" fill={c.ink} />
        <path d="M-90 26 V80 Q0 124 90 80 V26 L0 60Z" fill={darken(c.ink, 0.25)} />
        <circle cx="0" cy="0" r="8" fill={c.metal} />
        <path d="M0 0 L118 22 V96" stroke={c.metal} strokeWidth="4" fill="none" />
        <path d="M110 96 h16 l-4 34 h-8z" fill={c.metal} />
      </g>
      {/* bằng cuộn */}
      <g transform="translate(470 600) rotate(-24)">
        <rect x="-70" y="-16" width="140" height="32" rx="16" fill={lighten(c.soft, 0.4)} stroke={c.soft} strokeWidth="2" />
        <rect x="-8" y="-17" width="16" height="34" fill={c.ink} />
      </g>
      <Laurel side={1} />
      <Laurel side={-1} />
      {[
        [90, 110],
        [520, 90],
        [100, 470],
        [500, 450],
      ].map(([x, y], i) => (
        <Star key={i} x={x} y={y} r={10} fill={c.metal} opacity={0.8} />
      ))}
    </>
  );
};

export const EVENT_MOTIF_ART = {
  balloons: BalloonsArt,
  cake: CakeArt,
  confetti: ConfettiArt,
  house: HouseArt,
  'keys-plant': KeysPlantArt,
  'baby-cloud': BabyCloudArt,
  'baby-bear': BabyBearArt,
  'ribbon-cut': RibbonCutArt,
  firework: FireworkArt,
  'grad-cap': GradCapArt,
} as const;

export const _mix = mix;
