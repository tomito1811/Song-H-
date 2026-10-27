import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Maximize2 } from 'lucide-react';
import { GalleryEffect } from '../types/wedding';

export const GALLERY_EFFECTS: { id: GalleryEffect; label: string; hint: string }[] = [
  { id: 'kenburns', label: 'Điện ảnh Ken Burns', hint: 'Ảnh chuyển động chậm, phóng nhẹ như phim' },
  { id: 'fade', label: 'Hòa tan mềm', hint: 'Chuyển cảnh mờ dần tinh tế' },
  { id: 'slide', label: 'Trượt ngang', hint: 'Lướt ảnh như tạp chí' },
  { id: 'zoom', label: 'Phóng to', hint: 'Ảnh mới phóng ra từ trung tâm' },
  { id: 'flip', label: 'Lật trang 3D', hint: 'Lật ảnh như trang album' },
  { id: 'cube', label: 'Khối lập phương 3D', hint: 'Xoay khối hiện đại' },
  { id: 'blur', label: 'Mộng mơ (blur)', hint: 'Ảnh hiện dần từ nhòe sang nét' },
  { id: 'polaroid', label: 'Chồng ảnh Polaroid', hint: 'Ảnh rơi xếp chồng nghiêng nhẹ' },
  { id: 'curtain', label: 'Mở rèm', hint: 'Ảnh mở ra từ giữa như rèm sân khấu' },
  { id: 'mosaic', label: 'Lưới ghép nghệ thuật', hint: 'Lưới ảnh so le hiện dần khi cuộn' },
];

const EFFECT_ORDER: GalleryEffect[] = GALLERY_EFFECTS.map((e) => e.id);

/** Mỗi mẫu thiệp có một hiệu ứng mặc định khác nhau (ổn định theo templateId). */
export function defaultEffectForTemplate(templateId?: string): GalleryEffect {
  if (!templateId) return 'kenburns';
  let h = 0;
  for (let i = 0; i < templateId.length; i++) h = (h * 31 + templateId.charCodeAt(i)) >>> 0;
  return EFFECT_ORDER[h % EFFECT_ORDER.length];
}

const DURATION_MS = 1100;

const STYLES = `
.gs-stage{position:relative;overflow:hidden;perspective:1400px;}
.gs-layer{position:absolute;inset:0;backface-visibility:hidden;will-change:transform,opacity,filter,clip-path;}
.gs-layer img{width:100%;height:100%;object-fit:cover;display:block;user-select:none;-webkit-user-drag:none;}
@keyframes gs-fade-in{from{opacity:0}to{opacity:1}}
@keyframes gs-fade-out{from{opacity:1}to{opacity:0}}
@keyframes gs-kb{0%{transform:scale(1.02) translate(0,0)}100%{transform:scale(1.16) translate(-2%,-2%)}}
@keyframes gs-kb2{0%{transform:scale(1.16) translate(2%,1%)}100%{transform:scale(1.03) translate(0,0)}}
@keyframes gs-slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes gs-slide-out{from{transform:translateX(0)}to{transform:translateX(-35%);opacity:.3}}
@keyframes gs-slide-in-r{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes gs-slide-out-r{from{transform:translateX(0)}to{transform:translateX(35%);opacity:.3}}
@keyframes gs-zoom-in{from{transform:scale(1.35);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes gs-zoom-out{from{transform:scale(1);opacity:1}to{transform:scale(.82);opacity:0}}
@keyframes gs-flip-in{0%{transform:rotateY(-95deg);opacity:0}45%{opacity:1}100%{transform:rotateY(0)}}
@keyframes gs-flip-out{0%{transform:rotateY(0)}100%{transform:rotateY(95deg);opacity:0}}
@keyframes gs-cube-in{from{transform-origin:0% 50%;transform:translateX(100%) rotateY(-90deg)}to{transform-origin:0% 50%;transform:translateX(0) rotateY(0)}}
@keyframes gs-cube-out{from{transform-origin:100% 50%;transform:translateX(0) rotateY(0)}to{transform-origin:100% 50%;transform:translateX(-100%) rotateY(90deg)}}
@keyframes gs-blur-in{from{filter:blur(22px) saturate(1.4);opacity:0;transform:scale(1.08)}to{filter:blur(0) saturate(1);opacity:1;transform:scale(1)}}
@keyframes gs-blur-out{from{filter:blur(0);opacity:1}to{filter:blur(16px);opacity:0}}
@keyframes gs-curtain-in{from{clip-path:inset(0 50% 0 50%)}to{clip-path:inset(0 0 0 0)}}
@keyframes gs-polaroid-in{0%{transform:translateY(-120%) rotate(-14deg) scale(1.05);opacity:0}70%{transform:translateY(3%) rotate(var(--gs-rot)) scale(1);opacity:1}100%{transform:translateY(0) rotate(var(--gs-rot))}}
@keyframes gs-mosaic-in{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
.gs-polaroid{inset:7% 9% 9% 9%;background:#fff;padding:3.5% 3.5% 14% 3.5%;box-shadow:0 14px 34px rgba(0,0,0,.22);border-radius:4px;}
.gs-polaroid img{border-radius:2px;}
.gs-mosaic-item{opacity:0}
.gs-mosaic-item.gs-visible{animation:gs-mosaic-in .8s cubic-bezier(.2,.7,.2,1) forwards}
@media (prefers-reduced-motion: reduce){.gs-layer,.gs-mosaic-item{animation-duration:1ms!important}}
`;

