// Nhóm 2 (Tối giản), nhóm 3 (Hoa lá – thiên nhiên) và nhóm 6 (Nghệ thuật – Chibi, Hoa khô).
import React from 'react';
import { quadPoint, lighten, darken, mix, seeded } from './artUtils';
import type { MotifProps } from './motifTypes';

type P = [number, number];

const leafPath = (L: number, W: number) =>
  `M0 0 C${L * 0.3} ${-W} ${L * 0.72} ${-W} ${L} 0 C${L * 0.72} ${W} ${L * 0.3} ${W} 0 0 Z`;

/** Cành lá: thân cong bậc 2, lá mọc so le, có gân giữa. */
export const Branch: React.FC<{
  p0: P;
  p1: P;
  p2: P;
  count: number;
  leafLen: number;
  leafW: number;
  fill: string;
  stem: string;
  seed?: number;
  round?: boolean;
  opacity?: number;
}> = ({ p0, p1, p2, count, leafLen, leafW, fill, stem, seed = 7, round = false, opacity = 1 }) => {
  const rnd = seeded(seed);
  const d = `M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`;
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={stem} strokeWidth="1.6" strokeLinecap="round" />
      {Array.from({ length: count }).map((_, i) => {
        const t = 0.08 + (i / count) * 0.9;
        const q = quadPoint(p0, p1, p2, t);
        const side = i % 2 === 0 ? 1 : -1;
        const ang = q.angle + side * (38 + rnd() * 18);
        const sc = 0.65 + (1 - t) * 0.35 + rnd() * 0.15;
        const L = leafLen * sc;
        const W = (round ? leafLen * 0.45 : leafW) * sc;
        return (
          <g key={i} transform={`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${ang.toFixed(1)})`}>
            {round ? (
              <ellipse cx={L * 0.55} cy="0" rx={L * 0.5} ry={W} fill={fill} opacity={0.75 + rnd() * 0.25} />
            ) : (
              <path d={leafPath(L, W)} fill={fill} opacity={0.72 + rnd() * 0.28} />
            )}
            <path d={`M2 0 L${L * 0.9} 0`} stroke={stem} strokeWidth="0.7" opacity="0.55" />
          </g>
        );
      })}
      {/* lá đầu cành */}
      {(() => {
        const q = quadPoint(p0, p1, p2, 1);
        return <path d={leafPath(leafLen * 0.8, leafW * 0.8)} transform={`translate(${p2[0]} ${p2[1]}) rotate(${q.angle})`} fill={fill} />;
      })()}
    </g>
  );
};

const Grain: React.FC<{ uid: string; opacity?: number }> = ({ uid, opacity = 0.09 }) => (
  <>
    <defs>
      <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" seed="3" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues={`0 ${opacity}`} />
        </feComponentTransfer>
      </filter>
    </defs>
    <rect width="600" height="800" filter={`url(#${uid}-grain)`} />
  </>
);

/* ------------------------------------------------------------------ */
/* 3. MINIMALISM – monogram                                            */
/* ------------------------------------------------------------------ */
export const MinimalArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const arch = variant === 'arch';
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      <Grain uid={uid} opacity={0.06} />
      {arch ? (
        <>
          <path d="M60 760 V300 A240 240 0 0 1 540 300 V760 Z" fill="none" stroke={c.ink} strokeWidth="1.2" />
          <path d="M72 748 V302 A228 228 0 0 1 528 302 V748 Z" fill="none" stroke={c.metal} strokeWidth="0.6" />
        </>
      ) : (
        <>
          <rect x="34" y="34" width="532" height="732" fill="none" stroke={c.ink} strokeWidth="1.2" />
          <rect x="44" y="44" width="512" height="712" fill="none" stroke={c.metal} strokeWidth="0.6" />
        </>
      )}
      {/* Vòng monogram */}
      <circle cx="300" cy={arch ? 190 : 150} r="52" fill="none" stroke={c.metal} strokeWidth="1" />
      <circle cx="300" cy={arch ? 190 : 150} r="46" fill="none" stroke={c.ink} strokeWidth="0.6" />
      {/* nhành nhỏ dưới cùng */}
      <g transform="translate(300 712)" fill="none" stroke={c.metal} strokeWidth="1" strokeLinecap="round">
        <path d="M-70 0 H70" />
        <path d="M-8 0 C-14 -8 -24 -10 -32 -6 C-24 -2 -14 -2 -8 0 Z" fill={c.metal} opacity="0.7" stroke="none" />
        <path d="M8 0 C14 -8 24 -10 32 -6 C24 -2 14 -2 8 0 Z" fill={c.metal} opacity="0.7" stroke="none" />
        <circle r="3" fill={c.metal} stroke="none" />
      </g>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 4. THANH DIỆP – nhành lá xanh                                       */
