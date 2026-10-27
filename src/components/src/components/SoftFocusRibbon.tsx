import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Sparkles, Eye, Heart, ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';
import { WeddingTemplate } from '../types/wedding';
import { TEMPLATE_COLLECTIONS } from '../data/premiumTemplates';

interface SoftFocusRibbonProps {
  templates: WeddingTemplate[];
  onSelectTemplate: (template: WeddingTemplate) => void;
  onPreviewTemplate?: (template: WeddingTemplate) => void;
  speed?: number; // pixels per second (default 28)
  title?: string;
  subtitle?: string;
  /** Bộ lọc chủ đề / màu hiển thị dưới tiêu đề. */
  toolbar?: React.ReactNode;
  /** Mở thư viện đầy đủ. */
  onViewAll?: () => void;
  totalCount?: number;
}

export const SoftFocusRibbon: React.FC<SoftFocusRibbonProps> = ({
  templates,
  onSelectTemplate,
  onPreviewTemplate,
  speed = 28,
  title = 'Dải Trưng Bày Mẫu Thiệp Độc Bản',
  subtitle = 'Công nghệ Soft Focus Infinite Ribbon — Tự động chuyển động chậm rãi và lấy nét theo tâm',
  toolbar,
  onViewAll,
  totalCount,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Duplicate items 3 times for seamless wrapping
  const repeatedTemplates = useMemo(() => {
    if (!templates.length) return [];
    return [...templates, ...templates, ...templates];
  }, [templates]);

  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [centerTemplate, setCenterTemplate] = useState<WeddingTemplate | null>(null);
  // Kích thước thẻ dùng khi render (đồng bộ với animState để tránh thẻ chồng nhau trên mobile).
  const [cardW, setCardW] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 192 : 228));

  // Animation & geometry state (stored in refs for 60fps bypass of React render cycles)
  const animState = useRef({
    x: 0,
    stride: 252, // cardWidth + gap
    cardWidth: 228,
    gap: 24,
    containerWidth: 1200,
    singleCycleWidth: 0,
    lastTime: 0,
    rafId: 0,
    isVisible: true,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartOffset: 0,
    dragDistance: 0,
    velocity: 0,
    lastDragTime: 0,
  });

  // Calculate geometry depending on viewport width
  const updateGeometry = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;

    // Khung ảnh giữ đúng tỷ lệ 3:4 của thiệp (không cắt mất viền / chữ).
    const cardWidth = isMobile ? 192 : 228;
    const gap = isMobile ? 16 : 24;
    const stride = cardWidth + gap;
    const singleCycleWidth = templates.length * stride;

    animState.current.containerWidth = cw;
    animState.current.cardWidth = cardWidth;
    animState.current.gap = gap;
    animState.current.stride = stride;
    animState.current.singleCycleWidth = singleCycleWidth;
    setCardW(cardWidth);
  }, [templates.length]);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Frame update logic
  useEffect(() => {
    updateGeometry();

    const handleResize = () => {
      updateGeometry();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // IntersectionObserver to pause when offscreen
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            animState.current.isVisible = entry.isIntersecting;
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(containerRef.current);
    }

    // VisibilityChange to pause when tab hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        animState.current.isVisible = false;
      } else if (containerRef.current) {
        // Re-evaluate visibility
        animState.current.isVisible = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Main animation loop
    let lastCenterIndex = -1;
    const animate = (currentTime: number) => {
      const state = animState.current;
      if (!state.lastTime) state.lastTime = currentTime;
      const deltaTime = (currentTime - state.lastTime) / 1000;
      state.lastTime = currentTime;

      // Auto-advance if active
      if (
        state.isVisible &&
        !isPaused &&
        !isHovered &&
        !state.isDragging &&
        !reducedMotion &&
        state.singleCycleWidth > 0
      ) {
        state.x += speed * deltaTime;

        // Modulo wrap-around for infinite seamless loop
        if (state.x >= state.singleCycleWidth) {
          state.x -= state.singleCycleWidth;
        } else if (state.x < 0) {
          state.x += state.singleCycleWidth;
        }
      }

      // Apply transform to the track
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-state.x}px, 0, 0)`;
      }

      // Soft focus calculations for each card
      const centerX = state.containerWidth / 2;
      const focusRadius = Math.max(state.containerWidth * 0.42, 280);
      let closestDist = Infinity;
      let closestCardIdx = -1;

      cardRefs.current.forEach((cardEl, idx) => {
        if (!cardEl) return;
        const cardCenter = idx * state.stride - state.x + state.cardWidth / 2;
        const dist = Math.abs(cardCenter - centerX);

        // Track closest card for status label
        if (dist < closestDist) {
          closestDist = dist;
          closestCardIdx = idx;
        }

        // Visibility clipping optimization
        if (cardCenter < -state.cardWidth || cardCenter > state.containerWidth + state.cardWidth) {
          cardEl.style.visibility = 'hidden';
          return;
        }
        cardEl.style.visibility = 'visible';

        // Normalized distance [0, 1]
        const normDist = Math.min(1, dist / focusRadius);

        // Mathematical curves for center focus:
        // Center: scale 1.0, opacity 1.0, blur 0px, brightness 1.0
        // Edges: scale ~0.93, opacity ~0.42, blur ~1.2px
        const scale = 1.0 - 0.07 * normDist;
        const opacity = 1.0 - 0.58 * Math.pow(normDist, 1.25);
        const blur = normDist > 0.35 ? (normDist - 0.35) * 1.6 : 0;
        const zIndex = Math.round((1 - normDist) * 30) + 1;

        cardEl.style.transform = `scale(${scale.toFixed(3)})`;
        cardEl.style.opacity = opacity.toFixed(3);
        cardEl.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
        cardEl.style.zIndex = String(zIndex);

        // Highlight center card border and subtle glow
        if (normDist < 0.22) {
          cardEl.classList.add('ribbon-card-focused');
        } else {
          cardEl.classList.remove('ribbon-card-focused');
        }
      });

      // Update state for current center template if changed
      if (closestCardIdx !== -1 && closestCardIdx !== lastCenterIndex) {
        lastCenterIndex = closestCardIdx;
        const realTemplate = repeatedTemplates[closestCardIdx];
        if (realTemplate) {
          setCenterTemplate(realTemplate);
        }
      }

      state.rafId = requestAnimationFrame(animate);
    };

    animState.current.rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animState.current.rafId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (observer) observer.disconnect();
    };
  }, [repeatedTemplates, isPaused, isHovered, reducedMotion, speed, updateGeometry]);

  // Touch and Mouse Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const state = animState.current;
    state.isDragging = true;
    state.dragStartX = e.clientX;
    state.dragStartY = e.clientY;
    state.dragStartOffset = state.x;
    state.dragDistance = 0;
    state.lastDragTime = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = animState.current;
    if (!state.isDragging) return;

    const deltaX = e.clientX - state.dragStartX;
    const deltaY = e.clientY - state.dragStartY;
    state.dragDistance = Math.hypot(deltaX, deltaY);

    // Update horizontal offset directly
    state.x = state.dragStartOffset - deltaX;
    if (state.singleCycleWidth > 0) {
      if (state.x >= state.singleCycleWidth) state.x -= state.singleCycleWidth;
      if (state.x < 0) state.x += state.singleCycleWidth;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const state = animState.current;
    state.isDragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Manual Nudge Navigation
  const nudge = (direction: 'left' | 'right') => {
    const state = animState.current;
    const step = state.stride * 1.5;
    state.x += direction === 'right' ? step : -step;
    if (state.singleCycleWidth > 0) {
      if (state.x >= state.singleCycleWidth) state.x -= state.singleCycleWidth;
      if (state.x < 0) state.x += state.singleCycleWidth;
    }
  };

  return (
    <section className="relative w-full py-12 md:py-20 overflow-hidden bg-gradient-to-b from-transparent via-[#FAF4F0]/60 to-transparent dark:via-[#1A161A]/40 transition-colors duration-200">
      {/* Editorial Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Soft Focus Infinite Ribbon</span>
              <span aria-hidden="true">·</span>
              <span>{totalCount ? `${totalCount} mẫu` : 'Mẫu Độc Bản'}</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#453C45] dark:text-[#F5EDE8] tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#827580] dark:text-[#B9A9B4] max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Interactive Navigation & Playback Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => nudge('left')}
              className="w-10 h-10 rounded-full border border-[#E8B7C8]/40 dark:border-[#3D333D] bg-white dark:bg-[#2A232A] hover:bg-[#F6DCE5]/30 dark:hover:bg-[#332A33] text-[#453C45] dark:text-[#F5EDE8] flex items-center justify-center transition-colors shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C76A82]"
              title="Xem mẫu trước đó"
              aria-label="Xem mẫu trước đó"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="h-10 px-4 rounded-full border border-[#E8B7C8]/40 dark:border-[#3D333D] bg-white dark:bg-[#2A232A] hover:bg-[#F6DCE5]/30 dark:hover:bg-[#332A33] text-[#453C45] dark:text-[#F5EDE8] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C76A82]"
              title={isPaused ? 'Tiếp tục tự động chạy' : 'Tạm dừng dải chạy'}
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-[#C76A82] dark:text-[#E8B7C8] fill-current" />
                  <span>Phát</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#C76A82] dark:text-[#E8B7C8]" />
                  <span>Tạm dừng</span>
                </>
              )}
            </button>

            <button
              onClick={() => nudge('right')}
              className="w-10 h-10 rounded-full border border-[#E8B7C8]/40 dark:border-[#3D333D] bg-white dark:bg-[#2A232A] hover:bg-[#F6DCE5]/30 dark:hover:bg-[#332A33] text-[#453C45] dark:text-[#F5EDE8] flex items-center justify-center transition-colors shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C76A82]"
              title="Xem mẫu tiếp theo"
              aria-label="Xem mẫu tiếp theo"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {toolbar && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 md:-mt-6 mb-2">{toolbar}</div>}

      {/* Center Focus Vignette / Indicator Bar (Subtle luxury framing) */}
      <div className="relative w-full">
        {/* Soft edge gradients for cinematic fade out */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-30 bg-gradient-to-r from-[var(--bg-page)] via-[var(--bg-page)]/80 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-30 bg-gradient-to-l from-[var(--bg-page)] via-[var(--bg-page)]/80 to-transparent" />

        {/* Center Target Indicator (Subtle luxury hairline tick) */}
        <div className="pointer-events-none absolute left-1/2 -top-3 -translate-x-1/2 z-20 flex flex-col items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C76A82] shadow-xs" />
          <div className="w-px h-2.5 bg-[#C76A82]/40" />
        </div>

        {/* The Infinite Ribbon Track Container */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing touch-pan-y py-6"
          style={{
            height: `${Math.round((cardW * 4) / 3) + 150}px`,
            touchAction: 'pan-y',
          }}
        >
          <div
            ref={trackRef}
            className="flex items-center absolute top-4 left-0 will-change-transform"
            style={{
              gap: `${cardW < 200 ? 16 : 24}px`,
            }}
          >
            {repeatedTemplates.map((template, idx) => {
              const cardKey = `${template.id}-${idx}`;

              return (
                <div
                  key={cardKey}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    // Prevent click trigger if the user was dragging
                    if (animState.current.dragDistance > 8) return;
                    onSelectTemplate(template);
                  }}
                  className="group relative shrink-0 rounded-3xl bg-white dark:bg-[#2A232A] border border-[#E8B7C8]/40 dark:border-[#3D333D] overflow-hidden shadow-md hover:shadow-2xl transition-[box-shadow,border-color] duration-300 cursor-pointer will-change-transform flex flex-col"
                  style={{
                    width: `${cardW}px`,
                    height: `${Math.round((cardW * 4) / 3) + 104}px`,
                  }}
                >
                  {/* Wedding Card Image Frame (3:4 ratio) */}
                  <div className="relative w-full aspect-[3/4] shrink-0 overflow-hidden bg-[#FAF4F0] dark:bg-[#201A20]">
                    <img
                      src={template.thumbnail}
                      alt={`Mẫu thiệp ${template.name}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Tier badge (Free / Premium) */}
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white/95 dark:bg-[#1F1A1F]/90 text-[#453C45] dark:text-[#F5EDE8] shadow-xs backdrop-blur-xs">
                        {template.isPremium ? 'Mẫu Premium' : 'Mẫu Miễn Phí'}
                      </span>
                    </div>

                    {/* Category subtle label */}
                    <div className="absolute top-3.5 right-3.5 z-10">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide bg-black/40 text-white backdrop-blur-xs">
                        {template.collection ? TEMPLATE_COLLECTIONS.find((c) => c.id === template.collection)?.short : template.style.split(' ')[0]}
                      </span>
                    </div>

                    {/* Quick action overlay on card image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onPreviewTemplate) {
                            onPreviewTemplate(template);
                          } else {
                            onSelectTemplate(template);
                          }
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-white/95 hover:bg-white text-[#C76A82] text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Nhanh Thiệp</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Description & Information */}
                  <div className="p-4 flex-1 flex flex-col justify-between bg-white dark:bg-[#2A232A]">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#827580] dark:text-[#B9A9B4] mb-1">
                        <span>{template.style}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{template.colorName || template.category}</span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-[#453C45] dark:text-[#F5EDE8] truncate leading-tight group-hover:text-[#C76A82] dark:group-hover:text-[#E8B7C8] transition-colors">
                        {template.name}
                      </h3>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#E8B7C8]/20 dark:border-[#3D333D]">
                      <span className="text-[11px] text-[#827580] dark:text-[#B9A9B4]">
                        {template.design.ornamentStyle === 'botanical' ? 'Họa tiết hoa lá' : 'Phong cách tối giản'}
                      </span>
                      <span className="text-xs font-bold text-[#C76A82] dark:text-[#E8B7C8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Chọn mẫu
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Center Template Preview Bar */}
      {centerTemplate && (
        <div className="max-w-xl mx-auto mt-6 px-4">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#2A232A]/80 border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-sm backdrop-blur-md flex items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#E8B7C8]/30">
                <img
                  src={centerTemplate.thumbnail}
                  alt={centerTemplate.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C76A82] dark:text-[#E8B7C8]">
                    Đang Lấy Nét
                  </span>
                  <span className="text-[11px] text-[#827580] dark:text-[#B9A9B4] truncate">
                    {centerTemplate.style}
                  </span>
                </div>
                <h4 className="font-heading text-sm font-bold text-[#453C45] dark:text-[#F5EDE8] truncate">
                  {centerTemplate.name}
                </h4>
              </div>
            </div>

            <button
              onClick={() => onSelectTemplate(centerTemplate)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4899C] to-[#C76A82] hover:from-[#C76A82] hover:to-[#B0596E] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Tạo Với Mẫu Này</span>
            </button>
          </div>
        </div>
      )}
      {onViewAll && (
        <div className="mt-6 flex justify-center px-4">
          <button
            type="button"
            onClick={onViewAll}
            className="px-5 py-2.5 rounded-full border border-[#C76A82] text-[#C76A82] dark:text-[#E8B7C8] dark:border-[#E8B7C8] text-xs font-bold hover:bg-[#C76A82] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            Xem tất cả mẫu thiệp{totalCount ? ` (${totalCount})` : ''}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
