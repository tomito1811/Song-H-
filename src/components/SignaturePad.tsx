import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Undo2, PenLine } from 'lucide-react';

export type PenType = 'ballpoint' | 'calligraphy' | 'brush' | 'glitter';

export const PEN_TYPES: { id: PenType; label: string; hint: string }[] = [
  { id: 'ballpoint', label: 'Bút bi', hint: 'Nét mảnh, đều tay' },
  { id: 'calligraphy', label: 'Bút thư pháp', hint: 'Ngòi dẹt, nét thanh nét đậm' },
  { id: 'brush', label: 'Bút lông', hint: 'Nét mềm, đậm nhạt theo tốc độ' },
  { id: 'glitter', label: 'Bút nhũ lấp lánh', hint: 'Nét kim tuyến lung linh' },
];

export const PEN_COLORS = ['#1F1A1F', '#1E3A8A', '#B91C1C', '#C76A82', '#7C3AED', '#047857', '#B6925B', '#EA580C'];

interface Point {
  x: number;
  y: number;
  t: number;
}

interface Stroke {
  pen: PenType;
  color: string;
  points: Point[];
}

interface SignaturePadProps {
  /** Gọi mỗi khi nét ký thay đổi; null = chưa ký. */
  onChange: (dataUrl: string | null) => void;
  height?: number;
}