/* ------------------------------------------------------------------ */
export const ThanhDiepArt: React.FC<MotifProps> = ({ c, uid }) => (
  <>
    <rect width="600" height="800" fill={c.ground} />
    <Grain uid={uid} opacity={0.07} />
    {/* tấm vòm sáng */}
    <path d="M90 740 V290 A210 210 0 0 1 510 290 V740 Z" fill={c.soft} />
    <path d="M90 740 V290 A210 210 0 0 1 510 290 V740 Z" fill="none" stroke={c.ink} strokeWidth="1.2" />
    <path d="M102 728 V292 A198 198 0 0 1 498 292 V728 Z" fill="none" stroke={c.metal} strokeWidth="0.6" />
    {/* cành lớn vắt qua đỉnh vòm */}
    <Branch p0={[30, 330]} p1={[140, 60]} p2={[400, 70]} count={15} leafLen={44} leafW={11} fill={c.ink} stem={darken(c.ink, 0.25)} seed={11} />
    <Branch p0={[60, 250]} p1={[130, 150]} p2={[250, 118]} count={8} leafLen={30} leafW={8} fill={lighten(c.ink, 0.3)} stem={c.ink} seed={5} opacity={0.85} />
    {/* cành nhỏ góc dưới phải */}
    <Branch p0={[590, 640]} p1={[520, 720]} p2={[410, 770]} count={9} leafLen={34} leafW={9} fill={c.ink} stem={darken(c.ink, 0.25)} seed={21} />
  </>
);

/* ------------------------------------------------------------------ */
/* 5. LIÊN HOA – hoa sen                                               */
/* ------------------------------------------------------------------ */
const LotusPetal = (h: number, w: number) =>
  `M0 0 C${-w} ${-h * 0.35} ${-w * 0.7} ${-h * 0.85} 0 ${-h} C${w * 0.7} ${-h * 0.85} ${w} ${-h * 0.35} 0 0 Z`;