function enterAnim(effect: GalleryEffect, dir: 1 | -1, index: number): string {
  const d = `${DURATION_MS}ms cubic-bezier(.22,.7,.2,1) both`;
  switch (effect) {
    case 'kenburns':
      return `gs-fade-in 1400ms ease both, ${index % 2 ? 'gs-kb2' : 'gs-kb'} 7000ms ease-out both`;
    case 'slide':
      return `${dir === 1 ? 'gs-slide-in' : 'gs-slide-in-r'} ${d}`;
    case 'zoom':
      return `gs-zoom-in ${d}`;
    case 'flip':
      return `gs-flip-in ${d}`;
    case 'cube':
      return `gs-cube-in ${d}`;
    case 'blur':
      return `gs-blur-in 1300ms ease both`;
    case 'curtain':
      return `gs-curtain-in 1200ms cubic-bezier(.65,0,.35,1) both`;
    case 'polaroid':
      return `gs-polaroid-in 1000ms cubic-bezier(.2,.8,.25,1.1) both`;
    case 'fade':
    default:
      return `gs-fade-in 1300ms ease both`;
  }
}

function exitAnim(effect: GalleryEffect, dir: 1 | -1): string | undefined {
  const d = `${DURATION_MS}ms cubic-bezier(.22,.7,.2,1) both`;
  switch (effect) {
    case 'slide':
      return `${dir === 1 ? 'gs-slide-out' : 'gs-slide-out-r'} ${d}`;
    case 'zoom':
      return `gs-zoom-out ${d}`;
    case 'flip':
      return `gs-flip-out ${d}`;
    case 'cube':
      return `gs-cube-out ${d}`;
    case 'blur':
      return `gs-blur-out ${d}`;
    // fade / kenburns / curtain / polaroid: ảnh cũ nằm yên bên dưới
    default:
      return undefined;
  }
}

interface GallerySlideshowProps {
  images: string[];
  effect: GalleryEffect;
  accent?: string;
  intervalMs?: number;
  onOpenImage?: (url: string) => void;
  /** Tỉ lệ khung (CSS aspect-ratio). */
  aspect?: string;
}