function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Vẽ một nét ký lên canvas (dùng chung cho vẽ trực tiếp & vẽ lại khi hoàn tác). */
function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, scale: number, fromIndex = 1) {
  const pts = s.points;
  if (pts.length === 0) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (pts.length === 1 && fromIndex <= 1) {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(pts[0].x * scale, pts[0].y * scale, (s.pen === 'brush' ? 3 : 1.6) * scale, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  for (let i = Math.max(1, fromIndex); i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const dt = Math.max(1, b.t - a.t);
    const speed = dist / dt; // px/ms

    switch (s.pen) {
      case 'ballpoint': {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2.2 * scale;
        ctx.beginPath();
        ctx.moveTo(a.x * scale, a.y * scale);
        ctx.lineTo(b.x * scale, b.y * scale);
        ctx.stroke();
        break;
      }
      case 'calligraphy': {
        // Ngòi dẹt nghiêng 45°: vẽ tứ giác nối hai đầu ngòi
        const nib = 5.5 * scale;
        const ox = Math.cos(-Math.PI / 4) * nib;
        const oy = Math.sin(-Math.PI / 4) * nib;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(a.x * scale - ox, a.y * scale - oy);
        ctx.lineTo(a.x * scale + ox, a.y * scale + oy);
        ctx.lineTo(b.x * scale + ox, b.y * scale + oy);
        ctx.lineTo(b.x * scale - ox, b.y * scale - oy);
        ctx.closePath();
        ctx.fill();
        // Viền mảnh khép kín các mối nối giữa các đoạn
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.2 * scale;
        ctx.stroke();
        break;
      }
      case 'brush': {
        // Nhanh → nét mảnh, chậm → nét đậm
        const w = Math.max(1.5, Math.min(9, 9 - speed * 5)) * scale;
        ctx.strokeStyle = hexToRgba(s.color, 0.88);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(a.x * scale, a.y * scale);
        ctx.lineTo(b.x * scale, b.y * scale);
        ctx.stroke();
        break;
      }
      case 'glitter': {
        ctx.strokeStyle = hexToRgba(s.color, 0.55);
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(a.x * scale, a.y * scale);
        ctx.lineTo(b.x * scale, b.y * scale);
        ctx.stroke();
        // Hạt kim tuyến tất định theo tọa độ để vẽ lại giống hệt
        const steps = Math.max(1, Math.round(dist / 2));
        for (let k = 0; k < steps; k++) {
          const seed = Math.sin((a.x + k * 7.13) * 12.9898 + (a.y + i) * 78.233) * 43758.5453;
          const r1 = seed - Math.floor(seed);
          const r2 = (r1 * 9301 + 49297) % 1;
          const px = (a.x + (dx * k) / steps + (r1 - 0.5) * 7) * scale;
          const py = (a.y + (dy * k) / steps + (r2 - 0.5) * 7) * scale;
          ctx.fillStyle = r1 > 0.7 ? '#FFFFFF' : r1 > 0.35 ? '#F5D77A' : s.color;
          ctx.globalAlpha = 0.6 + r2 * 0.4;
          ctx.fillRect(px, py, 1.4 * scale, 1.4 * scale);
        }
        ctx.globalAlpha = 1;
        break;
      }
    }
  }
}

/** Khung ký tên vẽ tay: 4 loại bút, 8 màu, hoàn tác / xóa. Xuất PNG nền trong suốt đã cắt viền. */
export const SignaturePad: React.FC<SignaturePadProps> = ({ onChange, height = 160 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const [pen, setPen] = useState<PenType>('calligraphy');
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [hasInk, setHasInk] = useState(false);
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    strokesRef.current.forEach((s) => drawStroke(ctx, s, dpr));
  }, [dpr]);

  // Khớp kích thước canvas với khung
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      const w = wrapRef.current?.clientWidth || 300;
      if (!c) return;
      c.width = Math.round(w * dpr);
      c.height = Math.round(height * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${height}px`;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [height, dpr, redraw]);

  const exportSignature = useCallback(() => {
    if (strokesRef.current.length === 0) {
      onChange(null);
      return;
    }
    const all = strokesRef.current.flatMap((s) => s.points);
    const pad = 12;
    const minX = Math.max(0, Math.min(...all.map((p) => p.x)) - pad);
    const minY = Math.max(0, Math.min(...all.map((p) => p.y)) - pad);
    const maxX = Math.max(...all.map((p) => p.x)) + pad;
    const maxY = Math.max(...all.map((p) => p.y)) + pad;
    const w = maxX - minX;
    const h = maxY - minY;
    const scale = Math.min(2, 560 / Math.max(w, 1));
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(w * scale));
    out.height = Math.max(1, Math.round(h * scale));
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.translate(-minX * scale, -minY * scale);
    strokesRef.current.forEach((s) => drawStroke(ctx, s, scale));
    onChange(out.toDataURL('image/png'));
  }, [onChange]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    currentRef.current = { pen, color, points: [pos(e)] };
    strokesRef.current.push(currentRef.current);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawStroke(ctx, currentRef.current, dpr);
    setHasInk(true);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = currentRef.current;
    if (!s) return;
    const p = pos(e);
    const last = s.points[s.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 1.2) return;
    s.points.push(p);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawStroke(ctx, s, dpr, s.points.length - 1);
  };

  const onUp = () => {
    if (!currentRef.current) return;
    currentRef.current = null;
    exportSignature();
  };

  const undo = () => {
    strokesRef.current.pop();
    setHasInk(strokesRef.current.length > 0);
    redraw();
    exportSignature();
  };

  const clear = () => {
    strokesRef.current = [];
    setHasInk(false);
    redraw();
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PEN_TYPES.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.hint}
            onClick={() => setPen(p.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] border cursor-pointer ${
              pen === p.id ? 'bg-[#453C45] text-white border-[#453C45]' : 'bg-white text-[#453C45] border-neutral-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        {PEN_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Màu ${c}`}
            className="w-6 h-6 rounded-full border-2 cursor-pointer transition-transform"
            style={{
              backgroundColor: c,
              borderColor: color === c ? '#FFFFFF' : 'transparent',
              boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
              transform: color === c ? 'scale(1.1)' : 'none',
            }}
          />
        ))}
      </div>
      <div
        ref={wrapRef}
        className="relative rounded-xl border border-dashed border-neutral-300 bg-[repeating-linear-gradient(0deg,#fff,#fff_31px,#f3ece8_32px)] overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="block touch-none cursor-crosshair"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <PenLine className="w-4 h-4" /> Ký tên của bạn tại đây
          </span>
        )}
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!hasInk}
            className="p-1.5 rounded-lg bg-white/90 border border-neutral-200 disabled:opacity-40 cursor-pointer"
            title="Hoàn tác nét cuối"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={!hasInk}
            className="p-1.5 rounded-lg bg-white/90 border border-neutral-200 disabled:opacity-40 cursor-pointer"
            title="Xóa chữ ký"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