const Lotus: React.FC<{ x: number; y: number; s: number; petal: string; deep: string; uid: string }> = ({ x, y, s, petal, deep, uid }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <defs>
      <linearGradient id={`${uid}-petal`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor={lighten(petal, 0.55)} />
        <stop offset="0.55" stopColor={petal} />
        <stop offset="1" stopColor={deep} />
      </linearGradient>
    </defs>
    {[-62, -40, 40, 62].map((a, i) => (
      <path key={`b-${i}`} d={LotusPetal(92, 30)} transform={`rotate(${a})`} fill={`url(#${uid}-petal)`} opacity="0.75" />
    ))}
    {[-22, 22].map((a, i) => (
      <path key={`m-${i}`} d={LotusPetal(112, 34)} transform={`rotate(${a})`} fill={`url(#${uid}-petal)`} />
    ))}
    <path d={LotusPetal(124, 36)} fill={`url(#${uid}-petal)`} />
    {[-70, 70].map((a, i) => (
      <path key={`f-${i}`} d={LotusPetal(70, 26)} transform={`rotate(${a}) translate(0 6)`} fill={`url(#${uid}-petal)`} />
    ))}
    {/* gân cánh */}
    {[-22, 0, 22].map((a, i) => (
      <path key={`v-${i}`} d="M0 -8 Q2 -60 0 -104" transform={`rotate(${a})`} stroke={deep} strokeWidth="0.8" fill="none" opacity="0.45" />
    ))}
  </g>
);

const LotusLeaf: React.FC<{ x: number; y: number; rx: number; ry: number; fill: string; vein: string }> = ({ x, y, rx, ry, fill, vein }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse rx={rx} ry={ry} fill={fill} />
    {Array.from({ length: 11 }).map((_, i) => {
      const a = (i / 11) * Math.PI * 2;
      return <path key={i} d={`M0 0 L${(rx * 0.92 * Math.cos(a)).toFixed(1)} ${(ry * 0.92 * Math.sin(a)).toFixed(1)}`} stroke={vein} strokeWidth="0.8" opacity="0.5" />;
    })}
    <path d={`M0 0 L${rx} ${-ry * 0.15}`} stroke={lighten(fill, 0.4)} strokeWidth="1.4" />
  </g>
);

export const LienHoaArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const v2 = variant === 'v2';
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lighten(c.ground, 0.6)} />
          <stop offset="0.6" stopColor={c.ground} />
          <stop offset="1" stopColor={mix(c.ground, c.ink, 0.12)} />
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill={`url(#${uid}-sky)`} />
      <Grain uid={uid} opacity={0.05} />
      {/* khung vòm ánh kim */}
      <path d="M48 770 V250 A252 252 0 0 1 552 250 V770" fill="none" stroke={c.metal} strokeWidth="1.6" />
      <path d="M60 770 V252 A240 240 0 0 1 540 252 V770" fill="none" stroke={c.metal} strokeWidth="0.6" />
      {/* mặt nước */}
      <g fill="none" stroke={c.soft} strokeWidth="1.2" opacity="0.9">
        <path d="M70 720 q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0" />
        <path d="M110 742 q35 -7 70 0 t70 0 t70 0 t70 0 t70 0" />
      </g>
      {/* lá sen */}
      <LotusLeaf x={170} y={700} rx={92} ry={26} fill={c.soft} vein={darken(c.soft, 0.4)} />
      <LotusLeaf x={448} y={708} rx={74} ry={20} fill={darken(c.soft, 0.12)} vein={darken(c.soft, 0.45)} />
      {/* nụ sen */}
      <path d="M470 700 C474 640 486 610 492 590" stroke={darken(c.soft, 0.3)} strokeWidth="2.5" fill="none" />
      <path d={LotusPetal(54, 18)} transform="translate(492 594) rotate(10)" fill={c.ink} opacity="0.9" />
      <path d={LotusPetal(44, 14)} transform="translate(492 594) rotate(-14)" fill={lighten(c.ink, 0.3)} />
      {/* hoa chính */}
      <Lotus x={300} y={706} s={v2 ? 0.95 : 1.12} petal={lighten(c.ink, 0.25)} deep={c.ink} uid={uid} />
      {/* hạt ánh kim lơ lửng */}
      {[[100, 300], [500, 280], [96, 520], [504, 470]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.4} fill={c.metal} opacity="0.7" />
      ))}
      {v2 && <path d="M200 150 H400" stroke={c.metal} strokeWidth="0.8" />}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 6. VƯỜN KÍNH – nhà kính vòm                                         */