export const GallerySlideshow: React.FC<GallerySlideshowProps> = ({
  images,
  effect,
  accent = '#C76A82',
  intervalMs = 4500,
  onOpenImage,
  aspect = '4 / 5',
}) => {
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const touchX = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);
  const count = images.length;

  // Tải trước ảnh kế tiếp cho chuyển cảnh mượt
  useEffect(() => {
    if (count < 2) return;
    const img = new Image();
    img.src = images[(index + 1) % count];
  }, [index, images, count]);

  // Chỉ chạy tự động khi album đang hiển thị trên màn hình
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [effect]);

  const go = useCallback(
    (next: number, direction: 1 | -1) => {
      if (count < 2) return;
      setPrevIndex(index);
      setDir(direction);
      setIndex(((next % count) + count) % count);
      setTick((t) => t + 1);
    },
    [index, count]
  );

  useEffect(() => {
    if (!playing || !inView || count < 2 || effect === 'mosaic') return;
    const t = setTimeout(() => go(index + 1, 1), intervalMs);
    return () => clearTimeout(t);
  }, [playing, inView, index, count, intervalMs, go, effect]);

  useEffect(() => {
    setIndex(0);
    setPrevIndex(null);
  }, [effect, count]);

  if (count === 0) return null;

  // ---------- Lưới ghép (mosaic) ----------
  if (effect === 'mosaic') {
    return (
      <>
        <style>{STYLES}</style>
        <MosaicGrid images={images} onOpenImage={onOpenImage} />
      </>
    );
  }

  const isPolaroid = effect === 'polaroid';
  const rotFor = (i: number) => `${((i * 37) % 9) - 4}deg`;

  return (
    <div className="w-full">
      <style>{STYLES}</style>
      <div
        ref={stageRef}
        className={`gs-stage rounded-2xl shadow-lg ${isPolaroid ? 'bg-[#F3EDE6]' : 'bg-black'}`}
        style={{ aspectRatio: aspect }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {/* Polaroid: giữ 2 ảnh trước bên dưới tạo cảm giác chồng ảnh */}
        {isPolaroid &&
          [2, 1].map((back) => {
            const i = (index - back + count) % count;
            if (count <= back) return null;
            return (
              <div
                key={`back-${back}`}
                className="gs-layer gs-polaroid"
                style={{ transform: `rotate(${rotFor(i)}) translateY(${back * 4}px)`, opacity: 0.9 - back * 0.15 }}
              >
                <img src={images[i]} alt="" loading="lazy" />
              </div>
            );
          })}

        {!isPolaroid && prevIndex !== null && prevIndex !== index && (
          <div
            key={`prev-${tick}`}
            className="gs-layer"
            style={{ animation: exitAnim(effect, dir), zIndex: 1 }}
          >
            <img src={images[prevIndex]} alt="" />
          </div>
        )}

        <div
          key={`cur-${tick}-${effect}`}
          className={`gs-layer ${isPolaroid ? 'gs-polaroid' : ''}`}
          style={
            {
              animation: enterAnim(effect, dir, index),
              zIndex: 2,
              '--gs-rot': rotFor(index),
            } as React.CSSProperties
          }
          onClick={() => onOpenImage?.(images[index])}
        >
          <img src={images[index]} alt={`Ảnh cưới ${index + 1}`} />
        </div>

        {/* Điều khiển */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1, -1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow cursor-pointer"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-700" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1, 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow cursor-pointer"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="w-5 h-5 text-neutral-700" />
            </button>
          </>
        )}
        <div className="absolute bottom-2 right-2 z-10 flex gap-1.5">
          {count > 1 && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center cursor-pointer"
              aria-label={playing ? 'Tạm dừng trình chiếu' : 'Phát trình chiếu'}
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          )}
          {onOpenImage && (
            <button
              type="button"
              onClick={() => onOpenImage(images[index])}
              className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center cursor-pointer"
              aria-label="Xem ảnh lớn"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="absolute top-2 right-3 z-10 text-[10px] font-mono text-white/90 bg-black/35 px-1.5 py-0.5 rounded">
          {index + 1}/{count}
        </span>
      </div>

      {/* Dải ảnh thu nhỏ */}
      {count > 1 && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 justify-center">
          {images.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => i !== index && go(i, i > index ? 1 : -1)}
              className="shrink-0 w-11 h-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer"
              style={{ borderColor: i === index ? accent : 'transparent', opacity: i === index ? 1 : 0.6 }}
              aria-label={`Ảnh ${i + 1}`}
            >
              <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MosaicGrid: React.FC<{ images: string[]; onOpenImage?: (url: string) => void }> = ({ images, onOpenImage }) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      refs.current.forEach((el) => el?.classList.add('gs-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('gs-visible');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [images]);

  // Mẫu so le: ô lớn xen kẽ ô nhỏ
  const spanFor = (i: number) => (i % 5 === 0 ? 'col-span-2 row-span-2' : i % 7 === 3 ? 'row-span-2' : '');

  return (
    <div className="grid grid-cols-3 auto-rows-[90px] sm:auto-rows-[120px] gap-1.5">
      {images.map((url, i) => (
        <button
          key={`${url}-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          onClick={() => onOpenImage?.(url)}
          className={`gs-mosaic-item relative overflow-hidden rounded-xl group cursor-pointer ${spanFor(i)}`}
          style={{ animationDelay: `${(i % 6) * 90}ms` }}
        >
          <img
            src={url}
            alt={`Ảnh cưới ${i + 1}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </button>
      ))}
    </div>
  );
};