/* ------------------------------------------------------------------ */
export const VuonKinhArt: React.FC<MotifProps> = ({ c, uid }) => {
  const L = 70;
  const R = 530;
  const springY = 300;
  const r = (R - L) / 2;
  const cx = 300;
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      <Grain uid={uid} opacity={0.06} />
      {/* kính */}
      <path d={`M${L} 780 V${springY} A${r} ${r} 0 0 1 ${R} ${springY} V780 Z`} fill={c.soft} opacity="0.55" />
      {/* khung sắt */}
      <g fill="none" stroke={c.ink} strokeLinecap="round">
        <path d={`M${L} 780 V${springY} A${r} ${r} 0 0 1 ${R} ${springY} V780`} strokeWidth="5" />
        <path d={`M${L + 14} 780 V${springY} A${r - 14} ${r - 14} 0 0 1 ${R - 14} ${springY} V780`} strokeWidth="1.2" />
        {/* thanh dọc */}
        {[1, 2, 3].map((i) => {
          const x = L + ((R - L) / 4) * i;
          const dy = Math.sqrt(Math.max(0, r * r - (x - cx) ** 2));
          return <path key={`v-${i}`} d={`M${x} 780 V${springY - dy + 6}`} strokeWidth="2" />;
        })}
        {/* thanh ngang */}
        {[300, 470, 640].map((y) => (
          <path key={`h-${y}`} d={`M${L} ${y} H${R}`} strokeWidth="2" />
        ))}
        {/* nan quạt đỉnh vòm */}
        {[-60, -30, 0, 30, 60].map((a) => {
          const rad = ((a - 90) * Math.PI) / 180;
          return <path key={`f-${a}`} d={`M${cx} ${springY} L${cx + r * Math.cos(rad)} ${springY + r * Math.sin(rad)}`} strokeWidth="1.6" />;
        })}
        <path d={`M${cx - 46} ${springY} A46 46 0 0 1 ${cx + 46} ${springY}`} strokeWidth="2" />
        <circle cx={cx} cy={springY - 4} r="6" fill={c.ink} />
      </g>
      {/* bảng chữ trong nhà kính */}
      <rect x="112" y="318" width="376" height="398" rx="6" fill={c.ground} opacity="0.93" />
      <rect x="120" y="326" width="360" height="382" rx="4" fill="none" stroke={c.metal} strokeWidth="0.8" />
      {/* dây leo hai bên */}
      <Branch p0={[40, 790]} p1={[30, 560]} p2={[110, 390]} count={14} leafLen={30} leafW={10} fill={c.ink} stem={darken(c.ink, 0.3)} seed={3} round />
      <Branch p0={[560, 790]} p1={[586, 600]} p2={[500, 470]} count={11} leafLen={28} leafW={10} fill={lighten(c.ink, 0.15)} stem={darken(c.ink, 0.3)} seed={9} round />
      {/* hoa điểm */}
      {[[96, 520], [64, 650], [520, 560], [540, 690], [112, 430]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-7" rx="4.5" ry="7" transform={`rotate(${a})`} fill={c.metal} />
          ))}
          <circle r="3" fill={lighten(c.metal, 0.6)} />
        </g>
      ))}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 12. HOA KHÔ – bó hoa khô trên giấy kraft                            */
/* ------------------------------------------------------------------ */
const Pampas: React.FC<{ p0: P; p1: P; p2: P; color: string; seed: number }> = ({ p0, p1, p2, color, seed }) => {
  const rnd = seeded(seed);
  return (
    <g stroke={color} strokeLinecap="round" fill="none">
      <path d={`M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`} strokeWidth="1.4" />
      {Array.from({ length: 60 }).map((_, i) => {
        const t = 0.45 + (i / 60) * 0.55;
        const q = quadPoint(p0, p1, p2, t);
        const side = i % 2 ? 1 : -1;
        const ang = ((q.angle + side * (20 + rnd() * 25)) * Math.PI) / 180;
        const len = 10 + rnd() * 16 * Math.sin(((t - 0.45) / 0.55) * Math.PI) + 4;
        return (
          <path
            key={i}
            d={`M${q.x.toFixed(1)} ${q.y.toFixed(1)} l${(len * Math.cos(ang)).toFixed(1)} ${(len * Math.sin(ang)).toFixed(1)}`}
            strokeWidth={0.9 + rnd() * 0.8}
            opacity={0.55 + rnd() * 0.4}
          />
        );
      })}
    </g>
  );
};

const Wheat: React.FC<{ p0: P; p1: P; p2: P; color: string }> = ({ p0, p1, p2, color }) => (
  <g>
    <path d={`M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`} stroke={color} strokeWidth="1.3" fill="none" />
    {Array.from({ length: 10 }).map((_, i) => {
      const t = 0.62 + i * 0.04;
      const q = quadPoint(p0, p1, p2, t);
      return [1, -1].map((s) => (
        <ellipse
          key={`${i}-${s}`}
          cx={0}
          cy={0}
          rx="7"
          ry="3"
          fill={color}
          transform={`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${(q.angle + s * 30).toFixed(1)}) translate(6 0)`}
        />
      ));
    })}
  </g>
);

export const HoaKhoArt: React.FC<MotifProps> = ({ c, uid, variant }) => {
  const v2 = variant === 'v2';
  const base: P = [300, 690];
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      <Grain uid={uid} opacity={0.16} />
      {/* viền giấy xé */}
      <rect x="30" y="30" width="540" height="740" fill="none" stroke={c.ink} strokeWidth="1" strokeDasharray="6 5" opacity="0.6" />
      <g transform={`translate(300 712) scale(${v2 ? 0.74 : 0.8}) translate(-300 -690)`}>
        {/* cành lá bạch đàn khô */}
        <Branch p0={base} p1={[200, 600]} p2={[120, 470]} count={9} leafLen={26} leafW={10} fill={c.soft} stem={darken(c.soft, 0.3)} seed={4} round />
        <Branch p0={base} p1={[400, 600]} p2={[486, 486]} count={9} leafLen={26} leafW={10} fill={darken(c.soft, 0.08)} stem={darken(c.soft, 0.3)} seed={8} round />
        {/* lau sậy (pampas) */}
        <Pampas p0={base} p1={[250, 560]} p2={[196, 400]} color={lighten(c.metal, 0.35)} seed={2} />
        <Pampas p0={base} p1={[360, 540]} p2={[420, 392]} color={lighten(c.metal, 0.2)} seed={6} />
        <Pampas p0={base} p1={[300, 540]} p2={[300, 420]} color={lighten(c.metal, 0.45)} seed={12} />
        {/* lúa mì */}
        <Wheat p0={base} p1={[230, 580]} p2={[150, 520]} color={c.metal} />
        <Wheat p0={base} p1={[380, 590]} p2={[456, 540]} color={c.metal} />
        {/* bông tai thỏ */}
        {[[240, 470], [372, 452], [328, 470], [268, 440]].map(([x, y], i) => (
          <g key={i}>
            <path d={`M${base[0]} ${base[1]} Q${(base[0] + x) / 2} ${(base[1] + y) / 2 + 30} ${x} ${y}`} stroke={darken(c.metal, 0.25)} strokeWidth="1" fill="none" />
            <ellipse cx={x} cy={y - 6} rx="7" ry="12" fill={lighten(c.ground, 0.55)} stroke={darken(c.ground, 0.15)} strokeWidth="0.8" />
          </g>
        ))}
        {/* hoa cúc khô màu nhấn */}
        {[[214, 520], [392, 512], [300, 500]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {Array.from({ length: 12 }).map((_, k) => (
              <ellipse key={k} cx="0" cy="-10" rx="3.2" ry="9" transform={`rotate(${k * 30})`} fill={c.ink} opacity="0.9" />
            ))}
            <circle r="5" fill={darken(c.ink, 0.35)} />
          </g>
        ))}
        {/* nơ buộc */}
        <g transform={`translate(${base[0]} ${base[1] - 6})`} fill={c.ink}>
          <path d="M0 0 C-30 -24 -54 -6 -40 10 C-30 18 -12 8 0 0 Z" />
          <path d="M0 0 C30 -24 54 -6 40 10 C30 18 12 8 0 0 Z" />
          <path d="M-2 2 C-10 26 -22 46 -30 62 L-20 64 C-12 48 -4 30 0 4 Z" />
          <path d="M2 2 C10 26 24 44 34 58 L24 62 C14 46 4 30 0 4 Z" />
          <ellipse rx="7" ry="6" fill={darken(c.ink, 0.2)} />
        </g>
      </g>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 11. CHIBI – cặp đôi áo dài khăn đóng                                */
/* ------------------------------------------------------------------ */
const Heart: React.FC<{ x: number; y: number; s: number; fill: string; o?: number }> = ({ x, y, s, fill, o = 1 }) => (
  <path
    d="M0 6 C-14 -6 -8 -18 0 -10 C8 -18 14 -6 0 6 Z"
    transform={`translate(${x} ${y}) scale(${s})`}
    fill={fill}
    opacity={o}
  />
);

export const ChibiArt: React.FC<MotifProps> = ({ c, uid }) => {
  const skin = '#F9D9C2';
  const hair = '#2B1D1A';
  const ink = c.ink;
  const gold = c.metal;
  const outline = darken(ink, 0.45);
  return (
    <>
      <rect width="600" height="800" fill={c.ground} />
      <Grain uid={uid} opacity={0.05} />
      {/* khung bo tròn với chấm bi */}
      <rect x="28" y="28" width="544" height="744" rx="36" fill="none" stroke={ink} strokeWidth="3" />
      <rect x="40" y="40" width="520" height="720" rx="28" fill="none" stroke={ink} strokeWidth="1" strokeDasharray="2 8" strokeLinecap="round" />
      {/* vầng tròn sau lưng cặp đôi */}
      <circle cx="300" cy="606" r="128" fill={c.soft} />
      <circle cx="300" cy="606" r="128" fill="none" stroke={ink} strokeWidth="1.2" strokeDasharray="3 6" />

      <g transform="translate(300 744) scale(0.8) translate(-300 -730)">
      <g stroke={outline} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        {/* ===== CHÚ RỂ (trái) ===== */}
        <g transform="translate(236 0)">
          {/* áo dài */}
          <path d="M-46 700 L-38 560 C-36 540 -22 528 0 528 C22 528 36 540 38 560 L46 700 Z" fill={ink} />
          <path d="M0 528 L0 700" stroke={darken(ink, 0.3)} strokeWidth="1.5" />
          <path d="M-14 530 C-6 540 6 540 14 530" fill="none" stroke={gold} strokeWidth="2" />
          {[575, 605, 635, 665].map((y) => (
            <circle key={y} cx="0" cy={y} r="2.6" fill={gold} stroke="none" />
          ))}
          {/* tay */}
          <path d="M36 566 C52 590 58 604 64 612" fill="none" stroke={ink} strokeWidth="14" />
          <circle cx="66" cy="616" r="8" fill={skin} />
          {/* quần + chân */}
          <path d="M-22 700 V722 M22 700 V722" stroke={'#F6F0E6'} strokeWidth="14" />
          <ellipse cx="-22" cy="726" rx="12" ry="6" fill={hair} />
          <ellipse cx="22" cy="726" rx="12" ry="6" fill={hair} />
          {/* đầu */}
          <circle cx="0" cy="468" r="58" fill={skin} />
          {/* khăn đóng */}
          <path d="M-60 452 C-58 404 58 404 60 452 C40 440 -40 440 -60 452 Z" fill={ink} />
          <path d="M-56 440 C-30 428 30 428 56 440 M-58 448 C-30 436 30 436 58 448" fill="none" stroke={gold} strokeWidth="1.6" />
          <path d="M-60 452 C-62 462 -60 472 -56 478" fill="none" stroke={hair} strokeWidth="6" />
          {/* mặt */}
          <circle cx="-20" cy="476" r="5" fill={hair} stroke="none" />
          <circle cx="20" cy="476" r="5" fill={hair} stroke="none" />
          <circle cx="-18" cy="474" r="1.6" fill="#fff" stroke="none" />
          <circle cx="22" cy="474" r="1.6" fill="#fff" stroke="none" />
          <ellipse cx="-34" cy="492" rx="9" ry="5" fill="#F29B9B" opacity="0.6" stroke="none" />
          <ellipse cx="34" cy="492" rx="9" ry="5" fill="#F29B9B" opacity="0.6" stroke="none" />
          <path d="M-8 494 C-3 500 3 500 8 494" fill="none" strokeWidth="2" />
        </g>

        {/* ===== CÔ DÂU (phải) ===== */}
        <g transform="translate(364 0)">
          {/* tà áo dài xòe */}
          <path d="M-40 560 C-40 540 -24 528 0 528 C24 528 40 540 40 560 L58 720 L-58 720 Z" fill={lighten(ink, 0.12)} />
          <path d="M-24 610 L-40 720 M24 610 L40 720" stroke={darken(ink, 0.25)} strokeWidth="1.2" />
          <path d="M-14 530 C-6 540 6 540 14 530" fill="none" stroke={gold} strokeWidth="2" />
          {/* họa tiết thêu */}
          {[[-18, 640], [16, 668], [-6, 694]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`} stroke="none">
              {[0, 90, 180, 270].map((a) => (
                <ellipse key={a} cx="0" cy="-4" rx="2.4" ry="4" transform={`rotate(${a})`} fill={gold} />
              ))}
            </g>
          ))}
          {/* tay cầm hoa */}
          <path d="M-36 566 C-52 590 -58 604 -62 612" fill="none" stroke={lighten(ink, 0.12)} strokeWidth="14" />
          <circle cx="-64" cy="616" r="8" fill={skin} />
          {/* bó hoa nhỏ giữa hai tay */}
          <g transform="translate(-64 604)" stroke="none">
            <circle cx="-8" cy="-6" r="8" fill="#FFF4E8" />
            <circle cx="8" cy="-8" r="8" fill={lighten(ink, 0.5)} />
            <circle cx="0" cy="-18" r="8" fill="#FFF4E8" />
            <circle cx="0" cy="-8" r="3" fill={gold} />
          </g>
          {/* đầu */}
          <circle cx="0" cy="468" r="58" fill={skin} />
          {/* tóc */}
          <path d="M-60 474 C-66 416 -30 404 0 406 C30 404 66 416 60 474 C52 446 26 436 0 440 C-26 436 -52 446 -60 474 Z" fill={hair} />
          {/* khăn vấn (mấn) */}
          <ellipse cx="0" cy="414" rx="56" ry="20" fill={gold} />
          <path d="M-52 410 C-20 398 20 398 52 410" fill="none" stroke={darken(gold, 0.3)} strokeWidth="1.4" />
          <path d="M-46 420 C-16 410 16 410 46 420" fill="none" stroke={darken(gold, 0.3)} strokeWidth="1.4" />
          {/* mặt */}
          <path d="M-26 476 C-22 470 -16 470 -12 476" fill="none" strokeWidth="2.4" />
          <path d="M12 476 C16 470 22 470 26 476" fill="none" strokeWidth="2.4" />
          <ellipse cx="-32" cy="492" rx="9" ry="5" fill="#F29B9B" opacity="0.7" stroke="none" />
          <ellipse cx="32" cy="492" rx="9" ry="5" fill="#F29B9B" opacity="0.7" stroke="none" />
          <path d="M-8 494 C-3 501 3 501 8 494" fill="none" strokeWidth="2" />
        </g>
      </g>
      {/* trái tim giữa hai người */}
      <Heart x={300} y={420} s={1.6} fill={ink} />
      <Heart x={266} y={396} s={0.9} fill={ink} o={0.7} />
      <Heart x={334} y={388} s={1.1} fill={ink} o={0.8} />
      </g>
      <Heart x={86} y={300} s={1} fill={ink} o={0.35} />
      <Heart x={514} y={250} s={1.2} fill={ink} o={0.35} />
      <Heart x={84} y={640} s={0.9} fill={ink} o={0.35} />
      <Heart x={520} y={620} s={1} fill={ink} o={0.35} />
    </>
  );
};
